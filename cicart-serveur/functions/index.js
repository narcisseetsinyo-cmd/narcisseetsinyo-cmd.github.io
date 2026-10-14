/**
 * CIC'ART — serveur de paiement Mobile Money (Mixx by Yas / T-Money et Moov Money / Flooz)
 * via PayGate Global (https://paygateglobal.com).
 *
 * Fonctions :
 *  - initierPaiement       (appelée par l'application) : envoie la demande de paiement sur le téléphone du client
 *  - verifierPaiement      (appelée par l'application) : interroge PayGate et enregistre le paiement s'il est validé
 *  - enregistrerCleMarchand (administrateur)           : enregistre la clé PayGate côté serveur
 *  - paygateCallback       (appelée par PayGate)       : notification de paiement ; toujours revérifiée auprès de PayGate
 *
 * La clé PayGate n'est jamais envoyée aux téléphones : elle reste dans le document Firestore prive/paygate,
 * inaccessible depuis l'application (règles Firestore) et lu uniquement ici.
 */
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

setGlobalOptions({ region: "europe-west1", maxInstances: 5 });

const PAYGATE = "https://paygateglobal.com/api";
const RESEAUX = { TMONEY: "Mixx by Yas (T-Money)", FLOOZ: "Flooz (Moov)" };
const MONTANT_MIN = 100;

/* ---------- utilitaires ---------- */
function aujourdhui() {
  // Lomé est à UTC+0 toute l'année
  return new Date().toISOString().slice(0, 10);
}
function numero(c) {
  return "N° " + String(c.num || 0).padStart(3, "0");
}
async function profilDe(uid) {
  const s = await db.doc(`users/${uid}`).get();
  return s.exists ? s.data() : {};
}
async function cleMarchand() {
  const s = await db.doc("prive/paygate").get();
  const t = s.exists ? s.data().token : "";
  if (!t) throw new HttpsError("failed-precondition", "Le paiement Mobile Money n'est pas encore activé par l'atelier.");
  return t;
}
async function appelPaygate(chemin, corps) {
  const r = await fetch(PAYGATE + chemin, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(corps),
  });
  const texte = await r.text();
  try {
    return JSON.parse(texte);
  } catch (e) {
    logger.error("Réponse PayGate illisible", { chemin, statutHttp: r.status, debut: texte.slice(0, 300) });
    throw new HttpsError("unavailable", "PayGate ne répond pas correctement. Réessayez dans un instant.");
  }
}
function nettoyerTelephone(t) {
  let n = String(t || "").replace(/\D/g, "");
  if (n.startsWith("00228")) n = n.slice(5);
  else if (n.startsWith("228") && n.length === 11) n = n.slice(3);
  return n;
}

/* ---------- vérification et enregistrement d'un paiement ---------- */
async function verifierEtEnregistrer(id) {
  const ref = db.doc(`transactions/${id}`);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const t = snap.data();
  if (t.statut === "paye" || t.statut === "echoue") return t.statut;

  const token = await cleMarchand();
  const st = await appelPaygate("/v2/status", { auth_token: token, identifier: id });
  const code = Number(st.status);
  logger.info("Statut PayGate", { id, code, tx: st.tx_reference });

  if (code === 0) {
    await db.runTransaction(async (tx) => {
      const cur = await tx.get(ref);
      if (cur.data().statut === "paye") return;
      const paye = Math.round(Number(st.amount));
      const montant = paye > 0 ? paye : t.montant;
      const ref2 = st.payment_reference || st.tx_reference || t.txReference || "";
      tx.set(db.doc(`paiements/${id}`), {
        commandeId: t.commandeId,
        clientId: t.clientId,
        montant,
        date: aujourdhui(),
        mode: RESEAUX[t.reseau] || "Autre",
        note: ("Payé via l'application" + (ref2 ? " · réf. " + ref2 : "")).trim(),
        enLigne: true,
        telephone: t.telephone,
      });
      tx.update(ref, {
        statut: "paye",
        montantPaye: montant,
        paymentReference: st.payment_reference || "",
        payeLe: FieldValue.serverTimestamp(),
      });
    });
    return "paye";
  }
  if (code === 4 || code === 6) {
    await ref.update({
      statut: "echoue",
      erreur: code === 4 ? "Délai dépassé : le paiement n'a pas été validé sur le téléphone." : "Paiement annulé.",
      finiLe: FieldValue.serverTimestamp(),
    });
    return "echoue";
  }
  return "en_attente";
}

/* ---------- 1. Demande de paiement ---------- */
exports.initierPaiement = onCall(async (req) => {
  const uid = req.auth && req.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Connectez-vous pour payer.");

  const { commandeId, montant, reseau } = req.data || {};
  const telephone = nettoyerTelephone((req.data || {}).telephone);
  if (!commandeId || typeof commandeId !== "string") throw new HttpsError("invalid-argument", "Commande introuvable.");
  if (!RESEAUX[reseau]) throw new HttpsError("invalid-argument", "Choisissez Mixx by Yas ou Moov Money.");
  if (!/^[279]\d{7}$/.test(telephone)) throw new HttpsError("invalid-argument", "Indiquez un numéro togolais à 8 chiffres, par exemple 90 12 34 56.");
  const amt = Math.round(Number(montant));
  if (!(amt >= MONTANT_MIN)) throw new HttpsError("invalid-argument", `Le montant minimum est de ${MONTANT_MIN} F.`);

  const [cmdSnap, profil, cfg] = await Promise.all([
    db.doc(`commandes/${commandeId}`).get(),
    profilDe(uid),
    db.doc("config/atelier").get(),
  ]);
  if (!cmdSnap.exists) throw new HttpsError("not-found", "Commande introuvable.");
  const cmd = cmdSnap.data();
  const autorise = profil.role === "admin" || (profil.role === "client" && profil.clientId && profil.clientId === cmd.clientId);
  if (!autorise) throw new HttpsError("permission-denied", "Vous ne pouvez pas payer cette commande.");
  if (!(cfg.exists && cfg.data().paiementEnLigne)) throw new HttpsError("failed-precondition", "Le paiement Mobile Money n'est pas encore activé par l'atelier.");

  const fac = await db.doc(`factures/${commandeId}`).get();
  if (!fac.exists) throw new HttpsError("failed-precondition", "Le prix de cette commande n'est pas encore fixé par l'atelier.");
  const prix = Number(fac.data().prix) || 0;
  const pays = await db.collection("paiements").where("commandeId", "==", commandeId).get();
  const deja = pays.docs.reduce((a, d) => a + (Number(d.data().montant) || 0), 0);
  const reste = Math.max(0, prix - deja);
  if (reste <= 0) throw new HttpsError("failed-precondition", "Cette commande est déjà soldée.");
  if (amt > reste) throw new HttpsError("invalid-argument", `Le montant dépasse le reste à payer (${reste} F).`);

  const token = await cleMarchand();
  const ref = db.collection("transactions").doc();
  await ref.set({
    commandeId,
    clientId: cmd.clientId,
    num: cmd.num || 0,
    modele: cmd.modele || "",
    montant: amt,
    reseau,
    telephone,
    statut: "en_attente",
    uid,
    parAdmin: profil.role === "admin",
    cree: FieldValue.serverTimestamp(),
  });

  let res;
  try {
    res = await appelPaygate("/v1/pay", {
      auth_token: token,
      phone_number: telephone,
      amount: amt,
      description: `CIC'ART ${numero(cmd)} ${cmd.modele || ""}`.trim().slice(0, 100),
      identifier: ref.id,
      network: reseau,
    });
  } catch (e) {
    await ref.update({ statut: "echoue", erreur: "PayGate injoignable." });
    throw e instanceof HttpsError ? e : new HttpsError("unavailable", "PayGate est injoignable. Réessayez dans un instant.");
  }

  const code = Number(res.status);
  if (code !== 0) {
    const msg = { 2: "La clé marchande PayGate est invalide. Prévenez l'atelier.", 4: "Paiement refusé par PayGate : vérifiez le numéro et le réseau.", 6: "Une demande identique est déjà en cours." }[code] || "Paiement refusé par PayGate.";
    logger.warn("Refus PayGate", { id: ref.id, code });
    await ref.update({ statut: "echoue", erreur: msg });
    throw new HttpsError("failed-precondition", msg);
  }
  await ref.update({ txReference: String(res.tx_reference || "") });
  return { id: ref.id };
});

/* ---------- 2. Vérification à la demande ---------- */
exports.verifierPaiement = onCall(async (req) => {
  const uid = req.auth && req.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Connectez-vous.");
  const id = (req.data || {}).id;
  if (!id || typeof id !== "string") throw new HttpsError("invalid-argument", "Paiement introuvable.");
  const snap = await db.doc(`transactions/${id}`).get();
  if (!snap.exists) throw new HttpsError("not-found", "Paiement introuvable.");
  const t = snap.data();
  const profil = await profilDe(uid);
  const autorise = t.uid === uid || profil.role === "admin" || (profil.role === "client" && profil.clientId === t.clientId);
  if (!autorise) throw new HttpsError("permission-denied", "Accès refusé.");
  const statut = await verifierEtEnregistrer(id);
  return { statut };
});

/* ---------- 3. Clé marchande (administrateur) ---------- */
exports.enregistrerCleMarchand = onCall(async (req) => {
  const uid = req.auth && req.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Connectez-vous.");
  const profil = await profilDe(uid);
  if (profil.role !== "admin") throw new HttpsError("permission-denied", "Réservé à l'administrateur.");
  const token = String((req.data || {}).token || "").trim();
  if (token === "") {
    await db.doc("prive/paygate").delete();
    await db.doc("config/atelier").set({ paiementEnLigne: false, cleMarchande: false }, { merge: true });
    return { ok: true, supprimee: true };
  }
  if (token.length < 10) throw new HttpsError("invalid-argument", "Cette clé semble incomplète. Copiez-la depuis votre tableau de bord PayGate.");
  await db.doc("prive/paygate").set({ token, majLe: FieldValue.serverTimestamp(), par: uid });
  await db.doc("config/atelier").set({ cleMarchande: true }, { merge: true });
  return { ok: true };
});

/* ---------- 4. Notification de PayGate ---------- */
exports.paygateCallback = onRequest({ invoker: "public" }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(200).send("CIC'ART : adresse de notification PayGate active.");
    return;
  }
  const corps = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const id = String(corps.identifier || "");
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) {
    res.status(400).send("identifier manquant");
    return;
  }
  try {
    // On ne fait jamais confiance au contenu reçu : on redemande le statut à PayGate.
    const statut = await verifierEtEnregistrer(id);
    logger.info("Notification PayGate traitée", { id, statut });
    res.status(200).json({ ok: true });
  } catch (e) {
    logger.error("Erreur notification PayGate", { id, message: e.message });
    res.status(500).json({ ok: false });
  }
});

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return Object.fromEntries(new URLSearchParams(s));
  }
}

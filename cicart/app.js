// CIC'ART — application de gestion d'atelier, connectée à Firebase
import { firebaseConfig, APP_URL } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification,
  updateProfile, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc, query, where, writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-functions.js";

/* ================= Référentiels ================= */
const I = {
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>',
  cmd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 7l3 2v12h10V9l3-2-4-4"/><path d="M8 3c0 2 2 3 4 3s4-1 4-3"/></svg>',
  cli: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-6"/></svg>',
  pay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
  stk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M12 9v12"/></svg>',
  set: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
};
const STATUTS = [["attente", "En attente"], ["coupe", "Coupe"], ["couture", "Couture"], ["essayage", "Essayage"], ["pret", "Prêt"], ["livre", "Livré"]];
const SLABEL = Object.fromEntries(STATUTS);
const MODELES = ["Robe", "Kaba / Slit", "Boubou", "Chemise", "Ensemble pagne", "Pantalon", "Jupe", "Veste / Costume", "Tenue de mariage", "Uniforme", "Retouche", "Autre"];
const MODES = ["Espèces", "Mixx by Yas (T-Money)", "Flooz (Moov)", "Virement", "Autre"];
const MESURES = [["cou", "Tour de cou"], ["epaule", "Épaule"], ["poitrine", "Poitrine"], ["sous_poitrine", "Sous-poitrine"], ["taille", "Tour de taille"], ["bassin", "Bassin / hanches"], ["long_buste", "Longueur buste"], ["long_manche", "Longueur manche"], ["tour_bras", "Tour de bras"], ["poignet", "Poignet"], ["long_robe", "Longueur robe"], ["long_jupe", "Longueur jupe"], ["long_pantalon", "Longueur pantalon"], ["cuisse", "Tour de cuisse"], ["genou", "Genou"], ["bas", "Tour de bas"], ["entrejambe", "Entrejambe"], ["long_chemise", "Longueur chemise"]];
const PAGES = {
  admin: [["dash", "Tableau de bord", "Accueil", I.dash], ["commandes", "Commandes", "Commandes", I.cmd], ["clients", "Clients", "Clients", I.cli], ["paiements", "Paiements", "Paiements", I.pay], ["stock", "Stock", "Stock", I.stk], ["acces", "Équipe & accès", "Accès", I.team], ["reglages", "Réglages", "Réglages", I.set], ["compte", "Mon compte", "Compte", I.user]],
  tailleur: [["dash", "Tableau de bord", "Accueil", I.dash], ["commandes", "Commandes", "Commandes", I.cmd], ["clients", "Clients", "Clients", I.cli], ["compte", "Mon compte", "Compte", I.user]],
  client: [["mescmd", "Mes commandes", "Commandes", I.cmd], ["mesmes", "Mes mesures", "Mesures", I.ruler], ["compte", "Mon compte", "Compte", I.user]]
};
const TABS = { admin: ["dash", "commandes", "clients", "paiements", "stock"], tailleur: ["dash", "commandes", "clients", "compte"], client: ["mescmd", "mesmes", "compte"] };

/* ================= Utilitaires ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nf = new Intl.NumberFormat("fr-FR");
const F = n => nf.format(Math.round(+n || 0)) + " F";
const pad = n => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const parseD = s => { if (!s) return null; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const fmtD = s => { const d = parseD(s); return d ? d.getDate() + " " + MOIS[d.getMonth()] + " " + d.getFullYear() : "—"; };
const daysTo = s => { const d = parseD(s); if (!d) return null; return Math.round((d - parseD(todayStr())) / 864e5); };
const initials = n => (n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const CODE_ALPHA = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const newCode = () => { const a = new Uint32Array(6); crypto.getRandomValues(a); return "CA-" + Array.from(a, x => CODE_ALPHA[x % CODE_ALPHA.length]).join(""); };
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }

/* ================= État ================= */
const S = {
  authUser: null, profile: null, role: null, ready: false,
  clients: [], commandes: [], factures: {}, paiements: [], stock: [], users: [], codes: [], transactions: [],
  config: { nom: "CIC'ART", tel: "", tailleurs: [] }, myClient: null
};
let page = null;
const ui = { q: "", statut: "tous", vue: "kanban", mois: "", cq: "", authMode: "login", authErr: "", busy: false };
try { const v = localStorage.getItem("cicart.vue"); if (v) ui.vue = v; } catch (e) { }

const isAdmin = () => S.role === "admin";
const isStaff = () => S.role === "admin" || S.role === "tailleur";
const clientOf = id => S.clients.find(c => c.id === id) || (S.myClient && S.myClient.id === id ? S.myClient : null);
const cmdOf = id => S.commandes.find(c => c.id === id);
const prixOf = c => (S.factures[c.id] ? +S.factures[c.id].prix || 0 : 0);
const hasPrix = c => !!S.factures[c.id];
const mmActif = () => !!(S.config.paiementEnLigne && S.config.cleMarchande);
const MM = { TMONEY: { nom: "Mixx by Yas", sous: "T-Money · Yas", cls: "yas" }, FLOOZ: { nom: "Moov Money", sous: "Flooz · Moov Africa", cls: "moov" } };
const CALLBACK_URL = "https://europe-west1-" + ((firebaseConfig && firebaseConfig.projectId) || "cicart") + ".cloudfunctions.net/paygateCallback";
const txEnAttente = cmdId => S.transactions.filter(t => t.commandeId === cmdId && t.statut === "en_attente");
const paidFor = id => S.paiements.filter(p => p.commandeId === id).reduce((a, p) => a + (+p.montant || 0), 0);
const resteFor = c => Math.max(0, prixOf(c) - paidFor(c.id));
const cmdNum = c => "N° " + String(c.num || 0).padStart(3, "0");
const codeOf = clientId => { const c = S.codes.find(x => x.clientId === clientId); return c ? c.id : ""; };

/* ================= Firebase ================= */
const configured = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;
let auth = null, db = null, fns = null;
let unsubs = [];
function stopListeners() { unsubs.forEach(u => { try { u(); } catch (e) { } }); unsubs = []; }

if (!configured) {
  renderSetup();
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.languageCode = "fr";
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    db = initializeFirestore(app, {});
  }
  fns = getFunctions(app, "europe-west1");
  getRedirectResult(auth).catch(err => { ui.authErr = authMsg(err); render(); });
  onAuthStateChanged(auth, async u => {
    stopListeners();
    S.authUser = u; S.profile = null; S.role = null; S.ready = false; S.myClient = null;
    ["clients", "commandes", "paiements", "stock", "users", "codes", "transactions"].forEach(k => S[k] = []); S.factures = {};
    if (!u) { page = null; render(); return; }
    render();
    try { await ensureProfile(u); } catch (e) { console.error(e); }
    watchProfile(u);
  });
}

async function ensureProfile(u) {
  const ref = doc(db, "users", u.uid);
  let snap = null;
  try { snap = await getDoc(ref); } catch (e) { snap = null; }
  const base = { nom: u.displayName || (u.email || "").split("@")[0], email: u.email || "", cree: todayStr() };
  if (!snap || !snap.exists()) {
    try { await setDoc(ref, Object.assign({ role: "admin" }, base)); }
    catch (e) { try { await setDoc(ref, Object.assign({ role: "client" }, base)); } catch (e2) { console.error(e2); } }
  } else {
    const p = snap.data();
    if (p.role === "client" && !p.clientId && u.emailVerified) {
      try { await updateDoc(ref, { role: "admin" }); } catch (e) { /* compte non administrateur : normal */ }
    }
  }
}

function watchProfile(u) {
  let lastKey = "";
  const un = onSnapshot(doc(db, "users", u.uid), snap => {
    S.profile = snap.exists() ? snap.data() : null;
    const role = S.profile ? S.profile.role : null;
    const key = role + "|" + (S.profile && S.profile.clientId || "");
    if (key === lastKey) { render(); return; }
    lastKey = key;
    unsubs.filter(x => x !== un).forEach(x => { try { x(); } catch (e) { } });
    unsubs = [un];
    S.role = role;
    if (!PAGES[role] || !PAGES[role].some(p => p[0] === page)) page = startPage();
    startData();
  }, err => { console.error(err); S.ready = true; render(); });
  unsubs.push(un);
}
function startPage() {
  try { const h = location.hash.slice(1); if (S.role && PAGES[S.role].some(p => p[0] === h)) return h; } catch (e) { }
  return S.role === "client" ? "mescmd" : "dash";
}

function listen(ref, fn) {
  const un = onSnapshot(ref, snap => { fn(snap); render(); }, err => { console.warn("Lecture refusée :", err.code); });
  unsubs.push(un);
}
const rows = snap => snap.docs.map(d => Object.assign({ id: d.id }, d.data()));

function startData() {
  S.ready = false; render();
  listen(doc(db, "config", "atelier"), s => { if (s.exists()) S.config = Object.assign({ nom: "CIC'ART", tel: "", tailleurs: [] }, s.data()); });
  if (isStaff()) {
    listen(collection(db, "clients"), s => { S.clients = rows(s); });
    listen(collection(db, "codes"), s => { S.codes = rows(s); });
    listen(collection(db, "commandes"), s => { S.commandes = rows(s); S.ready = true; });
  }
  if (isAdmin()) {
    listen(collection(db, "factures"), s => { const m = {}; s.docs.forEach(d => m[d.id] = d.data()); S.factures = m; });
    listen(collection(db, "paiements"), s => { S.paiements = rows(s); });
    listen(collection(db, "stock"), s => { S.stock = rows(s); });
    listen(collection(db, "users"), s => { S.users = rows(s); });
    listen(query(collection(db, "transactions"), where("statut", "==", "en_attente")), s => { S.transactions = rows(s); });
  }
  if (S.role === "client") {
    const cid = S.profile && S.profile.clientId;
    if (!cid) { S.ready = true; render(); return; }
    listen(doc(db, "clients", cid), s => { S.myClient = s.exists() ? Object.assign({ id: s.id }, s.data()) : null; S.ready = true; });
    listen(query(collection(db, "commandes"), where("clientId", "==", cid)), s => { S.commandes = rows(s); });
    listen(query(collection(db, "factures"), where("clientId", "==", cid)), s => { const m = {}; s.docs.forEach(d => m[d.id] = d.data()); S.factures = m; });
    listen(query(collection(db, "paiements"), where("clientId", "==", cid)), s => { S.paiements = rows(s); });
    listen(query(collection(db, "transactions"), where("clientId", "==", cid)), s => { S.transactions = rows(s); });
  }
  setTimeout(() => { if (!S.ready) { S.ready = true; render(); } }, 4000);
}

/* Écritures : la mise à jour locale est immédiate, l'envoi au serveur se fait dès que possible (même hors ligne). */
function writeErr(e) {
  console.error(e);
  if (e && e.code === "permission-denied") toast("Action non autorisée pour votre compte.");
  else toast("Enregistrement impossible. Vérifiez votre connexion.");
}
function put(col, obj) { const data = Object.assign({}, obj); delete data.id; setDoc(doc(db, col, obj.id), data).catch(writeErr); }
function del(col, id) { deleteDoc(doc(db, col, id)).catch(writeErr); }

/* ================= Rendu ================= */
function render() {
  if (!configured) return;
  const appEl = $("#app"), v = $("#view");
  if (!S.authUser) { appEl.classList.add("bare"); v.innerHTML = vAuth(); $("#layer").innerHTML = ""; return; }
  if (!S.role) { appEl.classList.add("bare"); v.innerHTML = splash("Ouverture de votre espace…"); return; }
  if (S.role === "client" && !(S.profile && S.profile.clientId)) { appEl.classList.add("bare"); v.innerHTML = vLink(); return; }
  if (!S.ready) { appEl.classList.add("bare"); v.innerHTML = splash("Chargement des données…"); return; }
  appEl.classList.remove("bare");
  renderChrome();
  const fn = { dash: vDash, commandes: vCommandes, clients: vClients, paiements: vPaiements, stock: vStock, acces: vAcces, reglages: vReglages, compte: vCompte, mescmd: vMesCmd, mesmes: vMesMes }[page] || vDash;
  const ae = document.activeElement; const focusId = ae && ae.id; let sel = null; try { sel = ae && ae.selectionStart; } catch (e) { }
  v.innerHTML = installTip() + verifyBanner() + fn();
  if (focusId) { const el = document.getElementById(focusId); if (el && v.contains(el)) { el.focus(); try { el.setSelectionRange(sel, sel); } catch (e) { } } }
}
function splash(msg) { return `<div class="auth"><div class="auth-card"><div class="brand"><div class="mark">CA</div><div><b>CIC'ART</b><small>${esc(msg)}</small></div></div></div></div>`; }
function renderChrome() {
  const pages = PAGES[S.role];
  $("#nav").innerHTML = pages.map(([k, l, , ic]) => `<button data-go="${k}" ${k === page ? 'aria-current="page"' : ""}>${ic}${l}</button>`).join("");
  const tabs = TABS[S.role].map(k => pages.find(p => p[0] === k));
  const tb = $("#tabbar"); tb.style.gridTemplateColumns = `repeat(${tabs.length},1fr)`;
  tb.innerHTML = tabs.map(([k, , s, ic]) => `<button data-go="${k}" ${k === page ? 'aria-current="page"' : ""}>${ic}${s}</button>`).join("");
  $("#sideSub").textContent = S.config.nom && S.config.nom !== "CIC'ART" ? S.config.nom : "Gestion d'atelier";
  const roleTxt = { admin: "Administrateur", tailleur: "Tailleur", client: "Client" }[S.role];
  $("#sideFoot").innerHTML = `<span class="sync ok"><i></i><span>Synchronisé en temps réel</span></span><span>${esc(S.profile && S.profile.nom || "")} · <span class="role ${S.role}">${roleTxt}</span></span>`;
  const gear = S.role === "admin" ? `<button class="icon-btn" data-go="reglages" aria-label="Réglages" style="width:38px;height:38px">${I.set.replace("<svg ", '<svg width="20" height="20" ')}</button><button class="icon-btn" data-go="acces" aria-label="Équipe et accès" style="width:38px;height:38px">${I.team.replace("<svg ", '<svg width="20" height="20" ')}</button>` : "";
  $("#mtop").innerHTML = `<div class="brand"><div class="mark">CA</div><div><b>CIC'ART</b></div></div><div class="actions" style="gap:8px">${isStaff() ? '<button class="btn green sm" data-act="newCmd">+ Commande</button>' : ""}${gear}</div>`;
}
function go(p) { page = p; try { history.replaceState(null, "", "#" + p); } catch (e) { } closeSheet(); render(); window.scrollTo(0, 0); }

/* ---------- Connexion ---------- */
function vAuth() {
  const signup = ui.authMode === "signup", reset = ui.authMode === "reset";
  return `<div class="auth"><div class="auth-card">
  <div class="brand"><div class="mark">CA</div><div><b>CIC'ART</b><small>Atelier de couture</small></div></div>
  <div><div class="eyebrow">${reset ? "Mot de passe oublié" : signup ? "Créer un compte" : "Connexion"}</div>
  <h1 style="font-size:clamp(30px,8vw,40px)">${reset ? "Recevez un <em>lien</em>." : signup ? "Bienvenue <em>chez nous</em>." : "Votre atelier, <em>partout</em>."}</h1></div>
  <div class="panel">
  ${reset ? "" : `<button class="btn google block" data-act="google"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2s.1-1.4.4-2V7.2H2.1a11 11 0 0 0 0 9.6L5.7 14Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.2L5.7 10c.9-2.6 3.4-4.6 6.3-4.6Z"/></svg>Continuer avec Google</button>
  <div class="divider">ou avec votre e-mail</div>`}
  <form id="fAuth" class="stack" style="gap:12px">
    ${signup ? `<div class="field"><label for="aNom">Nom complet</label><input class="input" id="aNom" autocomplete="name" required></div>` : ""}
    <div class="field"><label for="aEmail">E-mail</label><input class="input" id="aEmail" type="email" autocomplete="email" required></div>
    ${reset ? "" : `<div class="field"><label for="aPass">Mot de passe</label><input class="input" id="aPass" type="password" autocomplete="${signup ? "new-password" : "current-password"}" minlength="6" required></div>`}
    ${ui.authErr ? `<p class="err">${esc(ui.authErr)}</p>` : ""}
    <button class="btn block" type="submit" ${ui.busy ? "disabled" : ""}>${reset ? "Envoyer le lien" : signup ? "Créer mon compte" : "Se connecter"}</button>
  </form>
  <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
    ${signup || reset ? `<button class="linkish" data-auth="login">J'ai déjà un compte</button>` : `<button class="linkish" data-auth="signup">Créer un compte</button><button class="linkish" data-auth="reset">Mot de passe oublié ?</button>`}
  </div></div>
  <p class="muted" style="font-size:13px;margin:0">Client de l'atelier ? Créez votre compte, puis saisissez le code client que l'atelier vous a remis.</p>
  ${isStandalone() ? "" : `<a class="linkish" href="installer.html">Installer CIC'ART sur ce téléphone ou cet ordinateur</a>`}
  </div></div>`;
}
function authMsg(e) {
  const c = e && e.code || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "E-mail ou mot de passe incorrect.";
  if (c.includes("email-already-in-use")) return "Un compte existe déjà avec cet e-mail. Connectez-vous.";
  if (c.includes("weak-password")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (c.includes("invalid-email")) return "Cette adresse e-mail n'est pas valide.";
  if (c.includes("network")) return "Pas de connexion Internet. Réessayez une fois connecté.";
  if (c.includes("too-many-requests")) return "Trop de tentatives. Patientez quelques minutes.";
  if (c.includes("unauthorized-domain")) return "Ce site n'est pas autorisé dans Firebase (Authentication > Paramètres > Domaines autorisés).";
  if (c.includes("popup-closed") || c.includes("cancelled-popup")) return "";
  return "La connexion a échoué. Réessayez, ou utilisez l'e-mail et le mot de passe.";
}

/* ---------- Liaison du code client ---------- */
function vLink() {
  return `<div class="auth"><div class="auth-card">
  <div class="brand"><div class="mark">CA</div><div><b>CIC'ART</b><small>${esc(S.authUser.email || "")}</small></div></div>
  <div><div class="eyebrow">Dernière étape</div><h1 style="font-size:clamp(30px,8vw,40px)">Votre <em>code client</em>.</h1>
  <p class="lede">Saisissez le code que l'atelier vous a remis (par exemple <b>CA-7K4P9X</b>) pour retrouver vos commandes et vos mesures.</p></div>
  <form id="fLink" class="panel"><div class="field"><label for="lCode">Code client</label><input class="input" id="lCode" autocapitalize="characters" autocomplete="off" placeholder="CA-XXXXXX" required style="font-size:18px;letter-spacing:.08em"></div>
  ${ui.authErr ? `<p class="err">${esc(ui.authErr)}</p>` : ""}
  <button class="btn block" type="submit" ${ui.busy ? "disabled" : ""}>Valider</button></form>
  <p class="muted" style="font-size:13px;margin:0">Vous travaillez à l'atelier ? Demandez à l'administrateur d'activer votre accès tailleur, puis rouvrez l'application.</p>
  <button class="linkish" data-act="logout">Se déconnecter</button>
  </div></div>`;
}

function verifyBanner() {
  const u = S.authUser;
  if (!u || u.emailVerified || !(u.providerData || []).some(p => p.providerId === "password")) return "";
  return `<div class="banner"><p>Confirmez votre adresse e-mail grâce au lien reçu par e-mail.</p><div class="actions"><button class="btn sm ghost" data-act="resendVerif">Renvoyer le lien</button><button class="btn sm ghost" data-act="checkVerif">J'ai confirmé</button></div></div>`;
}

/* ================= Vues équipe ================= */
function vDash() {
  const t = todayStr(), ym = t.slice(0, 7), d = new Date();
  const actives = S.commandes.filter(c => c.statut !== "livre");
  const semaine = actives.filter(c => { const x = daysTo(c.livraison); return x !== null && x <= 7; });
  const retard = actives.filter(c => { const x = daysTo(c.livraison); return x !== null && x < 0; });
  const encMois = S.paiements.filter(p => (p.date || "").slice(0, 7) === ym).reduce((a, p) => a + (+p.montant || 0), 0);
  const reste = S.commandes.reduce((a, c) => a + resteFor(c), 0);
  const nbImp = S.commandes.filter(c => resteFor(c) > 0).length;
  const sansPrix = isAdmin() ? S.commandes.filter(c => !hasPrix(c) && c.statut !== "livre").length : 0;
  const bas = S.stock.filter(s => (+s.quantite || 0) <= (+s.seuil || 0));
  const h = d.getHours(), salut = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
  const prenom = (S.profile && S.profile.nom || "").split(" ")[0];
  const upcoming = actives.filter(c => c.livraison).sort((a, b) => a.livraison.localeCompare(b.livraison)).slice(0, 6);
  const colors = { attente: "#9ba9cc", coupe: "#a9c6ff", couture: "#3d7af5", essayage: "#f0b44c", pret: "#8cc152" };
  const maxS = Math.max(1, ...STATUTS.slice(0, 5).map(([k]) => actives.filter(c => c.statut === k).length));
  const kpis = isAdmin() ? `
    <div class="kpi hero"><span>Encaissé ce mois</span><strong>${F(encMois)}</strong><small>${MOIS[d.getMonth()]} ${d.getFullYear()}</small></div>
    <div class="kpi"><span>Reste à encaisser</span><strong>${F(reste)}</strong><small>${nbImp} commande${nbImp > 1 ? "s" : ""} non soldée${nbImp > 1 ? "s" : ""}</small></div>
    <div class="kpi"><span>À livrer sous 7 j</span><strong>${semaine.length}</strong><small>${retard.length} en retard</small></div>
    <div class="kpi"><span>Clients</span><strong>${S.clients.length}</strong><small>${bas.length} article${bas.length > 1 ? "s" : ""} en stock bas</small></div>` : `
    <div class="kpi hero"><span>En cours</span><strong>${actives.length}</strong><small>commandes dans l'atelier</small></div>
    <div class="kpi"><span>À livrer sous 7 j</span><strong>${semaine.length}</strong><small>${retard.length} en retard</small></div>
    <div class="kpi"><span>Prêtes</span><strong>${actives.filter(c => c.statut === "pret").length}</strong><small>à remettre au client</small></div>
    <div class="kpi"><span>Clients</span><strong>${S.clients.length}</strong><small>dans le carnet</small></div>`;
  return `<div class="page-head"><div><div class="eyebrow">${esc(S.config.nom || "Atelier")} · ${d.getDate()} ${MOIS[d.getMonth()]}</div>
  <h1>${salut}${prenom ? " " + esc(prenom) : ""},<br><em>au travail.</em></h1>
  <p class="lede"><b>${actives.length} commande${actives.length > 1 ? "s" : ""} en cours</b>${retard.length ? `, dont <b style="color:#ff9b9b">${retard.length} en retard</b>` : ""}.${sansPrix ? ` <b style="color:var(--amber)">${sansPrix} sans prix fixé.</b>` : ""}</p></div>
  <div class="actions"><button class="btn" data-act="newCmd">${I.plus}Nouvelle commande</button><button class="btn ghost" data-act="newClient">Nouveau client</button></div></div>
  <div class="kpis">${kpis}</div>
  <div class="grid-dash">
    <section class="panel span-7"><div class="panel-head"><h3>Prochaines livraisons</h3><button class="btn sm ghost" data-go="commandes">Tout voir</button></div>
      ${upcoming.length ? `<div class="rows">${upcoming.map(rowCmd).join("")}</div>` : `<div class="empty"><b>Aucune livraison prévue</b>Créez une commande pour la voir ici.</div>`}</section>
    <section class="panel span-5"><div class="panel-head"><h3>Dans l'atelier</h3></div>
      <div class="pipeline">${STATUTS.slice(0, 5).map(([k, l]) => { const n = actives.filter(c => c.statut === k).length; return `<div class="pipe-row" style="color:${colors[k]}"><span style="color:var(--fg)">${l}</span><div class="bar"><i style="width:${n / maxS * 100}%"></i></div><b style="color:var(--fg)">${n}</b></div>`; }).join("")}</div></section>
    ${isAdmin() ? `<section class="panel span-7"><div class="panel-head"><h3>Recettes des 6 derniers mois</h3></div><div class="chart">${chartRecettes()}</div></section>
    <section class="panel span-5"><div class="panel-head"><h3>Stock à réapprovisionner</h3><button class="btn sm ghost" data-go="stock">Stock</button></div>
      ${bas.length ? `<div class="rows">${bas.map(s => `<div class="row" data-open-stock="${s.id}"><div class="avatar" style="color:#ff9b9b;background:var(--red-soft)">!</div><div class="who"><b>${esc(s.nom)}</b><small>Seuil : ${s.seuil} ${esc(s.unite)}</small></div><b class="num">${s.quantite} ${esc(s.unite)}</b></div>`).join("")}</div>` : `<div class="empty"><b>Stock suffisant</b>Aucun article sous son seuil d'alerte.</div>`}</section>` : ""}
  </div>`;
}
function rowCmd(c) {
  const cl = clientOf(c.clientId), dd = daysTo(c.livraison), d = parseD(c.livraison);
  const late = dd !== null && dd < 0 && c.statut !== "livre";
  const when = dd === null ? "" : dd === 0 ? "aujourd'hui" : dd === 1 ? "demain" : dd < 0 ? `${-dd} j de retard` : `dans ${dd} j`;
  return `<div class="row" data-open-cmd="${c.id}"><div class="date-tile ${late ? "late" : ""}"><b>${d ? d.getDate() : "—"}</b><small>${d ? MOIS[d.getMonth()].replace(".", "") : ""}</small></div>
  <div class="who"><b>${esc(cl ? cl.nom : "Client supprimé")}</b><small>${esc(c.modele)} · ${cmdNum(c)}${when ? " · " + when : ""}</small></div>
  <span class="pill s-${c.statut}">${SLABEL[c.statut] || ""}</span></div>`;
}
function chartRecettes() {
  const now = new Date(), months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: d.getFullYear() + "-" + pad(d.getMonth() + 1), label: MOIS[d.getMonth()], v: 0 }); }
  S.paiements.forEach(p => { const m = months.find(x => x.key === (p.date || "").slice(0, 7)); if (m) m.v += +p.montant || 0; });
  const max = Math.max(...months.map(m => m.v));
  const W = 560, H = 220, pl = 10, pr = 10, pt = 26, pb = 28, bw = (W - pl - pr) / months.length;
  const step = niceStep(max), top = Math.max(step, Math.ceil(max / step) * step);
  const y = v => pt + (H - pt - pb) * (1 - v / top);
  let g = ""; for (let v = 0; v <= top; v += step) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="#1a2a59" stroke-width="1"/>`;
  const bars = months.map((m, i) => {
    const x = pl + i * bw + bw * .2, w = bw * .6, yy = y(m.v), last = i === months.length - 1;
    return `<rect x="${x}" y="${yy}" width="${w}" height="${Math.max(0, H - pb - yy)}" rx="6" fill="${last ? "#3d7af5" : "#2a4a96"}"/><text x="${x + w / 2}" y="${H - pb + 18}" text-anchor="middle">${m.label}</text>${m.v ? `<text class="val" x="${x + w / 2}" y="${yy - 8}" text-anchor="middle">${short(m.v)}</text>` : ""}`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Recettes mensuelles en francs CFA">${g}${bars}</svg>`;
}
function niceStep(max) { if (max <= 0) return 10000; const raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function short(v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace(".", ",") + " M" : v >= 1e3 ? Math.round(v / 1e3) + " k" : String(v); }

function filteredCmds() {
  const q = ui.q.toLowerCase();
  return S.commandes.filter(c => {
    const cl = clientOf(c.clientId);
    if (ui.statut === "retard") { const d = daysTo(c.livraison); if (!(d !== null && d < 0 && c.statut !== "livre")) return false; }
    else if (ui.statut === "impaye") { if (resteFor(c) <= 0) return false; }
    else if (ui.statut === "sansprix") { if (hasPrix(c)) return false; }
    else if (ui.statut !== "tous" && c.statut !== ui.statut) return false;
    if (!q) return true;
    return [cl && cl.nom, c.modele, c.description, c.tissu, c.tailleur, cmdNum(c)].join(" ").toLowerCase().includes(q);
  }).sort((a, b) => (a.livraison || "9").localeCompare(b.livraison || "9"));
}
function vCommandes() {
  const list = filteredCmds(), cnt = k => S.commandes.filter(c => c.statut === k).length;
  const nRet = S.commandes.filter(c => { const d = daysTo(c.livraison); return d !== null && d < 0 && c.statut !== "livre"; }).length;
  const chips = [["tous", "Toutes", S.commandes.length], ...STATUTS.map(([k, l]) => [k, l, cnt(k)]), ["retard", "En retard", nRet]];
  if (isAdmin()) chips.push(["impaye", "Non soldées", S.commandes.filter(c => resteFor(c) > 0).length], ["sansprix", "Sans prix", S.commandes.filter(c => !hasPrix(c)).length]);
  let body;
  if (!S.commandes.length) body = `<div class="empty"><b>Aucune commande pour l'instant</b>Enregistrez la première commande d'un client avec le bouton « Nouvelle commande ».</div>`;
  else if (!list.length) body = `<div class="empty"><b>Aucun résultat</b>Changez le filtre ou la recherche.</div>`;
  else if (ui.vue === "kanban" && ui.statut === "tous") {
    body = `<div class="kanban">${STATUTS.map(([k, l]) => { const cs = list.filter(c => c.statut === k); return `<div class="col"><div class="col-head"><span class="pill s-${k}">${l}</span><b class="num muted">${cs.length}</b></div>${cs.map(cardCmd).join("") || '<small class="muted" style="padding:4px">Rien ici</small>'}</div>`; }).join("")}</div>`;
  } else {
    body = `<div class="table-wrap"><table><thead><tr><th>N°</th><th>Client</th><th>Modèle</th><th>Livraison</th><th>Statut</th>${isAdmin() ? '<th class="r">Prix</th><th class="r">Reste</th>' : "<th>Tailleur</th>"}</tr></thead><tbody>${list.map(c => {
      const cl = clientOf(c.clientId), dd = daysTo(c.livraison), late = dd !== null && dd < 0 && c.statut !== "livre", r = resteFor(c);
      return `<tr data-open-cmd="${c.id}"><td class="num muted">${cmdNum(c)}</td><td><b>${esc(cl ? cl.nom : "—")}</b></td><td>${esc(c.modele)}</td><td class="num">${fmtD(c.livraison)} ${late ? '<span class="pill tag-late">retard</span>' : ""}</td><td><span class="pill s-${c.statut}">${SLABEL[c.statut]}</span></td>${isAdmin() ? `<td class="r num">${hasPrix(c) ? F(prixOf(c)) : '<span style="color:var(--amber)">À fixer</span>'}</td><td class="r num" style="color:${r > 0 ? "#ff9b9b" : "var(--green)"}">${!hasPrix(c) ? "—" : r > 0 ? F(r) : "Soldé"}</td>` : `<td>${esc(c.tailleur || "—")}</td>`}</tr>`;
    }).join("")}</tbody></table></div>`;
  }
  return `<div class="page-head"><div><div class="eyebrow">Suivi de fabrication</div><h1>Commandes</h1><p class="lede">De la prise de mesures à la livraison, chaque tenue avance d'étape en étape.</p></div>
  <button class="btn" data-act="newCmd">${I.plus}Nouvelle commande</button></div>
  <div class="toolbar"><div class="search">${I.search}<input class="input" id="qCmd" placeholder="Client, modèle, tissu, tailleur…" value="${esc(ui.q)}"></div>
  <div class="chips"><button class="chip" data-vue="kanban" aria-pressed="${ui.vue === "kanban"}">Tableau</button><button class="chip" data-vue="liste" aria-pressed="${ui.vue === "liste"}">Liste</button></div></div>
  <div class="chips" style="margin-bottom:18px">${chips.map(([k, l, n]) => `<button class="chip" data-statut="${k}" aria-pressed="${ui.statut === k}">${l}<span class="n">${n}</span></button>`).join("")}</div>
  ${body}`;
}
function cardCmd(c) {
  const cl = clientOf(c.clientId), dd = daysTo(c.livraison), late = dd !== null && dd < 0 && c.statut !== "livre";
  const pct = prixOf(c) ? Math.min(100, paidFor(c.id) / prixOf(c) * 100) : 0;
  return `<div class="card" data-open-cmd="${c.id}"><div class="t"><span class="num">${cmdNum(c)}</span><span>${esc(c.tailleur || "")}</span></div>
  <b>${esc(cl ? cl.nom : "—")}</b><span class="muted" style="font-size:13.5px">${esc(c.modele)}${c.tissu ? " · " + esc(c.tissu) : ""}</span>
  ${isAdmin() ? `<div class="progress" title="Payé ${Math.round(pct)} %"><i style="width:${pct}%"></i></div>` : ""}
  <div class="meta"><span class="num" style="${late ? "color:#ff9b9b;font-weight:700" : ""}">${c.livraison ? "Livr. " + fmtD(c.livraison) : "Sans date"}</span>${isAdmin() ? `<span class="num">${hasPrix(c) ? F(prixOf(c)) : '<span style="color:var(--amber)">Prix à fixer</span>'}</span>` : ""}</div></div>`;
}

function vClients() {
  const q = ui.cq.toLowerCase();
  const list = S.clients.filter(c => !q || [c.nom, c.tel, c.adresse, codeOf(c.id)].join(" ").toLowerCase().includes(q)).sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
  const linked = new Set(S.users.filter(u => u.clientId).map(u => u.clientId));
  return `<div class="page-head"><div><div class="eyebrow">Carnet de mesures</div><h1>Clients</h1><p class="lede">Coordonnées, mensurations, historique et code d'accès de chaque client.</p></div>
  <button class="btn" data-act="newClient">${I.plus}Nouveau client</button></div>
  <div class="toolbar"><div class="search">${I.search}<input class="input" id="qCli" placeholder="Nom, téléphone, quartier, code…" value="${esc(ui.cq)}"></div></div>
  ${!S.clients.length ? `<div class="empty"><b>Le carnet est vide</b>Ajoutez un client et ses mesures pour commencer.</div>` : !list.length ? `<div class="empty"><b>Aucun client trouvé</b>Vérifiez l'orthographe ou le numéro.</div>` :
    `<div class="client-grid">${list.map(c => {
      const cs = S.commandes.filter(k => k.clientId === c.id), enC = cs.filter(k => k.statut !== "livre").length, r = cs.reduce((a, k) => a + resteFor(k), 0);
      return `<div class="ccard" data-open-client="${c.id}"><div class="avatar">${esc(initials(c.nom))}</div><div class="who"><b>${esc(c.nom)}</b><small class="num">${esc(c.tel || "Pas de téléphone")}</small><small>${cs.length} commande${cs.length > 1 ? "s" : ""}${enC ? ` · ${enC} en cours` : ""}${isAdmin() && r > 0 ? ` · <span style="color:#ff9b9b">doit ${F(r)}</span>` : ""}${isAdmin() && linked.has(c.id) ? ' · <span style="color:var(--green)">appli activée</span>' : ""}</small></div></div>`;
    }).join("")}</div>`}`;
}

function vPaiements() {
  const months = [...new Set(S.paiements.map(p => (p.date || "").slice(0, 7)).filter(Boolean))].sort().reverse();
  const list = S.paiements.filter(p => !ui.mois || (p.date || "").startsWith(ui.mois)).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const tot = list.reduce((a, p) => a + (+p.montant || 0), 0);
  const parMode = MODES.map(m => [m, list.filter(p => p.mode === m).reduce((a, p) => a + (+p.montant || 0), 0)]).filter(x => x[1] > 0);
  const ml = k => { const [y, m] = k.split("-"); return MOIS[+m - 1] + " " + y; };
  return `<div class="page-head"><div><div class="eyebrow">Caisse · visible par l'administrateur seul</div><h1>Paiements</h1><p class="lede">Acomptes et soldes reçus, en espèces ou par mobile money.</p></div>
  <button class="btn" data-act="newPay">${I.plus}Enregistrer un paiement</button></div>
  <div class="kpis"><div class="kpi hero"><span>Total ${ui.mois ? ml(ui.mois) : "toutes périodes"}</span><strong>${F(tot)}</strong><small>${list.length} paiement${list.length > 1 ? "s" : ""}</small></div>
  ${parMode.slice(0, 3).map(([m, v]) => `<div class="kpi"><span>${esc(m.split(" (")[0])}</span><strong>${F(v)}</strong><small>${tot ? Math.round(v / tot * 100) : 0} % du total</small></div>`).join("")}</div>
  ${S.transactions.length ? `<section class="panel" style="margin-bottom:18px"><div class="panel-head"><h3>Mobile Money en attente de validation</h3></div><div class="stack" style="gap:10px">${S.transactions.map(t => { const cl = clientOf(t.clientId); return `<div class="mm-pending"><span class="mm-dot"></span><div style="min-width:0;flex:1"><b>${F(t.montant)} · ${esc(cl ? cl.nom : "—")}</b><small>N° ${String(t.num || 0).padStart(3, "0")} · ${esc((MM[t.reseau] || {}).nom || "")} · ${esc(fmtTel(t.telephone))}</small></div><button class="btn sm ghost" data-act="mmVerify" data-id="${t.id}">Vérifier</button></div>`; }).join("")}</div></section>` : ""}
  <div class="chips" style="margin-bottom:18px"><button class="chip" data-mois="" aria-pressed="${!ui.mois}">Tout</button>${months.map(m => `<button class="chip" data-mois="${m}" aria-pressed="${ui.mois === m}">${ml(m)}</button>`).join("")}</div>
  ${list.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Commande</th><th>Mode</th><th>Note</th><th class="r">Montant</th></tr></thead><tbody>${list.map(p => {
    const c = cmdOf(p.commandeId), cl = clientOf(p.clientId || (c && c.clientId));
    return `<tr data-open-pay="${p.id}"><td class="num">${fmtD(p.date)}</td><td><b>${esc(cl ? cl.nom : "—")}</b></td><td class="muted">${c ? cmdNum(c) + " · " + esc(c.modele) : "—"}</td><td>${esc(p.mode)}</td><td class="muted">${esc(p.note || "")}</td><td class="r num"><b>${F(p.montant)}</b></td></tr>`;
  }).join("")}</tbody></table></div>` : `<div class="empty"><b>Aucun paiement</b>Enregistrez un acompte depuis une commande ou avec le bouton ci-dessus.</div>`}`;
}

function vStock() {
  const list = [...S.stock].sort((a, b) => (a.categorie || "").localeCompare(b.categorie || "") || (a.nom || "").localeCompare(b.nom || ""));
  const val = S.stock.reduce((a, s) => a + (+s.quantite || 0) * (+s.prix || 0), 0);
  const bas = S.stock.filter(s => (+s.quantite || 0) <= (+s.seuil || 0)).length;
  return `<div class="page-head"><div><div class="eyebrow">Magasin · visible par l'administrateur seul</div><h1>Stock</h1><p class="lede">Tissus et fournitures, avec alerte quand un article passe sous son seuil.</p></div>
  <button class="btn" data-act="newStock">${I.plus}Ajouter un article</button></div>
  <div class="kpis"><div class="kpi"><span>Articles</span><strong>${S.stock.length}</strong><small>tissus et fournitures</small></div><div class="kpi"><span>Valeur du stock</span><strong>${F(val)}</strong><small>au prix d'achat</small></div><div class="kpi"><span>En alerte</span><strong style="color:${bas ? "#ff9b9b" : "var(--green)"}">${bas}</strong><small>sous le seuil</small></div></div>
  ${list.length ? `<div class="table-wrap"><table><thead><tr><th>Article</th><th>Catégorie</th><th>Quantité</th><th class="r">Seuil</th><th class="r">Prix unit.</th><th>État</th></tr></thead><tbody>${list.map(s => {
    const low = (+s.quantite || 0) <= (+s.seuil || 0);
    return `<tr data-open-stock="${s.id}"><td><b>${esc(s.nom)}</b></td><td class="muted">${esc(s.categorie)}</td><td><span class="qty"><button class="icon-btn" data-adj="${s.id}" data-d="-1" aria-label="Retirer 1">−</button><b>${s.quantite} ${esc(s.unite)}</b><button class="icon-btn" data-adj="${s.id}" data-d="1" aria-label="Ajouter 1">+</button></span></td><td class="r num">${s.seuil}</td><td class="r num">${F(s.prix)}</td><td>${low ? '<span class="pill tag-late">À racheter</span>' : '<span class="pill s-pret">OK</span>'}</td></tr>`;
  }).join("")}</tbody></table></div>` : `<div class="empty"><b>Aucun article</b>Ajoutez vos tissus, fils, boutons et fermetures.</div>`}`;
}

function vAcces() {
  const order = { admin: 0, tailleur: 1, client: 2 };
  const us = [...S.users].sort((a, b) => (order[a.role] - order[b.role]) || (a.nom || "").localeCompare(b.nom || ""));
  const roleTxt = { admin: "Administrateur", tailleur: "Tailleur", client: "Client" };
  return `<div class="page-head"><div><div class="eyebrow">Sécurité</div><h1>Équipe & accès</h1><p class="lede">Chaque personne qui crée un compte arrive comme <b>client</b>. Passez vos employés en <b>tailleur</b> : ils verront commandes, clients et mesures, jamais l'argent ni le stock.</p></div></div>
  ${us.length ? `<div class="table-wrap"><table><thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>Fiche client liée</th><th></th></tr></thead><tbody>${us.map(u => {
    const cl = u.clientId ? clientOf(u.clientId) : null;
    const me = S.authUser && u.id === S.authUser.uid;
    return `<tr><td><b>${esc(u.nom || "—")}</b>${me ? ' <span class="muted">(vous)</span>' : ""}</td><td class="muted">${esc(u.email || "")}</td><td><span class="role ${u.role}">${roleTxt[u.role] || u.role}</span></td><td>${cl ? esc(cl.nom) : u.role === "client" ? '<span class="muted">Pas encore de code saisi</span>' : "—"}</td><td class="r">${me || u.role === "admin" ? "" : u.role === "tailleur" ? `<button class="btn sm ghost" data-act="setRole" data-id="${u.id}" data-role="client">Retirer l'accès tailleur</button>` : `<button class="btn sm" data-act="setRole" data-id="${u.id}" data-role="tailleur">Passer tailleur</button>`}</td></tr>`;
  }).join("")}</tbody></table></div>` : `<div class="empty"><b>Aucun compte</b>Les comptes apparaissent ici dès que quelqu'un se connecte à l'application.</div>`}
  <p class="muted" style="font-size:13px;margin-top:14px">Pour ajouter un administrateur, ajoutez son adresse e-mail dans les règles Firestore (fonction isAdmin).</p>`;
}

function vReglages() {
  const c = S.config;
  return `<div class="page-head"><div><div class="eyebrow">Atelier</div><h1>Réglages</h1><p class="lede">Informations de l'atelier, export et import des données.</p></div><div class="actions"><button class="btn ghost" data-go="compte">Mon compte</button><button class="btn ghost" data-act="logout">Se déconnecter</button></div></div>
  <div class="grid-dash"><section class="panel span-6"><div class="panel-head"><h3>Atelier</h3></div>
  <form id="fCfg" class="form-grid"><div class="field full"><label for="cfgNom">Nom de l'atelier</label><input class="input" id="cfgNom" value="${esc(c.nom)}"></div>
  <div class="field full"><label for="cfgTel">Téléphone (visible par les clients)</label><input class="input" id="cfgTel" value="${esc(c.tel)}"></div>
  <div class="field full"><label for="cfgTail">Tailleurs (séparés par des virgules)</label><input class="input" id="cfgTail" value="${esc((c.tailleurs || []).join(", "))}"></div>
  <div class="full"><button class="btn" type="submit">Enregistrer</button></div></form></section>
  <section class="panel span-6"><div class="panel-head"><h3>Données</h3></div>
  <p class="muted" style="margin-top:0">Vos données sont enregistrées en ligne dans Firebase et partagées en temps réel. L'application continue de fonctionner sans Internet et envoie les modifications au retour du réseau.</p>
  <div class="actions"><button class="btn ghost" data-act="export" data-what="commandes">Commandes (CSV)</button><button class="btn ghost" data-act="export" data-what="clients">Clients (CSV)</button><button class="btn ghost" data-act="export" data-what="paiements">Paiements (CSV)</button></div>
  <div class="panel-head" style="margin-top:22px"><h3>Importer une sauvegarde</h3></div>
  <p class="muted" style="margin-top:0">Reprenez les données d'une sauvegarde faite avec la version hors ligne de CIC'ART. Les fiches sont ajoutées à celles déjà présentes.</p>
  <button class="btn ghost" data-act="importPick">Choisir un fichier de sauvegarde</button><input type="file" id="importFile" accept="application/json,.json" hidden>
  </section>${mmReglages()}</div>`;
}

function vCompte() {
  const u = S.authUser, p = S.profile || {};
  const roleTxt = { admin: "Administrateur", tailleur: "Tailleur", client: "Client" }[S.role];
  const cl = S.myClient;
  return `<div class="page-head"><div><div class="eyebrow">Mon compte</div><h1>${esc(p.nom || "Mon compte")}</h1><p class="lede">${esc(u.email || "")} · <span class="role ${S.role}">${roleTxt}</span></p></div></div>
  <div class="grid-dash">
  <section class="panel span-6"><div class="panel-head"><h3>Profil</h3></div>
  <form id="fProfil" class="stack"><div class="field"><label for="pfNom">Nom affiché</label><input class="input" id="pfNom" value="${esc(p.nom || "")}"></div><div><button class="btn" type="submit">Enregistrer</button></div></form>
  ${S.role === "client" && p.code ? `<p class="muted">Code client : <span class="code">${esc(p.code)}</span></p>` : ""}</section>
  <section class="panel span-6"><div class="panel-head"><h3>L'atelier</h3></div>
  <dl class="kv"><dt>Atelier</dt><dd>${esc(S.config.nom || "CIC'ART")}</dd><dt>Téléphone</dt><dd class="num">${S.config.tel ? `<span style="user-select:all">${esc(S.config.tel)}</span>` : "—"}</dd>${cl && cl.tel ? `<dt>Votre numéro</dt><dd class="num">${esc(cl.tel)}</dd>` : ""}</dl>
  <div class="actions" style="margin-top:18px"><a class="btn ghost" href="installer.html">Installer sur un appareil</a><button class="btn ghost" data-act="logout">Se déconnecter</button></div></section></div>`;
}

/* ================= Vues client ================= */
function vMesCmd() {
  const cl = S.myClient;
  const list = [...S.commandes].sort((a, b) => (a.statut === "livre") - (b.statut === "livre") || (a.livraison || "9").localeCompare(b.livraison || "9"));
  const actives = list.filter(c => c.statut !== "livre");
  const du = list.reduce((a, c) => a + resteFor(c), 0);
  const prenom = (cl && cl.nom || S.profile && S.profile.nom || "").split(" ")[0];
  return `<div class="page-head"><div><div class="eyebrow">${esc(S.config.nom || "CIC'ART")}</div><h1>Bonjour${prenom ? " " + esc(prenom) : ""},<br><em>vos tenues.</em></h1>
  <p class="lede">${actives.length ? `<b>${actives.length} commande${actives.length > 1 ? "s" : ""} en cours</b> à l'atelier.` : "Aucune commande en cours pour le moment."}${du > 0 ? ` Reste à régler : <b>${F(du)}</b>.` : ""}</p></div></div>
  ${list.length ? `<div class="stack">${list.map(orderCard).join("")}</div>` : `<div class="empty"><b>Pas encore de commande</b>Vos commandes apparaîtront ici dès que l'atelier les aura enregistrées.</div>`}
  ${S.config.tel ? `<p class="muted" style="margin-top:22px">Une question ? Appelez l'atelier au <b style="user-select:all;color:var(--fg)">${esc(S.config.tel)}</b>.</p>` : ""}`;
}
function orderCard(c) {
  const idx = STATUTS.findIndex(s => s[0] === c.statut), dd = daysTo(c.livraison);
  const has = hasPrix(c), prix = prixOf(c), paid = paidFor(c.id), r = resteFor(c);
  const msg = c.statut === "pret" ? "Votre tenue est prête : vous pouvez passer la récupérer." : c.statut === "essayage" ? "Votre tenue est prête pour l'essayage. Passez à l'atelier dès que possible." : c.statut === "livre" ? "Commande remise. Merci de votre confiance !" : c.livraison ? `Livraison prévue le ${fmtD(c.livraison)}${dd !== null && dd >= 0 ? ` (${dd === 0 ? "aujourd'hui" : dd === 1 ? "demain" : "dans " + dd + " jours"})` : ""}.` : "Date de livraison à confirmer avec l'atelier.";
  return `<section class="panel order"><div class="order-top"><div><div class="eyebrow">${cmdNum(c)}</div><h2 style="margin-top:6px">${esc(c.modele)}</h2>${c.description ? `<span class="muted">${esc(c.description)}</span>` : ""}</div><span class="pill s-${c.statut}">${SLABEL[c.statut]}</span></div>
  <div><div class="steps">${STATUTS.map((s, i) => `<i class="${i < idx ? "done" : i === idx ? "on" : ""}"></i>`).join("")}</div>
  <div class="steps-l" style="margin-top:6px">${STATUTS.map((s, i) => `<span class="${i === idx ? "on" : ""}">${s[1]}</span>`).join("")}</div></div>
  <p style="margin:0">${esc(msg)}</p>
  ${has ? `<div class="money-box"><div><small>Prix</small><b>${F(prix)}</b></div><div><small>Payé</small><b style="color:var(--green)">${F(paid)}</b></div><div><small>Reste</small><b style="color:${r > 0 ? "#ff9b9b" : "var(--green)"}">${r > 0 ? F(r) : "Soldé"}</b></div></div>` : ""}
  ${pendingBox(c)}
  ${mmActif() && has && r > 0 && !txEnAttente(c.id).length ? `<button class="btn green mm-cta" data-act="mmPay" data-id="${c.id}">${I.pay}Payer par Mobile Money</button>` : ""}
  ${c.tissu ? `<span class="muted" style="font-size:13.5px">Tissu : ${esc(c.tissu)}</span>` : ""}</section>`;
}
function pendingBox(c) {
  const ts = txEnAttente(c.id);
  if (!ts.length) return "";
  return ts.map(t => `<div class="mm-pending"><span class="mm-dot"></span><div style="min-width:0;flex:1"><b>Paiement de ${F(t.montant)} en attente</b><small>${esc((MM[t.reseau] || {}).nom || "")} · ${esc(fmtTel(t.telephone))} · validez la demande sur ce téléphone</small></div><button class="btn sm ghost" data-act="mmVerify" data-id="${t.id}">Vérifier</button></div>`).join("");
}
const fmtTel = t => String(t || "").replace(/(\d{2})(?=\d)/g, "$1 ").trim();
function vMesMes() {
  const cl = S.myClient, m = cl && cl.mesures || {};
  const filled = MESURES.filter(([k]) => m[k] !== undefined && m[k] !== "");
  return `<div class="page-head"><div><div class="eyebrow">Prises par l'atelier</div><h1>Mes <em>mesures</em></h1><p class="lede">En centimètres. Si une mesure a changé, prévenez l'atelier lors de votre prochain passage.</p></div></div>
  ${filled.length ? `<div class="mes-view">${filled.map(([k, l]) => `<div><small>${l}</small><b>${esc(m[k])}<span>cm</span></b></div>`).join("")}</div>` : `<div class="empty"><b>Aucune mesure enregistrée</b>L'atelier les ajoutera lors de votre prochain passage.</div>`}`;
}

/* ================= Fenêtres ================= */
function openSheet(html) { $("#layer").innerHTML = `<div class="overlay" id="ov"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`; }
function closeSheet() { $("#layer").innerHTML = ""; armed = null; if (txWatch) { try { txWatch(); } catch (e) { } txWatch = null; } }
const closeBtn = '<button class="icon-btn" data-act="close" aria-label="Fermer">×</button>';
const opt = (arr, sel) => arr.map(v => { const [val, lab] = Array.isArray(v) ? v : [v, v]; return `<option value="${esc(val)}" ${val === sel ? "selected" : ""}>${esc(lab)}</option>`; }).join("");

function sheetCmd(id) {
  const c = cmdOf(id); if (!c) return; const cl = clientOf(c.clientId);
  const paid = paidFor(c.id), r = resteFor(c), idx = STATUTS.findIndex(s => s[0] === c.statut), next = STATUTS[idx + 1];
  const pays = S.paiements.filter(p => p.commandeId === c.id).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  openSheet(`<div class="sheet-head"><div><div class="eyebrow">${cmdNum(c)}</div><h2 style="margin-top:8px">${esc(c.modele)}</h2><span class="muted">${esc(cl ? cl.nom : "Client supprimé")}${cl && cl.tel ? " · " + esc(cl.tel) : ""}</span></div>${closeBtn}</div>
  <div><div class="steps">${STATUTS.map((s, i) => `<i class="${i < idx ? "done" : i === idx ? "on" : ""}"></i>`).join("")}</div><div style="display:flex;justify-content:space-between;margin-top:8px;gap:8px;flex-wrap:wrap"><span class="pill s-${c.statut}">${SLABEL[c.statut]}</span>${next ? `<button class="btn sm" data-act="advance" data-id="${c.id}">Passer à : ${next[1]}</button>` : ""}</div></div>
  ${isAdmin() ? (hasPrix(c) ? `<div class="money-box"><div><small>Prix</small><b>${F(prixOf(c))}</b></div><div><small>Payé</small><b style="color:var(--green)">${F(paid)}</b></div><div><small>Reste</small><b style="color:${r > 0 ? "#ff9b9b" : "var(--green)"}">${F(r)}</b></div></div>` : `<div class="banner"><p>Le prix de cette commande n'est pas encore fixé.</p><button class="btn sm" data-act="editCmd" data-id="${c.id}">Fixer le prix</button></div>`) : ""}
  <dl class="kv"><dt>Description</dt><dd>${esc(c.description || "—")}</dd><dt>Tissu</dt><dd>${esc(c.tissu || "—")} ${c.tissuFourni ? "(apporté par le client)" : "(fourni par l'atelier)"}</dd><dt>Dépôt</dt><dd class="num">${fmtD(c.depot)}</dd><dt>Livraison</dt><dd class="num">${fmtD(c.livraison)}</dd><dt>Tailleur</dt><dd>${esc(c.tailleur || "—")}</dd>${c.notes ? `<dt>Notes</dt><dd>${esc(c.notes)}</dd>` : ""}</dl>
  ${isAdmin() ? `<div><h3 style="margin-bottom:8px">Paiements</h3>${pays.length ? `<div class="rows">${pays.map(p => `<div class="row" data-open-pay="${p.id}"><div class="avatar" style="color:var(--green);background:var(--green-soft)">F</div><div class="who"><b class="num">${F(p.montant)}</b><small>${fmtD(p.date)} · ${esc(p.mode)}${p.note ? " · " + esc(p.note) : ""}</small></div><span></span></div>`).join("")}</div>` : '<p class="muted" style="margin:0">Aucun paiement reçu.</p>'}</div>` : ""}
  ${isAdmin() ? pendingBox(c) : ""}
  <div class="actions">${isAdmin() && hasPrix(c) && r > 0 ? `<button class="btn green" data-act="newPay" data-cmd="${c.id}">Encaisser</button>` : ""}${isAdmin() && mmActif() && hasPrix(c) && r > 0 ? `<button class="btn ghost" data-act="mmPay" data-id="${c.id}">Demander par Mobile Money</button>` : ""}<button class="btn ghost" data-act="msg" data-id="${c.id}">Message au client</button><button class="btn ghost" data-act="editCmd" data-id="${c.id}">Modifier</button>${cl ? `<button class="btn ghost" data-open-client="${cl.id}">Fiche client</button>` : ""}</div>
  <div id="msgOut"></div>`);
}
function formCmd(id, presetClient) {
  const c = id ? cmdOf(id) : { statut: "attente", depot: todayStr(), tissuFourni: true, clientId: presetClient || "" };
  if (!S.clients.length) { openSheet(`<div class="sheet-head"><h2>Nouvelle commande</h2>${closeBtn}</div><div class="empty"><b>Ajoutez d'abord un client</b>Une commande est toujours liée à un client et à ses mesures.</div><button class="btn" data-act="newClient">Nouveau client</button>`); return; }
  const tailleurs = ["", ...(S.config.tailleurs || [])]; if (c.tailleur && !tailleurs.includes(c.tailleur)) tailleurs.push(c.tailleur);
  const mods = MODELES.includes(c.modele) || !c.modele ? MODELES : [c.modele, ...MODELES];
  const prix = id && hasPrix(c) ? prixOf(c) : "";
  openSheet(`<div class="sheet-head"><h2>${id ? "Modifier la commande" : "Nouvelle commande"}</h2>${closeBtn}</div>
  <form id="fCmd" class="form-grid" data-id="${id || ""}">
  <div class="field full"><label for="kCli">Client</label><select class="input" id="kCli" required><option value="">Choisir…</option>${opt([...S.clients].sort((a, b) => (a.nom || "").localeCompare(b.nom || "")).map(x => [x.id, x.nom + (x.tel ? " · " + x.tel : "")]), c.clientId)}</select></div>
  <div class="field"><label for="kMod">Modèle</label><select class="input" id="kMod">${opt(mods, c.modele || "Robe")}</select></div>
  <div class="field"><label for="kStat">Statut</label><select class="input" id="kStat">${opt(STATUTS, c.statut)}</select></div>
  <div class="field full"><label for="kDesc">Description du modèle (visible par le client)</label><input class="input" id="kDesc" value="${esc(c.description)}" placeholder="Ex. robe évasée, col V, manches ballon"></div>
  <div class="field"><label for="kTis">Tissu</label><input class="input" id="kTis" value="${esc(c.tissu)}" placeholder="Wax, bazin, kente…"></div>
  <div class="field"><label for="kFour">Provenance du tissu</label><select class="input" id="kFour">${opt([["1", "Apporté par le client"], ["0", "Fourni par l'atelier"]], c.tissuFourni === false ? "0" : "1")}</select></div>
  ${isAdmin() ? `<div class="field"><label for="kPrix">Prix (F CFA)</label><input class="input num" id="kPrix" type="number" min="0" step="500" value="${prix}"></div>` : ""}
  <div class="field ${isAdmin() ? "" : "full"}"><label for="kTail">Tailleur</label><select class="input" id="kTail">${opt(tailleurs.map(t => [t, t || "Non attribué"]), c.tailleur || "")}</select></div>
  <div class="field"><label for="kDep">Date de dépôt</label><input class="input" id="kDep" type="date" value="${esc(c.depot)}"></div>
  <div class="field"><label for="kLiv">Date de livraison</label><input class="input" id="kLiv" type="date" value="${esc(c.livraison)}"></div>
  ${!id && isAdmin() ? `<div class="field"><label for="kAcc">Acompte reçu (F CFA)</label><input class="input num" id="kAcc" type="number" min="0" step="500" placeholder="0"></div><div class="field"><label for="kAccMode">Mode de paiement</label><select class="input" id="kAccMode">${opt(MODES, "Espèces")}</select></div>` : ""}
  <div class="field full"><label for="kNotes">Notes internes (non visibles par le client)</label><textarea class="input" id="kNotes">${esc(c.notes)}</textarea></div>
  ${isAdmin() ? "" : '<p class="muted full" style="margin:0;font-size:13px">Le prix sera fixé par l\'administrateur.</p>'}
  <div class="full actions"><button class="btn" type="submit">${id ? "Enregistrer" : "Créer la commande"}</button>${id && isAdmin() ? `<button class="btn danger" type="button" data-act="delCmd" data-id="${id}">Supprimer</button>` : ""}</div></form>`);
}

function sheetClient(id) {
  const c = clientOf(id); if (!c) return; const m = c.mesures || {};
  const filled = MESURES.filter(([k]) => m[k] !== undefined && m[k] !== "");
  const cs = S.commandes.filter(k => k.clientId === id).sort((a, b) => (b.depot || "").localeCompare(a.depot || ""));
  const total = cs.reduce((a, k) => a + prixOf(k), 0), r = cs.reduce((a, k) => a + resteFor(k), 0);
  const code = codeOf(id);
  openSheet(`<div class="sheet-head"><div style="display:flex;gap:14px;align-items:center;min-width:0"><div class="avatar" style="width:56px;height:56px;font-size:20px">${esc(initials(c.nom))}</div><div style="min-width:0"><h2>${esc(c.nom)}</h2><span class="muted num">${esc(c.tel || "")}${c.adresse ? " · " + esc(c.adresse) : ""}</span></div></div>${closeBtn}</div>
  ${isAdmin() ? `<div class="money-box"><div><small>Commandes</small><b>${cs.length}</b></div><div><small>Total facturé</small><b>${F(total)}</b></div><div><small>Doit encore</small><b style="color:${r > 0 ? "#ff9b9b" : "var(--green)"}">${F(r)}</b></div></div>` : ""}
  <div class="panel" style="padding:14px 16px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>Accès à l'application</h3>${code ? `<span class="code">${esc(code)}</span>` : ""}</div>
  ${code ? `<div class="actions"><button class="btn sm" data-act="invite" data-id="${c.id}">Message d'invitation</button>${isAdmin() ? `<button class="btn sm ghost" data-act="regenCode" data-id="${c.id}">Changer le code</button>` : ""}</div>` : `<button class="btn sm" data-act="makeCode" data-id="${c.id}">Créer un code client</button>`}<div id="inviteOut"></div></div>
  <div><h3 style="margin-bottom:10px">Mesures (cm)</h3>${filled.length ? `<div class="mes-view">${filled.map(([k, l]) => `<div><small>${l}</small><b>${esc(m[k])}<span>cm</span></b></div>`).join("")}</div>` : '<p class="muted" style="margin:0">Aucune mesure enregistrée.</p>'}${c.notes ? `<p class="muted">${esc(c.notes)}</p>` : ""}</div>
  <div><h3 style="margin-bottom:6px">Historique</h3>${cs.length ? `<div class="rows">${cs.map(rowCmd).join("")}</div>` : '<p class="muted" style="margin:0">Pas encore de commande.</p>'}</div>
  <div class="actions"><button class="btn" data-act="newCmd" data-client="${c.id}">Nouvelle commande</button><button class="btn ghost" data-act="editClient" data-id="${c.id}">Modifier / mesures</button></div>`);
}
function formClient(id) {
  const c = id ? clientOf(id) : { sexe: "F", mesures: {} }; const m = c.mesures || {};
  openSheet(`<div class="sheet-head"><h2>${id ? "Modifier le client" : "Nouveau client"}</h2>${closeBtn}</div>
  <form id="fCli" data-id="${id || ""}" class="stack" style="gap:20px"><div class="form-grid">
  <div class="field full"><label for="cNom">Nom complet</label><input class="input" id="cNom" value="${esc(c.nom)}" required></div>
  <div class="field"><label for="cTel">Téléphone</label><input class="input" id="cTel" type="tel" value="${esc(c.tel)}" placeholder="90 00 00 00"></div>
  <div class="field"><label for="cSexe">Genre</label><select class="input" id="cSexe">${opt([["F", "Femme"], ["H", "Homme"], ["E", "Enfant"]], c.sexe)}</select></div>
  <div class="field full"><label for="cAdr">Quartier / adresse</label><input class="input" id="cAdr" value="${esc(c.adresse)}"></div></div>
  <div><h3 style="margin-bottom:10px">Mesures en centimètres</h3><div class="mes-grid">${MESURES.map(([k, l]) => `<div class="field"><label for="m_${k}" style="text-transform:none;letter-spacing:0;font-size:12px">${l}</label><input class="input num" id="m_${k}" type="number" step="0.5" min="0" inputmode="decimal" value="${esc(m[k] ?? "")}"></div>`).join("")}</div></div>
  <div class="field"><label for="cNotes">Remarques (visibles par le client)</label><textarea class="input" id="cNotes">${esc(c.notes)}</textarea></div>
  <div class="actions"><button class="btn" type="submit">${id ? "Enregistrer" : "Ajouter le client"}</button>${id && isAdmin() ? `<button class="btn danger" type="button" data-act="delClient" data-id="${id}">Supprimer</button>` : ""}</div></form>`);
}
function formPay(id, cmdId) {
  const p = id ? S.paiements.find(x => x.id === id) : { date: todayStr(), mode: "Espèces", commandeId: cmdId || "" };
  if (!p) return;
  const cands = S.commandes.filter(c => (hasPrix(c) && resteFor(c) > 0) || c.id === p.commandeId);
  if (!cands.length && !id) { openSheet(`<div class="sheet-head"><h2>Paiement</h2>${closeBtn}</div><div class="empty"><b>Rien à encaisser</b>Toutes les commandes avec un prix fixé sont soldées.</div>`); return; }
  const pre = p.commandeId ? cmdOf(p.commandeId) : null;
  openSheet(`<div class="sheet-head"><h2>${id ? "Modifier le paiement" : "Enregistrer un paiement"}</h2>${closeBtn}</div>
  <form id="fPay" class="form-grid" data-id="${id || ""}">
  <div class="field full"><label for="pCmd">Commande</label><select class="input" id="pCmd" required><option value="">Choisir…</option>${opt(cands.map(c => { const cl = clientOf(c.clientId); return [c.id, `${cmdNum(c)} · ${cl ? cl.nom : "—"} · ${c.modele} · reste ${F(resteFor(c))}`]; }), p.commandeId)}</select></div>
  <div class="field"><label for="pMt">Montant (F CFA)</label><input class="input num" id="pMt" type="number" min="1" value="${p.montant ?? (pre && !id ? resteFor(pre) : "")}" required></div>
  <div class="field"><label for="pDate">Date</label><input class="input" id="pDate" type="date" value="${esc(p.date)}"></div>
  <div class="field"><label for="pMode">Mode</label><select class="input" id="pMode">${opt(MODES, p.mode)}</select></div>
  <div class="field"><label for="pNote">Note</label><input class="input" id="pNote" value="${esc(p.note)}" placeholder="Acompte, solde…"></div>
  <div class="full actions"><button class="btn" type="submit">Enregistrer</button>${id ? `<button class="btn danger" type="button" data-act="delPay" data-id="${id}">Supprimer</button>` : ""}</div></form>`);
}
function formStock(id) {
  const s = id ? S.stock.find(x => x.id === id) : { categorie: "Tissu", unite: "m", quantite: 0, seuil: 5 };
  if (!s) return;
  openSheet(`<div class="sheet-head"><h2>${id ? "Modifier l'article" : "Nouvel article"}</h2>${closeBtn}</div>
  <form id="fStk" class="form-grid" data-id="${id || ""}">
  <div class="field full"><label for="sNom">Nom</label><input class="input" id="sNom" value="${esc(s.nom)}" required placeholder="Ex. Wax bleu 6 yards"></div>
  <div class="field"><label for="sCat">Catégorie</label><select class="input" id="sCat">${opt(["Tissu", "Fourniture", "Mercerie", "Accessoire"], s.categorie)}</select></div>
  <div class="field"><label for="sUn">Unité</label><select class="input" id="sUn">${opt(["m", "yard", "pagne", "pièce", "bobine", "rouleau", "paquet"], s.unite)}</select></div>
  <div class="field"><label for="sQte">Quantité</label><input class="input num" id="sQte" type="number" step="0.5" value="${s.quantite ?? 0}"></div>
  <div class="field"><label for="sSeuil">Seuil d'alerte</label><input class="input num" id="sSeuil" type="number" step="0.5" value="${s.seuil ?? 0}"></div>
  <div class="field full"><label for="sPrix">Prix d'achat unitaire (F CFA)</label><input class="input num" id="sPrix" type="number" min="0" value="${s.prix ?? ""}"></div>
  <div class="full actions"><button class="btn" type="submit">Enregistrer</button>${id ? `<button class="btn danger" type="button" data-act="delStock" data-id="${id}">Supprimer</button>` : ""}</div></form>`);
}

function msgFor(c) {
  const cl = clientOf(c.clientId), r = resteFor(c), at = S.config.nom || "l'atelier";
  const money = isAdmin() && hasPrix(c);
  const base = `Bonjour ${cl ? (cl.nom || "").split(" ")[0] : ""},\n`;
  const tel = S.config.tel ? `\nContact : ${S.config.tel}` : "";
  const suivi = `\nSuivez vos commandes sur l'application CIC'ART : ${APP_URL}`;
  if (c.statut === "pret") return base + `Votre ${c.modele.toLowerCase()} (${cmdNum(c)}) est prête chez ${at}. ${money && r > 0 ? `Reste à régler : ${F(r)}. ` : ""}Vous pouvez passer la récupérer.${tel}\nMerci de votre confiance !`;
  if (c.statut === "essayage") return base + `Votre ${c.modele.toLowerCase()} (${cmdNum(c)}) est prête pour l'essayage chez ${at}. Merci de passer dès que possible.${tel}`;
  return base + `Nous avons bien enregistré votre commande ${cmdNum(c)} (${c.modele.toLowerCase()}) chez ${at}. Livraison prévue le ${fmtD(c.livraison)}.${money ? (r > 0 ? ` Reste à régler : ${F(r)}.` : " Commande soldée.") : ""}${suivi}\nMerci de votre confiance !`;
}
function inviteFor(cl) {
  const code = codeOf(cl.id);
  return `Bonjour ${(cl.nom || "").split(" ")[0]},\n${S.config.nom || "Notre atelier"} vous invite à suivre vos commandes et vos mesures sur l'application CIC'ART.\n\n1. Ouvrez ${APP_URL}\n2. Créez votre compte (Google ou e-mail)\n3. Saisissez votre code client : ${code}\n\nAstuce : ajoutez l'application à votre écran d'accueil pour la retrouver facilement.`;
}
function copyBox(target, title, txt) {
  $(target).innerHTML = `<h3 style="margin:6px 0 8px">${esc(title)}</h3><div class="copybox" id="copyTxt">${esc(txt)}</div><div class="actions" style="margin-top:10px"><button class="btn sm" data-act="copy">Copier le message</button><a class="btn sm ghost" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Envoyer par WhatsApp</a></div>`;
}

/* ================= Mobile Money ================= */
let txWatch = null;
function fnErr(e) {
  const c = (e && e.code || "").replace("functions/", "");
  if (c === "unavailable" || c === "internal" && !navigator.onLine) return "Pas de connexion Internet. Réessayez une fois connecté.";
  if (c === "not-found" && /function/i.test(e.message || "")) return "Le service de paiement n'est pas encore installé.";
  return (e && e.message && !/^internal$/i.test(e.message)) ? e.message : "Le paiement n'a pas pu être lancé. Réessayez.";
}
function devinerReseau(tel) {
  const n = String(tel || "").replace(/\D/g, "").replace(/^228/, "");
  if (/^(9[0-3]|7[0-3])/.test(n)) return "TMONEY";
  if (/^(9[6-9]|79)/.test(n)) return "FLOOZ";
  return "";
}
function sheetMM(cmdId) {
  const c = cmdOf(cmdId); if (!c) return;
  const cl = clientOf(c.clientId), r = resteFor(c);
  const tel = (cl && cl.tel || "").replace(/\D/g, "").replace(/^228/, "").slice(-8);
  const net = devinerReseau(tel);
  openSheet(`<div class="sheet-head"><div><div class="eyebrow">${cmdNum(c)} · ${esc(c.modele)}</div><h2 style="margin-top:8px">Payer par Mobile Money</h2><span class="muted">Reste à payer : <b style="color:var(--fg)">${F(r)}</b></span></div>${closeBtn}</div>
  <form id="fMM" class="stack" data-cmd="${c.id}" data-net="${net}">
    <div class="field"><label>Réseau</label><div class="mm-nets">${Object.entries(MM).map(([k, m]) => `<button type="button" class="mm-net ${m.cls}" data-act="mmNet" data-net="${k}" aria-pressed="${k === net}"><b>${m.nom}</b><small>${m.sous}</small></button>`).join("")}</div></div>
    <div class="field"><label for="mmTel">Numéro qui va payer</label><div class="mm-tel"><span>+228</span><input class="input num" id="mmTel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="90 12 34 56" value="${esc(fmtTel(tel))}" required></div></div>
    <div class="field"><label for="mmMt">Montant (F CFA)</label><input class="input num" id="mmMt" type="number" inputmode="numeric" min="100" max="${r}" step="1" value="${r}" required><small class="muted">Vous pouvez payer le tout ou seulement une partie (acompte).</small></div>
    <p class="err" id="mmErr" aria-live="polite"></p>
    <button class="btn block" type="submit">Envoyer la demande de paiement</button>
    <p class="muted" style="font-size:13px;margin:0">Une demande de confirmation arrive sur ce téléphone. Le paiement n'est prélevé qu'après validation avec le code secret Mobile Money. Paiement sécurisé par PayGate Global.</p>
  </form>`);
}
function sheetMMWait(id, info) {
  const m = MM[info.reseau] || {};
  const draw = (t) => {
    const st = t ? t.statut : "en_attente";
    const box = $("#mmWait"); if (!box) return;
    if (st === "paye") {
      box.innerHTML = `<div class="mm-state ok"><div class="mm-ico">✓</div><h2>Paiement reçu</h2><p>${F(t.montantPaye || info.montant)} payés avec ${esc(m.nom || "")}. Merci !</p></div><button class="btn block" data-act="close">Terminer</button>`;
      if (txWatch) { txWatch(); txWatch = null; }
    } else if (st === "echoue") {
      box.innerHTML = `<div class="mm-state ko"><div class="mm-ico">!</div><h2>Paiement non effectué</h2><p>${esc(t && t.erreur || "Le paiement n'a pas été validé.")}</p></div><div class="actions"><button class="btn" data-act="mmPay" data-id="${t ? t.commandeId : ""}">Réessayer</button><button class="btn ghost" data-act="close">Fermer</button></div>`;
      if (txWatch) { txWatch(); txWatch = null; }
    } else {
      box.innerHTML = `<div class="mm-state wait"><div class="mm-spin" aria-hidden="true"></div><h2>Validez sur le téléphone</h2><p>Une demande de <b>${F(info.montant)}</b> a été envoyée au <b>+228 ${esc(fmtTel(info.telephone))}</b> (${esc(m.nom || "")}).</p>
      <ol class="mm-steps"><li>Ouvrez la notification ou le message reçu sur ce téléphone.</li><li>Vérifiez le montant et saisissez votre <b>code secret ${esc(m.nom || "Mobile Money")}</b>.</li><li>Cet écran se met à jour tout seul dès que le paiement est validé.</li></ol></div>
      <div class="actions"><button class="btn ghost" data-act="mmVerify" data-id="${id}">J'ai validé, vérifier</button><button class="btn ghost" data-act="close">Fermer</button></div>
      <p class="muted" style="font-size:13px;margin:0">Rien reçu après une minute ? Consultez les paiements en attente dans le menu de votre opérateur, ou fermez et réessayez.</p>`;
    }
  };
  openSheet(`<div class="sheet-head"><div><div class="eyebrow">Mobile Money</div></div>${closeBtn}</div><div id="mmWait" class="stack"></div>`);
  draw(null);
  if (txWatch) { try { txWatch(); } catch (e) { } }
  txWatch = onSnapshot(doc(db, "transactions", id), s => { if (s.exists()) draw(Object.assign({ id: s.id }, s.data())); }, () => { });
}
function mmReglages() {
  if (!isAdmin()) return "";
  const c = S.config, on = mmActif();
  return `<section class="panel span-12"><div class="panel-head"><h3>Paiement Mobile Money</h3><span class="pill ${on ? "s-pret" : "s-attente"}">${on ? "Activé" : c.cleMarchande ? "Prêt, désactivé" : "Non configuré"}</span></div>
  <p class="muted" style="margin-top:0">Vos clients paient leurs commandes avec <b style="color:var(--fg)">Mixx by Yas</b> ou <b style="color:var(--fg)">Moov Money</b> depuis l'application, via votre compte marchand <b style="color:var(--fg)">PayGate Global</b>. Chaque paiement validé s'enregistre automatiquement dans vos paiements.</p>
  <div class="grid-dash" style="gap:16px">
    <div class="span-6 stack" style="gap:12px">
      <div><b>1. Clé marchande PayGate</b><p class="muted" style="margin:4px 0 0;font-size:14px">À copier depuis votre tableau de bord PayGate. Elle est gardée sur le serveur et n'est jamais visible dans l'application.</p></div>
      <form id="fKey" class="stack" style="gap:10px"><input class="input" id="mmKey" type="password" autocomplete="off" placeholder="${c.cleMarchande ? "Clé enregistrée · coller une nouvelle clé pour la remplacer" : "Collez la clé (auth_token)"}">
      <div class="actions"><button class="btn sm" type="submit">Enregistrer la clé</button>${c.cleMarchande ? `<button class="btn sm danger" type="button" data-act="mmKeyDel">Supprimer la clé</button>` : ""}</div></form>
    </div>
    <div class="span-6 stack" style="gap:12px">
      <div><b>2. Adresse de notification</b><p class="muted" style="margin:4px 0 0;font-size:14px">À coller dans PayGate, champ « URL de retour » ou « callback ».</p></div>
      <div class="copybox" id="cbUrl" style="user-select:all;overflow-wrap:anywhere">${CALLBACK_URL}</div>
      <div class="actions"><button class="btn sm ghost" data-act="copyCb">Copier l'adresse</button></div>
    </div>
  </div>
  <div class="actions" style="margin-top:16px"><button class="btn ${on ? "danger" : "green"}" data-act="mmToggle">${on ? "Désactiver le paiement pour les clients" : "3. Activer le paiement pour les clients"}</button></div>
  </section>`;
}
document.addEventListener("input", e => {
  if (e.target.id === "mmTel") { const f = $("#fMM"); if (f && !f.dataset.manual) { const n = devinerReseau(e.target.value); if (n) { f.dataset.net = n; f.querySelectorAll("[data-net]").forEach(b => b.setAttribute("aria-pressed", b.dataset.net === n)); } } }
});

/* ================= Installation ================= */
let deferredPrompt = null;
function isStandalone() { try { return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; } catch (e) { return false; } }
function installTip() {
  if (isStandalone() || !["dash", "mescmd"].includes(page)) return "";
  try { if (localStorage.getItem("cicart.tipHidden")) return ""; } catch (e) { }
  if (deferredPrompt) return `<div class="install-tip"><p>Installez CIC'ART sur cet appareil pour l'ouvrir comme une application.</p><div class="actions"><button class="btn sm" data-act="install">Installer</button><button class="btn sm ghost" data-act="hideTip">Plus tard</button></div></div>`;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return `<div class="install-tip"><p>Pour installer CIC'ART : touchez <b>Partager</b> dans Safari, puis <b>« Sur l'écran d'accueil »</b>.</p><button class="btn sm ghost" data-act="hideTip">Compris</button></div>`;
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return `<div class="install-tip"><p>Pour installer CIC'ART sur ce Mac : menu <b>Fichier</b>, puis <b>« Ajouter au Dock… »</b>.</p><div class="actions"><a class="btn sm ghost" href="installer.html">Aide</a><button class="btn sm ghost" data-act="hideTip">Compris</button></div></div>`;
  return `<div class="install-tip"><p>Installez CIC'ART sur cet appareil pour l'ouvrir depuis son icône.</p><div class="actions"><a class="btn sm" href="installer.html">Comment installer</a><button class="btn sm ghost" data-act="hideTip">Plus tard</button></div></div>`;
}
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; render(); });
window.addEventListener("appinstalled", () => { deferredPrompt = null; toast("CIC'ART est installée"); render(); });

/* ================= Événements ================= */
let armed = null;
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
const numv = id => { const v = val(id); return v === "" ? "" : +v; };

document.addEventListener("click", async e => {
  const t = e.target;
  if (t.id === "ov") { closeSheet(); return; }
  const adj = t.closest("[data-adj]");
  if (adj) { e.stopPropagation(); const s = S.stock.find(x => x.id === adj.dataset.adj); if (s) put("stock", Object.assign({}, s, { quantite: Math.max(0, (+s.quantite || 0) + (+adj.dataset.d)) })); return; }
  const au = t.closest("[data-auth]"); if (au) { ui.authMode = au.dataset.auth; ui.authErr = ""; render(); return; }
  const g = t.closest("[data-go]"); if (g) { go(g.dataset.go); return; }
  const oc = t.closest("[data-open-cmd]"); if (oc && isStaff()) { sheetCmd(oc.dataset.openCmd); return; }
  const ocl = t.closest("[data-open-client]"); if (ocl && isStaff()) { sheetClient(ocl.dataset.openClient); return; }
  const op = t.closest("[data-open-pay]"); if (op && isAdmin()) { formPay(op.dataset.openPay); return; }
  const os = t.closest("[data-open-stock]"); if (os && isAdmin()) { formStock(os.dataset.openStock); return; }
  const st = t.closest("[data-statut]"); if (st) { ui.statut = st.dataset.statut; render(); return; }
  const vu = t.closest("[data-vue]"); if (vu) { ui.vue = vu.dataset.vue; try { localStorage.setItem("cicart.vue", ui.vue); } catch (err) { } if (ui.vue === "kanban") ui.statut = "tous"; render(); return; }
  const mo = t.closest("[data-mois]"); if (mo) { ui.mois = mo.dataset.mois; render(); return; }
  const a = t.closest("[data-act]"); if (!a) return;
  const act = a.dataset.act, id = a.dataset.id;
  const confirm2 = async fn => { if (armed === a) { armed = null; await fn(); } else { armed = a; a.classList.add("arm"); a.textContent = "Confirmer"; } };
  switch (act) {
    case "close": closeSheet(); break;
    case "google": {
      ui.authErr = ""; const prov = new GoogleAuthProvider(); prov.setCustomParameters({ prompt: "select_account" });
      try { await signInWithPopup(auth, prov); }
      catch (err) {
        const c = err && err.code || "";
        if (c.includes("popup-blocked") || c.includes("operation-not-supported")) { try { await signInWithRedirect(auth, prov); } catch (e2) { ui.authErr = authMsg(e2); render(); } }
        else { ui.authErr = authMsg(err); render(); }
      }
      break;
    }
    case "logout": stopListeners(); closeSheet(); page = null; try { history.replaceState(null, "", location.pathname); } catch (err) { } await signOut(auth); break;
    case "resendVerif": try { await sendEmailVerification(S.authUser); toast("Lien envoyé. Vérifiez vos e-mails."); } catch (err) { toast("Envoi impossible pour le moment."); } break;
    case "checkVerif": try { await S.authUser.reload(); await S.authUser.getIdToken(true); if (auth.currentUser.emailVerified) { toast("Adresse confirmée"); await ensureProfile(auth.currentUser); } else toast("Pas encore confirmée : ouvrez le lien reçu par e-mail."); render(); } catch (err) { } break;
    case "newCmd": if (isStaff()) formCmd(null, a.dataset.client); break;
    case "editCmd": formCmd(id); break;
    case "newClient": formClient(); break;
    case "editClient": formClient(id); break;
    case "newPay": formPay(null, a.dataset.cmd); break;
    case "newStock": formStock(); break;
    case "advance": {
      const c = cmdOf(id), i = STATUTS.findIndex(s => s[0] === c.statut), n = STATUTS[i + 1];
      if (n) { put("commandes", Object.assign({}, c, { statut: n[0] })); toast("Commande passée à : " + n[1]); setTimeout(() => sheetCmd(id), 80); }
      break;
    }
    case "msg": copyBox("#msgOut", "Message prêt à envoyer", msgFor(cmdOf(id))); break;
    case "invite": copyBox("#inviteOut", "Invitation à envoyer au client", inviteFor(clientOf(id))); break;
    case "makeCode": { const code = newCode(); setDoc(doc(db, "codes", code), { clientId: id, cree: todayStr() }).catch(writeErr); setTimeout(() => sheetClient(id), 150); break; }
    case "regenCode": confirm2(async () => { const old = codeOf(id); if (old) del("codes", old); const code = newCode(); setDoc(doc(db, "codes", code), { clientId: id, cree: todayStr() }).catch(writeErr); toast("Nouveau code créé. L'ancien ne fonctionne plus pour les nouvelles liaisons."); setTimeout(() => sheetClient(id), 150); }); break;
    case "copy": { const box = $("#copyTxt"); try { await navigator.clipboard.writeText(box.textContent); toast("Message copié"); } catch (err) { const r = document.createRange(); r.selectNodeContents(box); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Texte sélectionné : copiez-le"); } break; }
    case "delCmd": confirm2(async () => { S.paiements.filter(p => p.commandeId === id).forEach(p => del("paiements", p.id)); if (S.factures[id]) del("factures", id); del("commandes", id); closeSheet(); toast("Commande supprimée"); }); break;
    case "delClient": confirm2(async () => { S.codes.filter(x => x.clientId === id).forEach(x => del("codes", x.id)); del("clients", id); closeSheet(); toast("Client supprimé"); }); break;
    case "delPay": confirm2(async () => { del("paiements", id); closeSheet(); toast("Paiement supprimé"); }); break;
    case "delStock": confirm2(async () => { del("stock", id); closeSheet(); toast("Article supprimé"); }); break;
    case "setRole": updateDoc(doc(db, "users", id), { role: a.dataset.role }).then(() => toast(a.dataset.role === "tailleur" ? "Accès tailleur activé" : "Accès tailleur retiré")).catch(writeErr); break;
    case "export": exportCSV(a.dataset.what); break;
    case "importPick": $("#importFile").click(); break;
    case "importGo": await doImport(); break;
    case "install": if (deferredPrompt) { deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (err) { } deferredPrompt = null; render(); } break;
    case "mmPay": sheetMM(id); break;
    case "mmNet": { const f = $("#fMM"); if (f) { f.dataset.net = a.dataset.net; f.dataset.manual = "1"; f.querySelectorAll("[data-net]").forEach(b => b.setAttribute("aria-pressed", b.dataset.net === a.dataset.net)); } break; }
    case "mmVerify": {
      a.disabled = true; const old = a.textContent; a.textContent = "Vérification…";
      try { const r = await httpsCallable(fns, "verifierPaiement")({ id }); const st = r.data && r.data.statut; toast(st === "paye" ? "Paiement reçu ✓" : st === "echoue" ? "Paiement non validé" : "Toujours en attente de validation sur le téléphone"); }
      catch (err) { toast(fnErr(err)); }
      a.disabled = false; a.textContent = old; break;
    }
    case "mmToggle": {
      const on = !S.config.paiementEnLigne;
      if (on && !S.config.cleMarchande) { toast("Enregistrez d'abord votre clé PayGate."); break; }
      setDoc(doc(db, "config", "atelier"), { paiementEnLigne: on }, { merge: true }).then(() => toast(on ? "Paiement Mobile Money activé pour vos clients" : "Paiement Mobile Money désactivé")).catch(writeErr); break;
    }
    case "mmKeyDel": confirm2(async () => { try { await httpsCallable(fns, "enregistrerCleMarchand")({ token: "" }); toast("Clé supprimée, paiement désactivé"); } catch (err) { toast(fnErr(err)); } }); break;
    case "copyCb": { try { await navigator.clipboard.writeText(CALLBACK_URL); toast("Adresse copiée"); } catch (err) { const r = document.createRange(); r.selectNodeContents($("#cbUrl")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Adresse sélectionnée : copiez-la"); } break; }
    case "hideTip": try { localStorage.setItem("cicart.tipHidden", "1"); } catch (err) { } render(); break;
    case "reload": location.reload(); break;
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });
document.addEventListener("input", e => {
  if (e.target.id === "qCmd") { ui.q = e.target.value; render(); }
  if (e.target.id === "qCli") { ui.cq = e.target.value; render(); }
});
document.addEventListener("change", e => { if (e.target.id === "importFile" && e.target.files[0]) { readImport(e.target.files[0]); e.target.value = ""; } });

document.addEventListener("submit", async e => {
  e.preventDefault(); const f = e.target;
  if (f.id === "fAuth") {
    ui.busy = true; ui.authErr = ""; render();
    const email = val("aEmail"), pass = val("aPass");
    try {
      if (ui.authMode === "reset") { await sendPasswordResetEmail(auth, email); ui.authMode = "login"; toast("Lien envoyé. Consultez vos e-mails."); }
      else if (ui.authMode === "signup") {
        const nom = val("aNom");
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        try { await updateProfile(cred.user, { displayName: nom }); } catch (err) { }
        try { await sendEmailVerification(cred.user); } catch (err) { }
        try { await setDoc(doc(db, "users", cred.user.uid), { role: "client", nom, email, cree: todayStr() }); } catch (err) { }
      } else await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) { ui.authErr = authMsg(err); }
    ui.busy = false; render(); return;
  }
  if (f.id === "fLink") {
    let code = val("lCode").toUpperCase().replace(/\s+/g, "");
    if (!code.startsWith("CA-")) code = "CA-" + code.replace(/^CA/, "");
    ui.busy = true; ui.authErr = ""; render();
    try {
      const snap = await getDoc(doc(db, "codes", code));
      if (!snap.exists()) ui.authErr = "Ce code n'existe pas. Vérifiez-le auprès de l'atelier.";
      else { await updateDoc(doc(db, "users", S.authUser.uid), { clientId: snap.data().clientId, code }); toast("Bienvenue !"); }
    } catch (err) { ui.authErr = err && err.code === "unavailable" ? "Pas de connexion Internet. Réessayez une fois connecté." : "Ce code ne peut pas être utilisé. Vérifiez-le auprès de l'atelier."; }
    ui.busy = false; render(); return;
  }
  if (f.id === "fProfil") { updateDoc(doc(db, "users", S.authUser.uid), { nom: val("pfNom") }).then(() => toast("Profil enregistré")).catch(writeErr); return; }
  if (f.id === "fCmd") {
    const id = f.dataset.id || uid(), old = cmdOf(id) || {};
    const num = old.num || (Math.max(0, ...S.commandes.map(c => +c.num || 0)) + 1);
    const obj = Object.assign({}, old, { id, num, clientId: val("kCli"), modele: val("kMod"), statut: val("kStat"), description: val("kDesc"), tissu: val("kTis"), tissuFourni: val("kFour") === "1", tailleur: val("kTail"), depot: val("kDep"), livraison: val("kLiv"), notes: val("kNotes") });
    delete obj.prix;
    if (!obj.clientId) { toast("Choisissez un client."); return; }
    put("commandes", obj);
    if (isAdmin()) {
      const p = val("kPrix");
      if (p !== "") put("factures", { id, clientId: obj.clientId, prix: +p || 0 });
      else if (S.factures[id]) del("factures", id);
      const acc = +val("kAcc") || 0;
      if (!f.dataset.id && acc > 0) put("paiements", { id: uid(), commandeId: id, clientId: obj.clientId, montant: acc, date: todayStr(), mode: val("kAccMode"), note: "Acompte" });
    }
    toast(f.dataset.id ? "Commande enregistrée" : "Commande créée"); setTimeout(() => sheetCmd(id), 80); return;
  }
  if (f.id === "fCli") {
    const isNew = !f.dataset.id, id = f.dataset.id || uid(), old = clientOf(id) || { cree: todayStr() }, mes = {};
    MESURES.forEach(([k]) => { const v = numv("m_" + k); if (v !== "") mes[k] = v; });
    const obj = Object.assign({}, old, { id, nom: val("cNom"), tel: val("cTel"), sexe: val("cSexe"), adresse: val("cAdr"), notes: val("cNotes"), mesures: mes });
    if (!obj.nom) { toast("Indiquez le nom du client."); return; }
    put("clients", obj);
    if (isNew) setDoc(doc(db, "codes", newCode()), { clientId: id, cree: todayStr() }).catch(writeErr);
    toast(isNew ? "Client ajouté avec son code d'accès" : "Fiche enregistrée"); setTimeout(() => sheetClient(id), 150); return;
  }
  if (f.id === "fPay") {
    const id = f.dataset.id || uid(), old = S.paiements.find(x => x.id === id) || {}, c = cmdOf(val("pCmd"));
    const obj = Object.assign({}, old, { id, commandeId: val("pCmd"), clientId: c ? c.clientId : "", montant: +val("pMt") || 0, date: val("pDate") || todayStr(), mode: val("pMode"), note: val("pNote") });
    if (!obj.commandeId || obj.montant <= 0) { toast("Choisissez une commande et un montant."); return; }
    put("paiements", obj); toast("Paiement enregistré"); setTimeout(() => sheetCmd(obj.commandeId), 80); return;
  }
  if (f.id === "fStk") {
    const id = f.dataset.id || uid(), old = S.stock.find(x => x.id === id) || {};
    const obj = Object.assign({}, old, { id, nom: val("sNom"), categorie: val("sCat"), unite: val("sUn"), quantite: +val("sQte") || 0, seuil: +val("sSeuil") || 0, prix: +val("sPrix") || 0 });
    if (!obj.nom) { toast("Indiquez le nom de l'article."); return; }
    put("stock", obj); closeSheet(); toast("Article enregistré"); return;
  }
  if (f.id === "fMM") {
    const btn = f.querySelector('button[type="submit"]'), err = $("#mmErr");
    const reseau = f.dataset.net, telephone = val("mmTel").replace(/\D/g, ""), montant = +val("mmMt");
    err.textContent = "";
    if (!reseau) { err.textContent = "Choisissez Mixx by Yas ou Moov Money."; return; }
    if (!/^[279]\d{7}$/.test(telephone.replace(/^228/, ""))) { err.textContent = "Indiquez un numéro à 8 chiffres, par exemple 90 12 34 56."; return; }
    if (!(montant >= 100)) { err.textContent = "Le montant minimum est de 100 F."; return; }
    if (!navigator.onLine) { err.textContent = "Il faut une connexion Internet pour payer."; return; }
    btn.disabled = true; btn.textContent = "Envoi de la demande…";
    try {
      const r = await httpsCallable(fns, "initierPaiement")({ commandeId: f.dataset.cmd, montant, reseau, telephone });
      sheetMMWait(r.data.id, { montant, reseau, telephone: telephone.replace(/^228/, "") });
    } catch (e2) { err.textContent = fnErr(e2); btn.disabled = false; btn.textContent = "Envoyer la demande de paiement"; }
    return;
  }
  if (f.id === "fKey") {
    const btn = f.querySelector('button[type="submit"]'); btn.disabled = true;
    try { await httpsCallable(fns, "enregistrerCleMarchand")({ token: val("mmKey") }); toast("Clé PayGate enregistrée sur le serveur"); $("#mmKey").value = ""; }
    catch (e2) { toast(fnErr(e2)); }
    btn.disabled = false; return;
  }
  if (f.id === "fCfg") {
    setDoc(doc(db, "config", "atelier"), { nom: val("cfgNom"), tel: val("cfgTel"), tailleurs: val("cfgTail").split(",").map(s => s.trim()).filter(Boolean) }, { merge: true }).catch(writeErr);
    toast("Réglages enregistrés");
  }
});

/* ================= Export / import ================= */
async function exportCSV(what) {
  const q = v => { const s = String(v ?? ""); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  let rowsArr;
  if (what === "commandes") rowsArr = [["Numero", "Client", "Telephone", "Modele", "Description", "Tissu", "Statut", "Tailleur", "Depot", "Livraison", "Prix", "Paye", "Reste"], ...S.commandes.map(c => { const cl = clientOf(c.clientId) || {}; return [cmdNum(c), cl.nom, cl.tel, c.modele, c.description, c.tissu, SLABEL[c.statut], c.tailleur, c.depot, c.livraison, prixOf(c), paidFor(c.id), resteFor(c)]; })];
  else if (what === "clients") rowsArr = [["Nom", "Telephone", "Genre", "Adresse", "Code client", ...MESURES.map(m => m[1] + " (cm)"), "Remarques"], ...S.clients.map(c => [c.nom, c.tel, c.sexe, c.adresse, codeOf(c.id), ...MESURES.map(([k]) => (c.mesures || {})[k] ?? ""), c.notes])];
  else rowsArr = [["Date", "Client", "Commande", "Mode", "Note", "Montant"], ...S.paiements.map(p => { const c = cmdOf(p.commandeId), cl = clientOf(p.clientId || (c && c.clientId)); return [p.date, cl && cl.nom, c && cmdNum(c), p.mode, p.note, p.montant]; })];
  const csv = "﻿" + rowsArr.map(r => r.map(q).join(";")).join("\n");
  await saveFile(`cicart-${what}-${todayStr()}.csv`, csv, "text/csv");
}
async function saveFile(name, text, type) {
  const blob = new Blob([text], { type: type + ";charset=utf-8" });
  try {
    const file = new File([blob], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /iphone|ipad|ipod|android/i.test(navigator.userAgent)) { await navigator.share({ files: [file], title: name }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
let pendingImport = null;
function readImport(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result); if (d.app !== "CICART" || !Array.isArray(d.clients)) throw 0;
      const real = k => (d[k] || []).filter(x => !x.exemple);
      pendingImport = { clients: real("clients"), commandes: real("commandes"), paiements: real("paiements"), stock: real("stock"), config: d.config };
      const p = pendingImport;
      openSheet(`<div class="sheet-head"><h2>Importer la sauvegarde ?</h2>${closeBtn}</div><p class="muted">${p.clients.length} clients, ${p.commandes.length} commandes, ${p.paiements.length} paiements et ${p.stock.length} articles seront ajoutés. Les fiches d'exemple sont ignorées. Un code d'accès est créé pour chaque client.</p><div class="actions"><button class="btn" data-act="importGo">Importer</button><button class="btn ghost" data-act="close">Annuler</button></div>`);
    } catch (e) { toast("Ce fichier n'est pas une sauvegarde CIC'ART."); }
  };
  r.readAsText(file);
}
async function doImport() {
  const p = pendingImport; if (!p) return; pendingImport = null;
  const ops = [];
  const base = Math.max(0, ...S.commandes.map(c => +c.num || 0));
  const strip = o => { const x = Object.assign({}, o); delete x.id; delete x.exemple; return x; };
  p.clients.forEach(c => { ops.push(["clients", c.id, strip(c)]); ops.push(["codes", newCode(), { clientId: c.id, cree: todayStr() }]); });
  p.commandes.forEach(c => { const x = strip(c); const prix = x.prix; delete x.prix; x.num = base + (+c.num || 0); ops.push(["commandes", c.id, x]); if (prix !== undefined && prix !== "") ops.push(["factures", c.id, { clientId: c.clientId, prix: +prix || 0 }]); });
  const cmdClient = Object.fromEntries(p.commandes.map(c => [c.id, c.clientId]));
  p.paiements.forEach(x => { const y = strip(x); y.clientId = cmdClient[x.commandeId] || ""; ops.push(["paiements", x.id, y]); });
  p.stock.forEach(s => ops.push(["stock", s.id, strip(s)]));
  closeSheet(); toast("Import en cours…");
  try {
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db);
      ops.slice(i, i + 400).forEach(([col, id, data]) => b.set(doc(db, col, id), data));
      await b.commit();
    }
    toast(`Import terminé : ${p.clients.length} clients, ${p.commandes.length} commandes.`);
  } catch (e) { writeErr(e); }
}

/* ================= Configuration manquante ================= */
function renderSetup() {
  $("#view").innerHTML = `<div class="auth"><div class="auth-card"><div class="brand"><div class="mark">CA</div><div><b>CIC'ART</b><small>Configuration requise</small></div></div>
  <div><div class="eyebrow">Étape d'installation</div><h1 style="font-size:clamp(30px,8vw,40px)">Reliez <em>Firebase</em>.</h1>
  <p class="lede">Ouvrez le fichier <b>firebase-config.js</b> et collez-y la configuration de votre projet Firebase, comme expliqué dans le guide LISEZMOI.</p></div></div></div>`;
}

/* ================= Hors ligne & mises à jour ================= */
function netBadge() { let b = $("#offline"); if (!navigator.onLine) { if (!b) { b = document.createElement("div"); b.id = "offline"; b.className = "offline"; b.textContent = "Hors ligne · les modifications seront envoyées au retour du réseau"; document.body.appendChild(b); } } else if (b) b.remove(); }
window.addEventListener("online", netBadge); window.addEventListener("offline", netBadge); netBadge();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(reg => {
    reg.addEventListener("updatefound", () => {
      const w = reg.installing; if (!w) return;
      w.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller) {
          const b = document.createElement("div"); b.className = "update";
          b.innerHTML = '<span>Une nouvelle version de CIC\'ART est disponible.</span><button class="btn sm" data-act="reload">Mettre à jour</button>';
          document.body.appendChild(b);
        }
      });
    });
  }).catch(() => { });
}

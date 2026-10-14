#!/usr/bin/env bash
# CIC'ART — installe ou met à jour le serveur de paiement Mobile Money dans le projet Firebase « cicart ».
# À lancer dans Google Cloud Shell (https://shell.cloud.google.com) avec le compte narcisseetsinyo@gmail.com.
set -euo pipefail
cd "$(dirname "$0")"
FB="npx -y firebase-tools@13.29.1"
echo "== 1/3 Installation des dépendances du serveur =="
(cd functions && npm ci --no-audit --no-fund --loglevel=error)
echo "== 2/3 Connexion à Firebase =="
if ! $FB projects:list >/dev/null 2>&1; then
  echo "Connectez-vous : ouvrez le lien affiché, choisissez votre compte Google, puis recopiez le code ici."
  $FB login --no-localhost
fi
echo "== 3/3 Déploiement des fonctions de paiement (2 à 5 minutes la première fois) =="
$FB deploy --only functions --project cicart --force
echo
echo "Terminé. Adresse de notification à coller dans PayGate :"
echo "  https://europe-west1-cicart.cloudfunctions.net/paygateCallback"

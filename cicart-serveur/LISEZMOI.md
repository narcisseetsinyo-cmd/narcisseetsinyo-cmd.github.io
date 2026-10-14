# CIC'ART — serveur de paiement Mobile Money

Code du serveur qui encaisse les paiements Mixx by Yas (T-Money) et Moov Money (Flooz) via PayGate Global
pour l'application CIC'ART (projet Firebase `cicart`, région `europe-west1`).

Ce dossier ne contient aucun secret : la clé PayGate est saisie dans l'application (Réglages) et stockée côté serveur.

Déploiement, depuis Google Cloud Shell :

    rm -rf cicart-src && git clone --depth 1 https://github.com/narcisseetsinyo-cmd/narcisseetsinyo-cmd.github.io cicart-src && bash cicart-src/cicart-serveur/deployer.sh

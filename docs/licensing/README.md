# Exploitation des licences

Ce dossier est le point d'entrée pour activer commercialement les licences de
MineMotion Studio. Il peut être suivi par une autre personne ou une autre IA
sans dépendre d'une conversation précédente.

## Lire dans cet ordre

1. [CHECKLIST_DEPLOYMENT.md](CHECKLIST_DEPLOYMENT.md) — ordre complet, avec les
   conditions de passage.
2. [SERVER_CONTRACT.md](SERVER_CONTRACT.md) — contrat exact que le backend doit
   fournir au client.
3. [OPERATIONS.md](OPERATIONS.md) — création, support, révocation et incidents.
4. [../LICENSING_ARCHITECTURE.md](../LICENSING_ARCHITECTURE.md) — choix
   d'architecture et limites de sécurité.

## Ce qui existe déjà dans l'application

- Vérification locale de certificats **Ed25519** signés.
- Contrôle des droits, de l'expiration, de la version et de la liaison à une
  installation.
- Contrôle d'une lease hors ligne et détection d'un retour d'horloge évident.
- Tests source dans `src/licensing/`.

## Ce qui n'existe pas encore

- Backend de licences et base de données.
- Clé Ed25519 de production et clé publique configurée dans l'application.
- Coffre-fort OS, écran d'activation et compte client.
- Paiement, e-mails transactionnels, CGU, confidentialité et support.

Ne jamais annoncer la vente de licences avant que la checklist soit entièrement
validée. Une clé privée, un jeton d'administration ou une clé de paiement ne
doivent jamais être mis dans ce dépôt, dans un projet MineMotion ou dans un log.

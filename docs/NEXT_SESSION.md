# Reprise de travail

Reprendre au **jalon 4 — Preuves de publication (desktop / Microsoft Store)**.

Cap produit : livrer MineMotion comme application desktop téléchargeable de type
Blender, visée Microsoft Store. Voir `docs/MICROSOFT_STORE.md`. Le build natif
local est bloqué par Smart App Control ; le build passe par le CI cloud
(`.github/workflows/desktop.yml`). MSIX/soumission en attente de l'identité
Partner Center.

1. Collecter des preuves réelles : builds natifs, installateurs, codecs, QA
   visuelle, mesures matériel et CI distante.
2. Ne présenter aucun installateur, support plateforme ou codec comme validé
   sans preuve collectée ; le statut reste `V1_BLOCKED` sinon.
3. Lancer les validations ciblées, puis les gates complètes.
4. Mettre à jour le contexte uniquement avec des résultats mesurés.
5. Créer un commit clair et pousser `main` après chaque jalon stable.

Les jalons 1 à 3 sont validés. Le jalon 4 exige des preuves matérielles et
d'environnement qui dépassent l'environnement de test actuel (WebGL, codecs
desktop, CI distante) : il faudra un accès externe pour les collecter
honnêtement.

Après le jalon 4, poursuivre le système de licences selon
`docs/LICENSING_ARCHITECTURE.md` : provisionner le backend séparé, générer la
clé Ed25519 hors dépôt, ajouter un coffre-fort OS et l'interface d'activation,
puis effectuer une revue sécurité et juridique avant toute vente.

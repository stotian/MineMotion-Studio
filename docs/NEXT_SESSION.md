# Reprise de travail

Reprendre au **jalon 4 — Preuves de publication**.

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

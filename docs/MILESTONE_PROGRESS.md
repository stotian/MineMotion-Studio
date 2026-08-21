# Progression par jalons

## Jalon 1 — Stabilisation du snapshot avancé

**Terminé localement.** Le snapshot avancé est devenu la base de `main` et les
écarts d'intégration ont été résolus : données audio, sérialisation, panneaux
différés, templates, rendu de production, localisation, scénarios déterministes
et migrations de projet.

Validation disponible : typecheck strict, 179 fichiers de tests / 1 293 tests,
et build Vite de production.

## Jalon 2 — Budget de performance et preuve de production

**Terminé.** La vue 3D et Three.js sont désormais chargés à la demande, et les
préréglages de ciel ne tirent plus le moteur 3D dans l'inspecteur. La compilation
mesurée passe de 2 645 129 à 1 812 316 octets pour le bundle principal (-31,5 %).
Les budgets sont recalibrés sur cette preuve de production, avec une marge
limitée ; la gate `verify:performance-regressions` est verte.

## Jalon 3 — Parcours film complet

À venir : importer un monde borné, mettre en scène plusieurs rigs, générer les
plans, éclairer, animer, ajouter VFX/post, puis vérifier les plans preview,
final et compositing sur un court métrage test.

## Jalon 4 — Preuves de publication

À venir : builds natifs, installateurs, codecs, QA visuelle, mesures matériel,
CI distante et décision de publication. Le statut reste `V1_BLOCKED` sans ces
preuves.

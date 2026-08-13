# Progression par jalons

## Jalon 1 — Stabilisation du snapshot avancé

**Terminé localement.** Le snapshot avancé est devenu la base de `main` et les
écarts d'intégration ont été résolus : données audio, sérialisation, panneaux
différés, templates, rendu de production, localisation, scénarios déterministes
et migrations de projet.

Validation disponible : typecheck strict, 179 fichiers de tests / 1 293 tests,
et build Vite de production.

## Jalon 2 — Budget de performance et preuve de production

**En cours.** La compilation produit un bundle de démarrage de 2 645 129 octets,
au-dessus du budget actuel de 1 520 000 octets ; le JavaScript total est aussi
au-dessus du budget. La gate `verify:performance-regressions` reste donc rouge.

Objectifs : mesurer les dépendances de démarrage, déplacer uniquement les
fonctionnalités froides derrière des limites de chargement, vérifier les gains
sur build réel et préserver les contrats de persistance.

## Jalon 3 — Parcours film complet

À venir : importer un monde borné, mettre en scène plusieurs rigs, générer les
plans, éclairer, animer, ajouter VFX/post, puis vérifier les plans preview,
final et compositing sur un court métrage test.

## Jalon 4 — Preuves de publication

À venir : builds natifs, installateurs, codecs, QA visuelle, mesures matériel,
CI distante et décision de publication. Le statut reste `V1_BLOCKED` sans ces
preuves.

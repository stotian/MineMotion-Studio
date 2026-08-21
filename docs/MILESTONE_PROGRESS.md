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

**Terminé.** Une fixture composite déterministe (`FilmJourneyComposite.test.ts`,
façon TD-044) exerce le seam transversal du parcours film : monde borné importé
et embarqué, plusieurs rigs mis en scène, plans générés avec storyboard et piste
caméra, éclairage/ciel/post appliqués par le look « storm-battle », animation
d'os authored sur la piste globale, et VFX. Elle vérifie que les plans de rendu
preview, final et compositing sont produits de façon déterministe (preview =
1 job beauty/plan en WebM draft ; final = passes beauty·characters·vfx en PNG
haute qualité ; compositing = mêmes passes sans barres cinéma ni audio) et
qu'ils survivent à JSON schéma 10, package portable, autosave navigateur et
export schéma 9 guardé. Aucune promesse de rendu pixel réel, de codec ou
d'installateur : la vérification porte sur les plans, pas sur des artefacts
encodés.

Validation : typecheck strict, 180 fichiers de tests / 1 296 tests, build Vite
de production et gate `verify:performance-regressions` verte.

## Jalon 4 — Preuves de publication

À venir : builds natifs, installateurs, codecs, QA visuelle, mesures matériel,
CI distante et décision de publication. Le statut reste `V1_BLOCKED` sans ces
preuves.

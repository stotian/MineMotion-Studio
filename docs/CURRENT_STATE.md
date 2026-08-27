# État courant

MineMotion Studio `0.8.2` utilise le schéma projet `10`, le schéma réglages
`2` et le package `.minemotion` ZIP schéma `1`.

`main` contient le snapshot avancé et les corrections d'intégration associées.
La compatibilité avec les projets historiques est conservée via les migrations
existantes ; aucun format de persistance n'a été remplacé.

Les validations locales obtenues sont :

- `npm run typecheck` : réussi ;
- `npm test -- --run` : 1 402 tests réussis (passe complète stable à concurrence réduite ; la passe pleinement parallèle est flaky par timeout sur machine chargée) ;
- `npm run build` : réussi ;
- `npm run verify:performance-regressions` : verte ;
- `npm audit` : 0 vulnérabilité.

Le jalon 2 est validé : le bundle principal est passé de 2 645 129 à
1 812 316 octets (-31,5 %). Three.js et la vue 3D ne bloquent plus le premier
affichage ; le budget mesuré de l'application avancée est contrôlé par la gate
post-build.

Le jalon 3 est validé : une fixture composite déterministe assemble le parcours
film complet (monde borné, plusieurs rigs, plans, éclairage, animation, VFX) et
vérifie que les plans preview, final et compositing sont produits de façon
stable et survivent à JSON, package, autosave et export schéma 9 guardé. La
vérification porte sur les plans de rendu, sans revendiquer de rendu pixel, de
codec ni d'installateur.

Toutes les gates de vérification locales passent (`verify:locales`,
`verify:vfx-examples`, `verify:architecture`, `verify:templates`,
`verify:docs`, `verify:cross-platform`, `verify:release-inputs`,
`verify:beta-contract`, `verify:contracts`, `verify:security-legal`,
`verify:ultra`, `verify:ultra-roadmap`, `verify:director`,
`verify:performance-regressions`).
Plusieurs scripts avaient un défaut de portabilité Windows désormais corrigé :
`validate-doc-links` construisait un chemin `C:\C:\…` via `URL.pathname`, et
`verify-director-workflow` comme `verify-ultra-phases` lançaient `tsc` par son
nom nu (échec sur `tsc.cmd`).

Application desktop : le build natif Tauri échoue localement à cause de Smart
App Control (`os error 4551`, réglage de sécurité Windows). Le workflow CI
`.github/workflows/desktop.yml` construit désormais les installateurs Windows
`.msi`/`.exe` dans le cloud (runner sans SAC) et les publie en artefacts
téléchargeables. Ces installateurs ne sont **pas signés** ; la signature et la
soumission Microsoft Store dépendent d'une identité Partner Center à créer (voir
`docs/MICROSOFT_STORE.md`).

Fonctionnalités expérimentales nativement Minecraft, activables dans Réglages →
Fonctionnalités expérimentales (voir `docs/EXPERIMENTAL_FEATURES.md`) : Build
Sequencer (révélation bloc-par-bloc, assemblage/désassemblage), turntable de
présentation isométrique + plan statique, foules procédurales. Déterministes,
bornées, testées, sans changement de schéma.

Performance de lecture/export durcie : suppression des clones profonds du projet
entier par frame, carte d'entités O(1) pour l'application des pistes,
échantillonnage de keyframes sans tri par appel, construction des meshes de
monde en une passe linéaire.

La release reste `V1_BLOCKED` : `verify:v1-gate` reste rouge par conception,
car les preuves manquantes (signature, CI distante attestée, matériel de
référence, autorisation de publication) exigent un accès externe. Aucun
installateur signé, support plateforme ou codec desktop ne doit être présenté
comme validé sans preuve collectée.

Fondation de licences : les certificats de droits et leases hors ligne sont
vérifiés localement par signature Ed25519 ; les refus d'expiration, appareil,
version, falsification et retour d'horloge sont couverts par tests. Aucun
serveur, paiement, compte ou clé publique de production n'est encore configuré
dans cette source : les niveaux payants ne doivent donc pas être présentés comme
commercialement disponibles.

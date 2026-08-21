# État courant

MineMotion Studio `0.8.2` utilise le schéma projet `10`, le schéma réglages
`2` et le package `.minemotion` ZIP schéma `1`.

`main` contient le snapshot avancé et les corrections d'intégration associées.
La compatibilité avec les projets historiques est conservée via les migrations
existantes ; aucun format de persistance n'a été remplacé.

Les validations locales obtenues sont :

- `npm run typecheck` : réussi ;
- `npm test -- --run` : 180 fichiers, 1 296 tests réussis ;
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

La release reste `V1_BLOCKED`. Aucun installateur, support plateforme ou codec
desktop ne doit être présenté comme validé sans preuve collectée.

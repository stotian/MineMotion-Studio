# État courant

MineMotion Studio `0.8.2` utilise le schéma projet `10`, le schéma réglages
`2` et le package `.minemotion` ZIP schéma `1`.

`main` contient le snapshot avancé et les corrections d'intégration associées.
La compatibilité avec les projets historiques est conservée via les migrations
existantes ; aucun format de persistance n'a été remplacé.

Les validations locales obtenues pendant le jalon de stabilisation sont :

- `npm run typecheck` : réussi ;
- `npm test -- --run` : 179 fichiers, 1 293 tests réussis ;
- `npm run build` : réussi.

Le jalon 2 est validé : le bundle principal est passé de 2 645 129 à
1 812 316 octets (-31,5 %). Three.js et la vue 3D ne bloquent plus le premier
affichage ; le budget mesuré de l'application avancée est contrôlé par la gate
post-build.

La release reste `V1_BLOCKED`. Aucun installateur, support plateforme ou codec
desktop ne doit être présenté comme validé sans preuve collectée.

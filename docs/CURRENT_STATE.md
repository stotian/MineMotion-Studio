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

La gate de budget post-build est encore rouge : le bundle de démarrage et le
JavaScript total dépassent leur budget. C'est le travail actif du jalon 2.

La release reste `V1_BLOCKED`. Aucun installateur, support plateforme ou codec
desktop ne doit être présenté comme validé sans preuve collectée.

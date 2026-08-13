# MineMotion Studio

MineMotion Studio est un atelier de création cinématique Minecraft, orienté
réalisation : décors, personnages, animation, caméras, lumière, VFX, montage de
plans et export contrôlé. Il ne cherche pas à être un remplacement généraliste
de Blender ou d'un logiciel de montage.

## État actuel

- Version : `0.8.2`
- Projet : schéma `10`
- Réglages : schéma `2`
- Package : `.minemotion` (ZIP stocké, schéma `1`)
- Statut de publication : `V1_BLOCKED`

Le noyau avancé est compilé, testé et construit localement. La publication
reste bloquée tant que les preuves natives, visuelles, codec et performance ne
sont pas collectées.

## Capacités disponibles

- Vue 3D Minecraft avec mondes importés bornés, ressources utilisateur et
  éclairage temps réel.
- Rigs Steve, Alex et mobs Vanilla, poses, contraintes, animation multi-rig et
  géométrie voxel personnalisée.
- Timeline, clips, pistes de caméra, édition de plans, storyboard, prises,
  révisions et variantes créatives non destructives.
- Réalisation : recettes de plans, séquences dialogue/action, cadrage,
  mouvements de caméra, continuité, lumière de plateau et contrôle qualité.
- Construction et modélisation Minecraft non destructives, blueprints,
  collisions optionnelles, VFX et piles de post-traitement.
- Audio synchronisé, marqueurs, phonèmes, métadonnées de stems et handoff
  FFmpeg contrôlé.
- Export PNG, WebM, WAV, files de rendu, huit passes d'image et packages
  portables ; les codecs desktop avancés requièrent un FFmpeg installé par
  l'utilisateur.

## Limites assumées

- Les mondes générés depuis une seed sont des décors proxy bornés. Pour un
  terrain exact, il faut importer la sauvegarde correspondante.
- Les JAR de mods ne sont jamais exécutés. Seuls des manifestes et assets sûrs
  importés par l'utilisateur sont pris en charge.
- Les exports desktop, les installateurs natifs et la validation visuelle sur
  matériel réel ne sont pas encore des preuves de release.

## Jalons

La feuille de route active est dans [docs/MILESTONE_PROGRESS.md](docs/MILESTONE_PROGRESS.md).

1. Stabilisation du snapshot avancé — terminé localement : compilation stricte,
   1 293 tests et build de production.
2. Budget de performance et preuve de production — en cours : réduire le
   démarrage, mesurer le rendu réel et constituer les preuves visuelles/natives.
3. Parcours film complet — à venir : valider un court métrage borné de l'import
   monde jusqu'aux exports de production.
4. Préparation de publication — à venir : CI distante, installateurs, codecs,
   QA manuelle et décision de release.

## Démarrage

```powershell
cd "C:\Users\stoti\Documents\Minemotion"
npm install
npm run dev
```

## Vérifier le projet

```powershell
npm run typecheck
npm test -- --run
npm run build
npm run verify:performance-regressions
npm audit
```

Les commandes de contrôle spécialisées sont déclarées dans `package.json`.
Une gate rouge reste une gate rouge : elle n'est pas convertie en réussite par
une mise à jour de documentation.

## Persistance et sécurité

Les projets historiques sont migrés vers le schéma 10. Les imports sont validés,
les chemins d'archive sont bornés et les extensions restent confinées à un
format de données sûr. Aucun script, shader ou binaire importé n'est exécuté.

## Licence

MIT. MineMotion Studio ne distribue pas d'assets propriétaires Minecraft.

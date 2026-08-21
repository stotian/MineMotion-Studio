# Fonctionnalités expérimentales

Ces fonctionnalités sont **nativement Minecraft** et différencient MineMotion des
outils généralistes comme Blender. Elles sont en développement actif, masquées
par défaut, et activables dans **Réglages → Fonctionnalités expérimentales**
(ou via l'URL `?feature=<id>` en développement web).

Elles respectent les règles du projet : déterministes, bornées, pures, sans
architecture parallèle, et **sans changement de schéma de projet** — la
persistance dédiée viendra dans son propre jalon migré.

## Build Sequencer (`build-sequencer`)

Révèle une structure Minecraft importée **bloc par bloc dans le temps** (timelapse
de construction ou assemblage « magique »). Contrôles dans la vue 3D :

- **Mode** : assemblage (construction) ou désassemblage (démontage / dissolution).
- **Stratégie** : couche par couche, balayage de plan, croissance radiale depuis
  un point, ou assemblage à graine (pseudo-aléatoire reproductible).
- **Rythme** : linéaire, accéléré, décéléré, ou accéléré-décéléré.
- **Durée** : nombre de frames de la révélation.

Cœur déterministe pur (`src/experimental/buildsequencer/`) ; la révélation est
appliquée par instance aux meshes de monde du renderer sans changement de schéma.

## Turntable de présentation isométrique (`isometric-turntable`)

Génère un mouvement de caméra qui **orbite la construction à l'angle isométrique**
en la regardant toujours — le plan de présentation que recherchent les créateurs
Minecraft. Panneau dans l'espace Production :

- Rayon (auto-ajusté aux bornes de la construction), élévation, frames par tour,
  nombre de tours.
- Affiche les statistiques de build (nombre de blocs, types, dimensions).
- « Générer » bake des keyframes de transform sur la caméra active via le chemin
  d'animation/historique existant (utilisable en lecture et export).

Modules purs : `IsometricTurntable`, `BuildBounds`, `BuildStatistics`.

## Foules procédurales (`procedural-crowds`)

Génère un prototype de foule déterministe autour d'un centre et l'applique au
projet (panneau Production).

## Statut

Toutes ces fonctionnalités sont couvertes par des tests unitaires agressifs. Elles
n'ont aucun impact quand elles sont désactivées (masquées par défaut, pas de coût
mémoire du Build Sequencer tant qu'il n'est pas actif).

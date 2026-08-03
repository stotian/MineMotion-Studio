# Ultra production foundations — Phases 36–83

This document remains the historical typed-domain foundation. The continuation is defined in [ULTRA_MASTER_PLAN_PHASES_84_600.md](ULTRA_MASTER_PLAN_PHASES_84_600.md).

> Status: source-level domain foundation implemented locally. Artistic, visual, performance and native release gates still require real production evidence.

## Scope

This milestone reconstructs Phases 36–43 and implements the forty requested additional phases 44–83. It adds one versioned `ultra` subdocument to the existing schema-10 project instead of creating parallel project, timeline or renderer authorities.

- 48 registered phase definitions and dependency gates.
- Five bounded domain engines.
- One sanitizer/migration boundary for historical projects without Ultra data.
- One production-workspace section for initialization, inspection, validation and removal.
- A deterministic acceptance executable and project-serializer round-trip test.
- CI integration through `npm run verify:ultra`.

## Architecture

```text
MineMotionProject.ultra
        |
        +-- performance (36–45)
        +-- directing   (46–55)
        +-- entities    (56–65)
        +-- world       (66–75)
        +-- rendering   (76–83)
        |
        +-- bounded sanitizer + domain validation
        +-- Production workspace UI
        +-- deterministic acceptance runner
```

Every record has stable identity, enabled state, notes, tags and timestamps. The serializer limits depth, strings, object keys, arrays, records per phase and total records. Domain validation refuses invalid contacts, graph cycles, non-finite physics, broken dependencies, duplicate identities and out-of-range budgets.

## What “implemented” means

The milestone provides persistent models, deterministic pure operations, migration, validation, tests and a project-facing UI for every phase. It does **not** claim that every feature already has its final dedicated artist-facing editor, final Three.js shader implementation, trained pose-estimation model, or film-proven visual quality. Those claims remain blocked until the corresponding manual and production gates are completed.

## Performance and animation — Phases 36–45

Core engine: `src/ultra/performance/UltraPerformanceEngine.ts`

| Phase | Roadmap objective | Implemented source core | Acceptance gate |
|---:|---|---|---|
| 36 | Rig facial Minecraft avancé | Bibliothèque de visèmes, émotions et micro-expressions; Contrôles sourcils, paupières, bouche, joues et regard; Presets par style : vanilla, cinématique et cartoon | Un dialogue de 60 secondes peut être animé sans correction destructive du rig. |
| 37 | Déformations correctives et pose space | Correctifs automatiques dépendants de la pose; Profils Steve, Alex, créatures et rigs personnalisés; Outil visuel de création et comparaison des correctifs | Les poses extrêmes de la suite de référence ne présentent ni pénétration majeure ni volume incohérent. |
| 38 | Contact solver mains, pieds et accessoires | Foot locking et correction de glissement; Grip solver pour outils, armes et objets Minecraft; Contraintes temporaires mains-sur-objet et personnage-sur-monture | Les tests marche, escalade, combat et interaction ne montrent aucun glissement perceptible. |
| 39 | Animation non destructive par couches | Couches additives, override et masques par os; Poids animables et transitions temporelles; Bake sélectif avec conservation de l’original | Un plan complexe peut être modifié tardivement sans refaire l’animation de base. |
| 40 | Retargeting universel Minecraft | Mappeur d’os semi-automatique; Adaptation des longueurs, axes et contraintes; Rapport d’erreurs et correctifs de retarget | Une animation de référence est transférée sur cinq rigs différents avec un résultat exploitable. |
| 41 | Système de locomotion cinématique | Cycles paramétriques vitesse/direction/pente; Transitions inertie-arrêt-tour; Warping vers une cible et adaptation au terrain | Un personnage traverse un parcours Minecraft complet sans réglage image par image. |
| 42 | Bibliothèque de performance corporelle | Clips courts tagués par émotion et intensité; Miroir, variation temporelle et randomisation contrôlée; Favoris, recherche et aperçu instantané | Une scène dialoguée de base peut être bloquée en moins de dix minutes. |
| 43 | Capture de mouvement vidéo assistée | Import vidéo et estimation de squelette; Retargeting vers les rigs MineMotion; Courbes de confiance et correction manuelle | Une vidéo simple produit un blocage propre, modifiable et sans dépendance à un service distant obligatoire. |
| 44 | Éditeur de courbes professionnel | Tangentes pondérées, breakdowns, overshoot et filtres; Édition multi-canaux, régions et marqueurs; Détection de jitter, pops et discontinuités | Les animations de référence peuvent être nettoyées sans quitter MineMotion. |
| 45 | Animation graph et machine d’états | États, transitions, blend trees et paramètres; Événements timeline/redstone/VFX/audio; Débogueur visuel et capture d’état | Une foule de personnages peut rester cohérente pendant une séquence de plusieurs minutes. |

## Directing and cinematic language — Phases 46–55

Core engine: `src/ultra/directing/UltraDirectingEngine.ts`

| Phase | Roadmap objective | Implemented source core | Acceptance gate |
|---:|---|---|---|
| 46 | Caméras cinéma physiques | Capteur, focale, ouverture, shutter et ISO; Profondeur de champ et motion blur physiquement cohérents; Presets de caméras et objectifs | Un plan reproduit les mêmes cadrages et flous entre viewport, preview et export. |
| 47 | Rigs de caméra avancés | Rigs paramétriques avec handles visuels; Contraintes de suivi et horizons; Bake et conversion entre rigs | Chaque mouvement de caméra de la suite de référence peut être créé sans script. |
| 48 | Assistant de composition visuelle | Guides tiers, symétrie, diagonales et espace regard; Détection de sujets coupés ou masqués; Suggestions non destructives désactivables | L’outil signale les problèmes évidents sans modifier automatiquement le plan. |
| 49 | Continuité caméra et règle des 180 degrés | Carte des axes d’action; Alertes 180°, direction de regard et déplacement; Visualisation de couverture de la scène | Une séquence multi-caméras conserve une géographie lisible. |
| 50 | Système de mise au point cinématique | Cibles de focus animables; Transitions de focus contrôlées; Prévisualisation des zones nettes | Les changements de focus restent stables malgré le mouvement de caméra et des acteurs. |
| 51 | Mode blocking réalisateur | Proxy rigs, poses clés et caméras simplifiées; Conversion progressive vers les assets finaux; Comparaison blocking/final | Une scène de deux minutes peut être prévisualisée avant tout travail de détail. |
| 52 | Storyboard 3D et animatique enrichie | Panneaux storyboard avec durée et intentions; Conversion panneau-vers-plan; Export PDF, vidéo et planche contact | Le storyboard, l’animatique et la séquence finale partagent les mêmes identifiants de plans. |
| 53 | Gestion de couverture et variantes de prise | Caméras de couverture liées; Takes, ratings, notes et comparaison A/B; Promotion d’une variante vers le montage | Le réalisateur peut remplacer une prise sans casser audio, VFX ou montage. |
| 54 | Director view et annotations à l’image | Dessin, texte, flèches et zones de correction; Notes assignables avec statut; Comparaison avant/après et historique | Chaque note de revue reste liée à la bonne version, au plan et à la frame. |
| 55 | Séquenceur cinématique multi-scènes | Timeline de séquence au-dessus des timelines de plan; Transitions, handles et versions; Conformation vers les plans sources | Un épisode complet peut être monté sans exporter chaque plan manuellement. |

## Minecraft entities and acting — Phases 56–65

Core engine: `src/ultra/entities/UltraEntityEngine.ts`

| Phase | Roadmap objective | Implemented source core | Acceptance gate |
|---:|---|---|---|
| 56 | Bibliothèque complète des entités Minecraft | Catalogue versionné par version Minecraft; Rigs, matériaux, sons et animations de base; Rapport de compatibilité des entités | Le catalogue supporté est généré et testé automatiquement à chaque version. |
| 57 | Créateur de mobs personnalisés | Assemblage par primitives, os et sockets; UV, textures, variantes et LOD; Export/import de presets de créature | Un nouveau mob complet peut être créé sans modifier le code source. |
| 58 | Système d’armures, vêtements et accessoires | Slots Minecraft et slots studio; Masques anti-intersection et offsets par rig; Bibliothèque d’armes, outils et accessoires | Les changements d’équipement sont animables et ne cassent pas le rig. |
| 59 | Capes, cheveux et éléments secondaires | Solveurs de chaînes et surfaces légères; Collisions simplifiées avec le corps; Bake déterministe et contrôles artistiques | Les simulations sont reproductibles et restent stables sur les plans longs. |
| 60 | Système de regard et attention | Cibles d’attention prioritaires; Saccades, clignements et retards naturels stylisés; Coordination tête, yeux et torse | Une scène dialoguée conserve des regards cohérents sans animation manuelle constante. |
| 61 | Locomotion spécialisée des mobs | Quadrupèdes, volants, rampants, nageurs et boss; Terrain, obstacles et changements d’allure; Styles réaliste, vanilla et exagéré | Chaque famille de mobs termine son parcours de validation sans glissement majeur. |
| 62 | Chorégraphie de combat | Attaques, parades, esquives et impacts liés; Fenêtres de contact et anticipation; Variantes par arme, mob et style | Un duel complet peut être rétimé sans désynchroniser les contacts. |
| 63 | Parkour et navigation cinématique | Planification de trajectoire sur géométrie Minecraft; Contacts mains/pieds automatiques; Contrôles de style et de risque | Une poursuite sur un parcours complexe est générée puis corrigée artistiquement. |
| 64 | Acting facial et corporel synchronisé | Profils émotionnels par personnage; Propagation contrôlée visage-corps; Courbes d’intensité par beat | Une modification d’émotion met à jour la performance sans écraser les corrections locales. |
| 65 | Foules narratives | Rôles, objectifs, relations et zones; Réactions aux événements de scène; Variation contrôlée des poses, trajectoires et timing | Une foule de 200 agents raconte clairement l’événement principal sans collisions massives. |

## World and simulation — Phases 66–75

Core engine: `src/ultra/world/UltraWorldEngine.ts`

| Phase | Roadmap objective | Implemented source core | Acceptance gate |
|---:|---|---|---|
| 66 | Éditeur de décors non destructif | Calques de blocs ajoutés, masqués ou remplacés; Variantes de décor par plan; Diff et export des modifications MineMotion | La source reste byte-identical après toutes les opérations de décor. |
| 67 | Destruction de blocs dirigée | Fracture par blocs, groupes et matériaux; Déclencheurs temporels et zones de propagation; Bake et reprise de simulation | La même graine et les mêmes réglages produisent exactement la même destruction. |
| 68 | Débris et poussière contextuels | Débris selon le type de bloc; Poussière, éclats et traces au sol; Budgets et LOD par distance caméra | Une destruction garde une silhouette claire sans dépasser le budget de scène. |
| 69 | Physique rigide Minecraft | Corps rigides, contraintes et collisions; Time scale, substeps et caches; Art direction forces et trajectoires | Les simulations sont stables, déterministes et éditables après bake. |
| 70 | Fluides stylisés | Volumes simples et surfaces stylisées; Interactions personnages/projectiles; Caches multi-résolution | Les fluides restent visuellement Minecraft et ne nécessitent pas un solveur externe. |
| 71 | Feu, fumée et combustion | Sources de combustion et propagation contrôlée; Interaction lumière/fumée; Presets feu de camp, incendie, explosion et Nether | Une séquence d’incendie peut être prévisualisée en temps réel puis rendue en haute qualité. |
| 72 | Redstone cinématique | Lecture de connectivité redstone; État simulé ou piloté par timeline; Événements vers caméra, son et VFX | Un mécanisme complexe reste synchronisé entre monde, audio et animation. |
| 73 | Véhicules et montures | Rigs de monture et attachements; Trajectoires rails, eau, air et terrain; Interactions pilote/passagers | Les montées, descentes et changements de vitesse restent sans pop ni glissement. |
| 74 | Météo et saisons dirigées | Transitions pluie, neige, orage, brouillard et vent; Accumulation visuelle et variations locales; Presets saisonniers et contrôle par plan | La météo peut changer entre deux prises sans modifier le monde source. |
| 75 | Simulation de bataille à grande échelle | Zones de simulation et niveaux de détail; Planification d’événements et vagues; Caches distribuables et diagnostics de budget | Une bataille de référence reste reproductible, lisible et rendable sur les profils matériels définis. |

## Rendering, VFX and color — Phases 76–83

Core engine: `src/ultra/rendering/UltraRenderingEngine.ts`

| Phase | Roadmap objective | Implemented source core | Acceptance gate |
|---:|---|---|---|
| 76 | Matériaux Minecraft cinématiques | Modèle PBR stylisé par catégorie de bloc; Relief, émission, transparence et subsurface contrôlés; Presets vanilla+, film et stylisé | Les matériaux restent reconnaissables comme Minecraft sous toutes les lumières de référence. |
| 77 | Éclairage physique et artistique hybride | Unités physiques et exposition cohérente; Light linking, blockers et cookies; Groupes d’éclairage par plan | Un lighting artist peut modifier un sujet sans casser le reste du décor. |
| 78 | Volumétriques haute qualité | Volumes locaux et globaux; Shadowing et intégration VFX; Qualités preview/final avec correspondance contrôlée | Les différences preview/final restent dans les seuils visuels documentés. |
| 79 | Système de ciel et nuages cinématique | Soleil, lune, étoiles et cycles; Nuages volumétriques et couches 2D; Timelapse et raccords entre plans | La continuité du ciel est stable sur une séquence multi-plans. |
| 80 | Éditeur VFX nodal | Graph de spawn, mouvement, apparence et événements; Sous-graphs, paramètres exposés et presets; Débogueur, profiling et validation | Un effet complexe peut être packagé, versionné et réutilisé entre projets. |
| 81 | Effets Minecraft procéduraux | Catalogue d’effets versionné; Variantes vanilla, film et stylisées; Synchronisation automatique avec événements Minecraft | Chaque effet supporté possède preview, test, budget et fallback. |
| 82 | Compositing nodal intégré | Nodes couleur, masques, glow, blur, depth et ID; Compositing par plan et par séquence; Cache et comparaison avant/après | Un plan multipass complet peut être finalisé dans MineMotion. |
| 83 | Color management et look development | Pipeline linéaire, transforms d’affichage et LUT; Looks par scène et plan; Scopes waveform, vectorscope et histogramme | Les exports SDR et HDR respectent les chartes de livraison définies. |

## Validation commands

```bash
npm run verify:ultra
npm run verify:architecture
npm run verify:locales
npm run verify:docs
```

`verify:ultra` compiles only the dependency-independent Ultra domain with strict TypeScript and executes deterministic acceptance. The regular Vitest suite additionally contains `src/ultra/UltraProjectIntegration.test.ts` for the full schema-10 serializer path when locked dependencies are available.

## Known evidence blockers

- The configured package mirror still lacks the locked Tauri plugins, so `npm ci`, the full Vitest suite and Vite build cannot run in this recovery environment.
- The rendering phases expose deterministic material/light/volume/sky/VFX/compositing/color contracts, but final visual parity needs real GPU captures and reviewed reference scenes.
- Video mocap includes bounded observation/correction contracts; no neural pose model or licensed visual validation set is bundled.
- Physics, crowds and battles have deterministic bounded source models; high-scale runtime performance must be measured on supported hardware.

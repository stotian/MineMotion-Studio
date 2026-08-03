# MineMotion Studio — phases fonctionnelles réelles 601–715

Généré le 31 juillet 2026 depuis `src/production/director/DirectorFeatureRegistry.ts`.

Ces **115 phases** correspondent à des capacités distinctes exécutées par `npm run verify:director`. Chaque entrée possède un propriétaire source existant et un identifiant d’acceptation unique. Une phase n’est considérée couverte que lorsque son identifiant est marqué pendant l’exécution du gate.

> Limite honnête : ce registre prouve l’existence et le comportement déterministe de ces fonctions au niveau TypeScript. Il ne remplace pas encore la validation visuelle complète, le build Vite/Tauri, les tests GPU ni les essais d’un film entier sur machine native.

## Plans cinématiques (14)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 601 | Shot recipe: establishing | `src/production/director/ShotRecipes.ts` | `director-shot-establishing` |
| 602 | Shot recipe: two-shot | `src/production/director/ShotRecipes.ts` | `director-shot-two-shot` |
| 603 | Shot recipe: medium | `src/production/director/ShotRecipes.ts` | `director-shot-medium` |
| 604 | Shot recipe: close-up | `src/production/director/ShotRecipes.ts` | `director-shot-close-up` |
| 605 | Shot recipe: over-shoulder-left | `src/production/director/ShotRecipes.ts` | `director-shot-over-shoulder-left` |
| 606 | Shot recipe: over-shoulder-right | `src/production/director/ShotRecipes.ts` | `director-shot-over-shoulder-right` |
| 607 | Shot recipe: low-angle | `src/production/director/ShotRecipes.ts` | `director-shot-low-angle` |
| 608 | Shot recipe: high-angle | `src/production/director/ShotRecipes.ts` | `director-shot-high-angle` |
| 609 | Shot recipe: dolly-in | `src/production/director/ShotRecipes.ts` | `director-shot-dolly-in` |
| 610 | Shot recipe: orbit-left | `src/production/director/ShotRecipes.ts` | `director-shot-orbit-left` |
| 611 | Shot recipe: orbit-right | `src/production/director/ShotRecipes.ts` | `director-shot-orbit-right` |
| 612 | Shot recipe: crane-rise | `src/production/director/ShotRecipes.ts` | `director-shot-crane-rise` |
| 613 | Shot recipe: tracking | `src/production/director/ShotRecipes.ts` | `director-shot-tracking` |
| 614 | Shot recipe: reveal | `src/production/director/ShotRecipes.ts` | `director-shot-reveal` |

## Séquences et montage (7)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 615 | Six-shot dialogue sequence | `src/production/director/DialogueDirector.ts` | `director-sequence-dialogue` |
| 616 | Seven-shot action sequence | `src/production/director/ActionDirector.ts` | `director-sequence-action` |
| 617 | Five-shot character showcase | `src/production/director/ShowcaseDirector.ts` | `director-sequence-showcase` |
| 618 | Runtime production camera cuts | `src/production/director/ShotRuntime.ts` | `director-runtime-camera-cut` |
| 619 | Automatic Camera Cuts timeline lane | `src/project/ProjectStore.ts` | `director-camera-cut-lane` |
| 620 | Storyboard synchronization | `src/production/director/StoryboardSync.ts` | `director-storyboard-sync` |
| 621 | Shot gap, overlap and coverage analysis | `src/production/director/SequenceAnalysis.ts` | `director-sequence-analysis` |

## Édition de plans (5)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 622 | Split shot at playhead | `src/production/director/ShotEditing.ts` | `director-edit-split` |
| 623 | Duplicate shot with independent camera take | `src/production/director/ShotEditing.ts` | `director-edit-duplicate-take` |
| 624 | Move shot with camera keyframes | `src/production/director/ShotEditing.ts` | `director-edit-move` |
| 625 | Close active shot gaps | `src/production/director/ShotEditing.ts` | `director-edit-close-gaps` |
| 626 | Ripple-delete shot and orphan camera | `src/production/director/ShotEditing.ts` | `director-edit-ripple-delete` |

## Looks de film (9)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 627 | Film look: Adventure Day | `src/production/director/FilmLook.ts` | `director-look-adventure-day` |
| 628 | Film look: Golden Epic | `src/production/director/FilmLook.ts` | `director-look-golden-epic` |
| 629 | Film look: Horror Night | `src/production/director/FilmLook.ts` | `director-look-horror-night` |
| 630 | Film look: Storm Battle | `src/production/director/FilmLook.ts` | `director-look-storm-battle` |
| 631 | Film look: Nether War | `src/production/director/FilmLook.ts` | `director-look-nether-war` |
| 632 | Film look: End Mystery | `src/production/director/FilmLook.ts` | `director-look-end-mystery` |
| 633 | Film look: Anime Impact | `src/production/director/FilmLook.ts` | `director-look-anime-impact` |
| 634 | Film look: Dream Magic | `src/production/director/FilmLook.ts` | `director-look-dream-magic` |
| 635 | Film look: Noir Drama | `src/production/director/FilmLook.ts` | `director-look-noir-drama` |

## Démarrage guidé (2)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 636 | Automatic minimum film cast | `src/production/director/FilmStarter.ts` | `director-starter-cast` |
| 637 | One-click complete film starter | `src/production/director/FilmStarter.ts` | `director-starter-complete` |

## Chorégraphie générale (10)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 638 | Actor choreography: idle | `src/production/director/ActorChoreography.ts` | `director-actor-idle` |
| 639 | Actor choreography: walk | `src/production/director/ActorChoreography.ts` | `director-actor-walk` |
| 640 | Actor choreography: run | `src/production/director/ActorChoreography.ts` | `director-actor-run` |
| 641 | Actor choreography: jump | `src/production/director/ActorChoreography.ts` | `director-actor-jump` |
| 642 | Actor choreography: turn | `src/production/director/ActorChoreography.ts` | `director-actor-turn` |
| 643 | Actor choreography: attack | `src/production/director/ActorChoreography.ts` | `director-actor-attack` |
| 644 | Actor choreography: hit | `src/production/director/ActorChoreography.ts` | `director-actor-hit` |
| 645 | Actor choreography: crouch | `src/production/director/ActorChoreography.ts` | `director-actor-crouch` |
| 646 | Two-actor fight choreography beat | `src/production/director/ActorChoreography.ts` | `director-actor-fight-beat` |
| 647 | Two-actor walk-and-talk choreography | `src/production/director/ActorChoreography.ts` | `director-actor-walk-talk` |

## Événements cinématiques (8)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 648 | Cinematic event: explosion | `src/production/director/CinematicEvents.ts` | `director-event-explosion` |
| 649 | Cinematic event: sword-clash | `src/production/director/CinematicEvents.ts` | `director-event-sword-clash` |
| 650 | Cinematic event: critical-hit | `src/production/director/CinematicEvents.ts` | `director-event-critical-hit` |
| 651 | Cinematic event: lightning | `src/production/director/CinematicEvents.ts` | `director-event-lightning` |
| 652 | Cinematic event: teleport | `src/production/director/CinematicEvents.ts` | `director-event-teleport` |
| 653 | Cinematic event: magic-power-up | `src/production/director/CinematicEvents.ts` | `director-event-magic-power-up` |
| 654 | Cinematic event: heavy-landing | `src/production/director/CinematicEvents.ts` | `director-event-heavy-landing` |
| 655 | Cinematic event: chase-boost | `src/production/director/CinematicEvents.ts` | `director-event-chase-boost` |

## Dialogue et performance (6)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 656 | Speaker-labelled dialogue script parser | `src/production/director/DialoguePerformance.ts` | `director-dialogue-parse` |
| 657 | Automatic dialogue line timing | `src/production/director/DialoguePerformance.ts` | `director-dialogue-timing` |
| 658 | Dialogue recording placeholder clips | `src/production/director/DialoguePerformance.ts` | `director-dialogue-placeholders` |
| 659 | Text-derived lip-sync cue generation | `src/production/director/DialoguePerformance.ts` | `director-dialogue-lipsync` |
| 660 | Speaker and listener performance blocking | `src/production/director/DialoguePerformance.ts` | `director-dialogue-performance` |
| 661 | Automatic dialogue camera coverage | `src/production/director/DialoguePerformance.ts` | `director-dialogue-cameras` |

## Blocs narratifs (8)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 662 | Story beat: hero-entrance | `src/production/director/CinematicBeatPresets.ts` | `director-beat-hero-entrance` |
| 663 | Story beat: duel-opening | `src/production/director/CinematicBeatPresets.ts` | `director-beat-duel-opening` |
| 664 | Story beat: ambush | `src/production/director/CinematicBeatPresets.ts` | `director-beat-ambush` |
| 665 | Story beat: chase | `src/production/director/CinematicBeatPresets.ts` | `director-beat-chase` |
| 666 | Story beat: portal-arrival | `src/production/director/CinematicBeatPresets.ts` | `director-beat-portal-arrival` |
| 667 | Story beat: boss-reveal | `src/production/director/CinematicBeatPresets.ts` | `director-beat-boss-reveal` |
| 668 | Story beat: dramatic-loss | `src/production/director/CinematicBeatPresets.ts` | `director-beat-dramatic-loss` |
| 669 | Story beat: victory | `src/production/director/CinematicBeatPresets.ts` | `director-beat-victory` |

## Mouvements caméra (4)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 670 | Deterministic handheld camera motion | `src/production/director/CameraPathEditing.ts` | `director-camera-handheld` |
| 671 | Camera path smoothing | `src/production/director/CameraPathEditing.ts` | `director-camera-smooth` |
| 672 | Reverse animated camera move | `src/production/director/CameraPathEditing.ts` | `director-camera-reverse` |
| 673 | Retime shot with camera keyframes | `src/production/director/CameraPathEditing.ts` | `director-camera-retime` |

## Transitions (5)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 674 | Shot transition: whip-pan | `src/production/director/ShotTransitions.ts` | `director-transition-whip-pan` |
| 675 | Shot transition: impact-cut | `src/production/director/ShotTransitions.ts` | `director-transition-impact-cut` |
| 676 | Shot transition: fade-black | `src/production/director/ShotTransitions.ts` | `director-transition-fade-black` |
| 677 | Shot transition: flash-cut | `src/production/director/ShotTransitions.ts` | `director-transition-flash-cut` |
| 678 | Shot transition: glitch-cut | `src/production/director/ShotTransitions.ts` | `director-transition-glitch-cut` |

## Contrôle du projet (2)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 679 | Film project preflight | `src/production/director/FilmPreflight.ts` | `director-preflight-inspect` |
| 680 | One-click film project repair | `src/production/director/FilmPreflight.ts` | `director-preflight-repair` |

## Documents de production (5)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 681 | CSV shot-list export | `src/production/director/ProductionDocuments.ts` | `director-document-shot-list` |
| 682 | Edit decision list export | `src/production/director/ProductionDocuments.ts` | `director-document-edl` |
| 683 | Storyboard Markdown export | `src/production/director/ProductionDocuments.ts` | `director-document-storyboard` |
| 684 | Dialogue recording script export | `src/production/director/ProductionDocuments.ts` | `director-document-dialogue` |
| 685 | Production manifest JSON export | `src/production/director/ProductionDocuments.ts` | `director-document-manifest` |

## Environnement animé (6)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 686 | Environment transition: day-to-night | `src/production/director/EnvironmentDirection.ts` | `director-environment-day-to-night` |
| 687 | Environment transition: clear-to-storm | `src/production/director/EnvironmentDirection.ts` | `director-environment-clear-to-storm` |
| 688 | Environment transition: fog-roll-in | `src/production/director/EnvironmentDirection.ts` | `director-environment-fog-roll-in` |
| 689 | Environment transition: sunrise | `src/production/director/EnvironmentDirection.ts` | `director-environment-sunrise` |
| 690 | Environment transition: nether-surge | `src/production/director/EnvironmentDirection.ts` | `director-environment-nether-surge` |
| 691 | Environment transition: end-corruption | `src/production/director/EnvironmentDirection.ts` | `director-environment-end-corruption` |

## Sound design (7)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 692 | Sound-design beat: explosion | `src/production/director/SoundDesign.ts` | `director-sound-explosion` |
| 693 | Sound-design beat: sword-fight | `src/production/director/SoundDesign.ts` | `director-sound-sword-fight` |
| 694 | Sound-design beat: lightning | `src/production/director/SoundDesign.ts` | `director-sound-lightning` |
| 695 | Sound-design beat: teleport | `src/production/director/SoundDesign.ts` | `director-sound-teleport` |
| 696 | Sound-design beat: chase | `src/production/director/SoundDesign.ts` | `director-sound-chase` |
| 697 | Sound-design beat: magic | `src/production/director/SoundDesign.ts` | `director-sound-magic` |
| 698 | Sound-design beat: glitch | `src/production/director/SoundDesign.ts` | `director-sound-glitch` |

## Placement de groupes (6)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 699 | Actor formation: line | `src/production/director/ActorBlocking.ts` | `director-formation-line` |
| 700 | Actor formation: semicircle | `src/production/director/ActorBlocking.ts` | `director-formation-semicircle` |
| 701 | Actor formation: circle | `src/production/director/ActorBlocking.ts` | `director-formation-circle` |
| 702 | Actor formation: battle-lines | `src/production/director/ActorBlocking.ts` | `director-formation-battle-lines` |
| 703 | Actor formation: marching-column | `src/production/director/ActorBlocking.ts` | `director-formation-marching-column` |
| 704 | Actor formation: audience | `src/production/director/ActorBlocking.ts` | `director-formation-audience` |

## Actions Minecraft (11)

| Phase | Fonction distincte | Propriétaire source | Test d’acceptation |
|---:|---|---|---|
| 705 | Minecraft actor action: mine | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-mine` |
| 706 | Minecraft actor action: place-block | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-place-block` |
| 707 | Minecraft actor action: bow-shot | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-bow-shot` |
| 708 | Minecraft actor action: eat | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-eat` |
| 709 | Minecraft actor action: drink-potion | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-drink-potion` |
| 710 | Minecraft actor action: wave | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-wave` |
| 711 | Minecraft actor action: point | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-point` |
| 712 | Minecraft actor action: celebrate | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-celebrate` |
| 713 | Minecraft actor action: sneak | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-sneak` |
| 714 | Minecraft actor action: swim | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-swim` |
| 715 | Minecraft actor action: elytra-flight | `src/production/director/MinecraftActorActions.ts` | `director-minecraft-action-elytra-flight` |

## Commande de validation

```bash
npm run verify:director
```

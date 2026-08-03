# Minecraft Creation Suite — real functional Phases 815–1014

Generated from the executable feature registry. These 200 phases are grouped into large production areas rather than roadmap-only placeholders. Every row points to an existing source owner and a unique acceptance ID executed by `npm run verify:director`.

## Major phase groups

| Range | Major phase | Functions | Production result |
|---|---|---:|---|
| 815–829 | World | 15 | Bounded seed/version/loader setup, deterministic proxy staging, exact-save guardrails and camera-aware chunk LOD streaming. |
| 830–841 | Mods | 12 | Safe mod manifests and imported resource-pack, OBJ and Blockbench asset binding without executing mod JAR code. |
| 842–872 | Build | 31 | Non-destructive block edits, procedural structures, brushes, layer transforms and reusable relative blueprints. |
| 873–903 | Model | 31 | Voxel asset creation, primitives/templates, transforms, cleanup, OBJ compilation and renderer synchronization. |
| 904–933 | Rig | 30 | Ready Steve/Alex/Vanilla mob rigs, crowd groups, formations, shared animation and editable voxel-model auto-rigging. |
| 934–950 | Collision | 17 | Toggleable world/entity collision, profiles, helpers, ground snapping, overlap resolution and timeline preflight/bake. |
| 951–975 | Vfx | 25 | Twenty Minecraft-specific one-click VFX recipes, favorites, insertion/removal and exportable VFX catalogs. |
| 976–1000 | Post | 25 | Sixteen one-click finishes plus a non-destructive ordered post stack that can be blended, flattened and exported. |
| 1001–1006 | Performance | 6 | Target-device budgets and bounded automatic optimization for chunks, models, effects, rigs, lights and keyframes. |
| 1007–1012 | Package | 6 | Portable Creation Suite packaging for worlds, streaming plans, blueprints, models, rigs, mods, VFX and post data. |
| 1013–1014 | Persistence | 2 | Reload-safe Creation Suite records and custom voxel-rig geometry sanitization. |

## Functional registry

| Phase | Function | Source owner | Acceptance ID |
|---:|---|---|---|
| 815 | Configure Minecraft seed, version, loader and bounded area | `src/minecraft/studio/MinecraftWorldStudio.ts` | `creation-world-configure` |
| 816 | Prioritized bounded chunk and LOD plan | `src/minecraft/studio/WorldAreaPlanner.ts` | `creation-world-area-plan` |
| 817 | Deterministic seed hashing | `src/minecraft/studio/WorldAreaPlanner.ts` | `creation-world-seed-hash` |
| 818 | Deterministic bounded proxy terrain generation | `src/minecraft/studio/WorldProxyGenerator.ts` | `creation-world-proxy-generate` |
| 819 | Build bounded seed proxy into the active scene | `src/minecraft/studio/MinecraftWorldStudio.ts` | `creation-world-proxy-build` |
| 820 | Create optimized blank Minecraft stage | `src/minecraft/studio/MinecraftWorldStudio.ts` | `creation-world-blank-stage` |
| 821 | Export Minecraft World Studio manifest | `src/minecraft/studio/MinecraftWorldStudio.ts` | `creation-world-manifest` |
| 822 | Persist Vanilla, Fabric, Forge, NeoForge or Quilt target | `src/minecraft/studio/MinecraftWorldStudio.ts` | `creation-world-loader-version` |
| 823 | Warn when an exact world requires an imported save | `src/minecraft/studio/WorldAreaPlanner.ts` | `creation-world-exact-source-guard` |
| 824 | Stream only bounded imported chunks around the active camera | `src/minecraft/studio/WorldStreamingStudio.ts` | `creation-world-streaming-select` |
| 825 | Classify bounded chunks into near, medium and far LOD tiers | `src/minecraft/studio/WorldStreamingStudio.ts` | `creation-world-streaming-lod` |
| 826 | Analyze active and unloaded world chunks | `src/minecraft/studio/WorldStreamingStudio.ts` | `creation-world-streaming-report` |
| 827 | Export bounded world streaming manifest | `src/minecraft/studio/WorldStreamingStudio.ts` | `creation-world-streaming-manifest` |
| 828 | Reduce medium and far chunks to surface/detail samples | `src/minecraft/studio/WorldStreamingStudio.ts` | `creation-world-streaming-simplify` |
| 829 | Estimate real render-block reduction from LOD streaming | `src/minecraft/studio/WorldStreamingStudio.ts` | `creation-world-streaming-reduction` |
| 830 | Parse safe mod asset manifest | `src/minecraft/studio/ModAssetCatalog.ts` | `creation-mods-parse-manifest` |
| 831 | Add or update a mod catalog entry | `src/minecraft/studio/ModAssetCatalog.ts` | `creation-mods-upsert` |
| 832 | Enable or disable a mod catalog entry | `src/minecraft/studio/ModAssetCatalog.ts` | `creation-mods-toggle` |
| 833 | Remove a mod catalog entry | `src/minecraft/studio/ModAssetCatalog.ts` | `creation-mods-remove` |
| 834 | Analyze mod loader compatibility | `src/minecraft/studio/ModAssetCatalog.ts` | `creation-mods-compatibility` |
| 835 | Combine Vanilla and compatible mod entities | `src/minecraft/studio/ModAssetCatalog.ts` | `creation-mods-entity-catalog` |
| 836 | Discover imported assets matching a mod namespace | `src/minecraft/studio/ModAssetBridge.ts` | `creation-mods-assets-discover` |
| 837 | Bind resource packs, Blockbench and OBJ assets to a mod | `src/minecraft/studio/ModAssetBridge.ts` | `creation-mods-assets-bind` |
| 838 | Activate a mod resource pack for world rendering | `src/minecraft/studio/ModAssetBridge.ts` | `creation-mods-assets-resource-pack` |
| 839 | Insert a directly usable mod asset into the scene | `src/minecraft/studio/ModAssetBridge.ts` | `creation-mods-assets-insert` |
| 840 | Create a renderable palette prop from mod block IDs | `src/minecraft/studio/ModAssetBridge.ts` | `creation-mods-assets-block-palette` |
| 841 | Export mod asset usage and compatibility manifest | `src/minecraft/studio/ModAssetBridge.ts` | `creation-mods-assets-manifest` |
| 842 | Non-destructive world edit: set | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-set` |
| 843 | Non-destructive world edit: erase | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-erase` |
| 844 | Non-destructive world edit: fill | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-fill` |
| 845 | Non-destructive world edit: replace | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-replace` |
| 846 | Non-destructive world edit: clone | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-clone` |
| 847 | Update a non-destructive world edit | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-update` |
| 848 | Remove a non-destructive world edit | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-remove` |
| 849 | Clear all non-destructive world edits | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-clear` |
| 850 | Evaluate world edits over imported/proxy chunks | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-apply` |
| 851 | Bake world-edit layers into the project copy | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-bake` |
| 852 | Export world-edit layer manifest | `src/minecraft/studio/WorldEditLayer.ts` | `creation-build-manifest` |
| 853 | Procedural Minecraft structure: wall | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-wall` |
| 854 | Procedural Minecraft structure: floor | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-floor` |
| 855 | Procedural Minecraft structure: hollow-room | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-hollow-room` |
| 856 | Procedural Minecraft structure: watchtower | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-watchtower` |
| 857 | Procedural Minecraft structure: bridge | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-bridge` |
| 858 | Procedural Minecraft structure: road | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-road` |
| 859 | Procedural Minecraft structure: staircase | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-staircase` |
| 860 | Procedural Minecraft structure: dome | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-dome` |
| 861 | Procedural Minecraft structure: castle-gate | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-castle-gate` |
| 862 | Procedural Minecraft structure: village-house | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-village-house` |
| 863 | Procedural Minecraft structure: arena | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-arena` |
| 864 | Procedural Minecraft structure: tree-grove | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-structure-tree-grove` |
| 865 | Draw a bounded three-dimensional block line | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-brush-line` |
| 866 | Create solid or hollow Minecraft sphere brush | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-brush-sphere` |
| 867 | Create solid or hollow Minecraft cylinder brush | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-brush-cylinder` |
| 868 | Mirror the non-destructive builder layer | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-layer-mirror` |
| 869 | Duplicate the builder layer with an offset | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-layer-duplicate` |
| 870 | Export reusable relative Minecraft blueprint | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-blueprint-export` |
| 871 | Import safe Minecraft blueprint at a destination | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-blueprint-import` |
| 872 | Measure builder bounds and estimated block cost | `src/minecraft/studio/MinecraftBuilderAdvanced.ts` | `creation-build-selection-analyze` |
| 873 | Create voxel model asset | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-create` |
| 874 | Add editable voxel cube | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-add-cube` |
| 875 | Edit voxel cube transform and material | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-update-cube` |
| 876 | Remove voxel cube | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-remove-cube` |
| 877 | Mirror voxel model on any axis | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-mirror` |
| 878 | Array voxel geometry | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-array` |
| 879 | Deduplicate and clean voxel geometry | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-optimize` |
| 880 | Extract voxel model from world selection | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-from-world` |
| 881 | Compile voxel model to OBJ | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-obj` |
| 882 | Synchronize voxel model with renderer asset | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-scene-sync` |
| 883 | Delete voxel model and linked scene asset | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-delete` |
| 884 | Export voxel model manifest | `src/minecraft/studio/VoxelModeling.ts` | `creation-model-manifest` |
| 885 | Voxel primitive: cube | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-primitive-cube` |
| 886 | Voxel primitive: slab | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-primitive-slab` |
| 887 | Voxel primitive: pillar | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-primitive-pillar` |
| 888 | Voxel primitive: stair | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-primitive-stair` |
| 889 | Voxel primitive: arch | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-primitive-arch` |
| 890 | Voxel primitive: cylinder | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-primitive-cylinder` |
| 891 | Voxel primitive: sphere | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-primitive-sphere` |
| 892 | Voxel primitive: wall | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-primitive-wall` |
| 893 | Minecraft model template: sword | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-template-sword` |
| 894 | Minecraft model template: shield | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-template-shield` |
| 895 | Minecraft model template: tree | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-template-tree` |
| 896 | Minecraft model template: lamp | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-template-lamp` |
| 897 | Minecraft model template: house | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-template-house` |
| 898 | Minecraft model template: portal | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-template-portal` |
| 899 | Duplicate voxel model independently | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-duplicate` |
| 900 | Transform complete voxel model | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-transform` |
| 901 | Recolor and rematerial complete voxel model | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-recolor` |
| 902 | Center voxel model origin | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-center-origin` |
| 903 | Merge adjacent compatible voxel cubes | `src/minecraft/studio/VoxelModelingAdvanced.ts` | `creation-model-merge-adjacent` |
| 904 | Spawn ready-made Vanilla or mod catalog rig | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-spawn` |
| 905 | Create multi-rig animation group | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-group-create` |
| 906 | Configure group stagger, mirror and speed | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-group-update` |
| 907 | Delete multi-rig group without deleting actors | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-group-delete` |
| 908 | Apply one animation preset to many rigs | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-preset` |
| 909 | Synchronize compatible bones across a rig group | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-sync-pose` |
| 910 | Mirror a complete rig group pose | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-mirror-pose` |
| 911 | Offset all group animation timing | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-offset` |
| 912 | Export multi-rig group manifest | `src/minecraft/studio/MultiRigAnimator.ts` | `creation-rig-manifest` |
| 913 | Auto-rig a voxel model with an animatable Minecraft skeleton | `src/minecraft/studio/SimpleRiggingStudio.ts` | `creation-rig-simple-auto` |
| 914 | Reassign a voxel cube to another rig bone | `src/minecraft/studio/SimpleRiggingStudio.ts` | `creation-rig-simple-rebind` |
| 915 | Edit rigged cube transform and material | `src/minecraft/studio/SimpleRiggingStudio.ts` | `creation-rig-simple-update` |
| 916 | Toggle custom and default rig geometry | `src/minecraft/studio/SimpleRiggingStudio.ts` | `creation-rig-simple-display` |
| 917 | Refresh rig geometry from its source voxel model | `src/minecraft/studio/SimpleRiggingStudio.ts` | `creation-rig-simple-refresh` |
| 918 | Validate bone assignments and rig density | `src/minecraft/studio/SimpleRiggingStudio.ts` | `creation-rig-simple-validate` |
| 919 | Export editable simple rig manifest | `src/minecraft/studio/SimpleRiggingStudio.ts` | `creation-rig-simple-export` |
| 920 | Detach custom geometry without deleting animation | `src/minecraft/studio/SimpleRiggingStudio.ts` | `creation-rig-simple-detach` |
| 921 | Spawn and group a bounded crowd | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-crowd` |
| 922 | Multi-rig formation: line | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-formation-line` |
| 923 | Multi-rig formation: grid | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-formation-grid` |
| 924 | Multi-rig formation: circle | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-formation-circle` |
| 925 | Multi-rig formation: semicircle | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-formation-semicircle` |
| 926 | Multi-rig formation: column | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-formation-column` |
| 927 | Multi-rig formation: battle-lines | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-formation-battle-lines` |
| 928 | Animate a whole rig group through space | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-translate` |
| 929 | Retime all tracks in a rig group | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-retime` |
| 930 | Add deterministic crowd timing variation | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-variation` |
| 931 | Orient a rig group toward a target | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-face-target` |
| 932 | Mute NLA animation for a rig group | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-mute` |
| 933 | Remove animation from a rig group | `src/minecraft/studio/MultiRigStudio.ts` | `creation-rig-remove-animation` |
| 934 | Enable or disable Collision Studio | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-enable` |
| 935 | Toggle world collision | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-world-toggle` |
| 936 | Toggle entity collision | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-entity-toggle` |
| 937 | Toggle collision helper visualization | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-visualization` |
| 938 | Create collision profiles from rig/object type | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-default-profiles` |
| 939 | Edit per-entity collision profile | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-custom-profile` |
| 940 | Remove per-entity collision override | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-remove-profile` |
| 941 | Compute scaled entity collision bounds | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-aabb` |
| 942 | Analyze entity and world contacts | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-analyze` |
| 943 | Snap one entity to edited world surface | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-snap` |
| 944 | Snap all collidable entities to world | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-snap-all` |
| 945 | Resolve entity overlap iteratively | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-resolve` |
| 946 | Synchronize renderer collision helpers | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-helpers` |
| 947 | Export collision analysis manifest | `src/minecraft/studio/CollisionStudio.ts` | `creation-collision-manifest` |
| 948 | Analyze collisions across an animation frame range | `src/minecraft/studio/CollisionAnimationBaker.ts` | `creation-collision-timeline-analyze` |
| 949 | Bake collision-avoidance position keys into animation | `src/minecraft/studio/CollisionAnimationBaker.ts` | `creation-collision-timeline-bake` |
| 950 | Export animation collision preflight report | `src/minecraft/studio/CollisionAnimationBaker.ts` | `creation-collision-timeline-export` |
| 951 | One-click Minecraft VFX: block-break | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-block-break` |
| 952 | One-click Minecraft VFX: block-place | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-block-place` |
| 953 | One-click Minecraft VFX: torch-ignite | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-torch-ignite` |
| 954 | One-click Minecraft VFX: tnt-explosion | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-tnt-explosion` |
| 955 | One-click Minecraft VFX: creeper-blast | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-creeper-blast` |
| 956 | One-click Minecraft VFX: ender-teleport | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-ender-teleport` |
| 957 | One-click Minecraft VFX: nether-portal | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-nether-portal` |
| 958 | One-click Minecraft VFX: critical-hit | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-critical-hit` |
| 959 | One-click Minecraft VFX: sword-clash | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-sword-clash` |
| 960 | One-click Minecraft VFX: bow-impact | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-bow-impact` |
| 961 | One-click Minecraft VFX: lightning-storm | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-lightning-storm` |
| 962 | One-click Minecraft VFX: magic-charge | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-magic-charge` |
| 963 | One-click Minecraft VFX: boss-spawn | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-boss-spawn` |
| 964 | One-click Minecraft VFX: elytra-boost | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-elytra-boost` |
| 965 | One-click Minecraft VFX: underwater-burst | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-underwater-burst` |
| 966 | One-click Minecraft VFX: snow-gust | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-snow-gust` |
| 967 | One-click Minecraft VFX: ash-fall | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-ash-fall` |
| 968 | One-click Minecraft VFX: cinematic-impact | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-cinematic-impact` |
| 969 | One-click Minecraft VFX: dream-reveal | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-dream-reveal` |
| 970 | One-click Minecraft VFX: horror-presence | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-horror-presence` |
| 971 | Save Quick VFX favorite | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-favorite-add` |
| 972 | Insert saved Quick VFX favorite | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-favorite-insert` |
| 973 | Remove Quick VFX favorite | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-favorite-remove` |
| 974 | Remove VFX around playhead | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-remove-at-frame` |
| 975 | Export Quick VFX recipe catalog | `src/minecraft/studio/QuickVfxStudio.ts` | `creation-vfx-catalog-export` |
| 976 | Studio finish: clean-film | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-clean-film` |
| 977 | Studio finish: golden-hour | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-golden-hour` |
| 978 | Studio finish: moonlight | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-moonlight` |
| 979 | Studio finish: deep-cave | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-deep-cave` |
| 980 | Studio finish: nether-cinema | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-nether-cinema` |
| 981 | Studio finish: end-dream | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-end-dream` |
| 982 | Studio finish: horror-grain | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-horror-grain` |
| 983 | Studio finish: anime-battle | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-anime-battle` |
| 984 | Studio finish: soft-fantasy | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-soft-fantasy` |
| 985 | Studio finish: documentary | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-documentary` |
| 986 | Studio finish: music-video | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-music-video` |
| 987 | Studio finish: retro-adventure | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-retro-adventure` |
| 988 | Studio finish: icy-storm | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-icy-storm` |
| 989 | Studio finish: warm-village | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-warm-village` |
| 990 | Studio finish: boss-reveal | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-boss-reveal` |
| 991 | Studio finish: high-contrast-trailer | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-high-contrast-trailer` |
| 992 | Add non-destructive post layer | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-stack-add` |
| 993 | Edit post layer weight and state | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-stack-update` |
| 994 | Reorder post layers | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-stack-move` |
| 995 | Remove post layer | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-stack-remove` |
| 996 | Clear post stack | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-stack-clear` |
| 997 | Blend post stack deterministically | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-stack-evaluate` |
| 998 | Flatten post stack into project settings | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-stack-flatten` |
| 999 | Create post stack from finish recipe | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-finish-stack` |
| 1000 | Export post-production manifest | `src/minecraft/studio/PostFinishStudio.ts` | `creation-post-manifest` |
| 1001 | Analyze Minecraft Studio resource budgets | `src/minecraft/studio/MinecraftStudioOptimization.ts` | `creation-performance-analyze` |
| 1002 | Apply low-end, balanced or cinematic target | `src/minecraft/studio/MinecraftStudioOptimization.ts` | `creation-performance-target` |
| 1003 | Optimize all voxel models | `src/minecraft/studio/MinecraftStudioOptimization.ts` | `creation-performance-models` |
| 1004 | Disable VFX outside active world area | `src/minecraft/studio/MinecraftStudioOptimization.ts` | `creation-performance-effects` |
| 1005 | One-click Minecraft Studio optimization | `src/minecraft/studio/MinecraftStudioOptimization.ts` | `creation-performance-auto` |
| 1006 | Export optimization report | `src/minecraft/studio/MinecraftStudioOptimization.ts` | `creation-performance-report` |
| 1007 | Create exportable Minecraft Creation Suite package | `src/minecraft/studio/MinecraftStudioPackage.ts` | `creation-package-create` |
| 1008 | Serialize complete creation package | `src/minecraft/studio/MinecraftStudioPackage.ts` | `creation-package-serialize` |
| 1009 | Include bounded world streaming plan in delivery package | `src/minecraft/studio/MinecraftStudioPackage.ts` | `creation-package-streaming` |
| 1010 | Include reusable builder blueprint in delivery package | `src/minecraft/studio/MinecraftStudioPackage.ts` | `creation-package-blueprint` |
| 1011 | Include editable simple rigs in delivery package | `src/minecraft/studio/MinecraftStudioPackage.ts` | `creation-package-simple-rigs` |
| 1012 | Include per-mod imported asset reports in delivery package | `src/minecraft/studio/MinecraftStudioPackage.ts` | `creation-package-mod-assets` |
| 1013 | Persist and reload all Creation Suite data | `src/minecraft/studio/MinecraftStudioDefaults.ts` | `creation-persistence-roundtrip` |
| 1014 | Persist and sanitize custom voxel rig geometry | `src/rigs/RigSerializer.ts` | `creation-persistence-custom-rig` |

## Truth boundary

- A seed-only project creates a deterministic, bounded MineMotion proxy for staging; it is not claimed to reproduce Mojang or mod-loader world generation byte-for-byte. Exact Vanilla or modded terrain requires importing the matching world save.
- Mod integration reads safe manifests and user-imported assets. MineMotion does not execute Fabric, Forge, NeoForge or Quilt JAR code. Mod-specific runtime renderers, generated data and custom logic require exported/imported assets or future adapters.
- Source acceptance proves deterministic operations, persistence contracts and bounded data flow. Full Vite/Tauri builds, Vitest, native installers, reviewed WebGL images, codec validation and hardware benchmarks remain separate fail-closed evidence gates.

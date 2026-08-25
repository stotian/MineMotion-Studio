# Aurora Pack — example plugin

A minimal, working plugin for BlockMotion Studio. It adds three camera angles
and two rig poses, and is meant to be copied as the starting point for your own
pack.

## Installing it

1. Open **Studios → Plugins**.
2. Choose the install button and pick this folder's `plugin.json`.
3. The new presets appear where the built-in ones do: camera presets on a
   selected camera, rig poses under a character's **Material** properties tab.

## The two files

**`plugin.json`** — the manifest. The fields that matter:

| Field | Meaning |
| --- | --- |
| `id` | Unique, lowercase, at least 3 characters |
| `version` | Semantic version (`1.0.0`) |
| `minMineMotionVersion` | Oldest host version you support |
| `permissions` | What the plugin is allowed to register — see below |
| `entry` | The module the host loads, relative to the manifest |

**`index.js`** — exports a single `extensions` object. Every key is optional;
provide only what your pack adds.

## Permissions

A plugin may only register what its manifest asks for. Requesting
`registerPresets` and `registerRigs` (as this pack does) permits camera, sky,
palette, animation and pose presets. Other permissions cover commands,
templates, effects, post-processing, SFX, render presets, timeline item types,
generators, importers and exporters.

Capabilities such as unrestricted filesystem or network access, process
execution and native `eval` are rejected outright by the validator — plugins run
sandboxed.

## Extension points

`templates`, `skyPresets`, `blockPalettes`, `cameraPresets`, `rigPosePresets`,
`animationPresets`, `effects`, `postProcessingPresets`, `sfx`, `renderPresets`,
`timelineItemTypes`, `importers`, `exporters`, `tools`.

Two of these are narrower than they look:

- **`skyPresets`** — sky ids come from a closed union in the host, so a plugin
  can override a known sky but cannot introduce a new one.
- **`blockPalettes`** — the host stores the selected palette but nothing
  currently reads it, so entries here have no visible effect yet.

## Conventions

- Angles are **degrees**.
- Positions are `[x, y, z]` in world units; the ground plane is `y = 0` and a
  character stands roughly 3.3 units tall.
- Bone ids for the player rig: `root`, `body`, `head`, `leftArm`, `rightArm`,
  `leftForearm`, `rightForearm`, `leftLeg`, `rightLeg`, `leftLowerLeg`,
  `rightLowerLeg`, and `cape` where present.

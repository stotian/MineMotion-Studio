# Lighting Studio

Open **Lighting** from the top bar to edit the scene environment.

## Mood Presets

- Clear Day
- Golden Hour
- Moonlit Night
- Horror Fog
- Nether Heat
- End Void
- Storm Fight
- Anime Impact Lighting

Applying a mood updates the legacy sky preset, the Phase 8 lighting settings,
and the linked post-processing preset. Existing environment keyframes are kept.

## Lighting Controls

- sun direction, color, and intensity
- ambient color and intensity
- shadow toggle
- fog color and density
- time of day
- animated time of day and day length in frames

When time animation is enabled, the sun direction, daylight intensity, and sky
background evolve deterministically from the current timeline frame.

## Shader And Post Controls

The panel edits the existing preview/export-compatible post settings:

- bloom
- vignette
- grain
- chromatic aberration
- exposure
- contrast

These controls use the established CSS/viewport post-processing pipeline. They
do not claim a full offline GPU EffectComposer implementation.

## Environment Keyframes

Move the playhead and click **Keyframe at <frame>**. A key captures lighting,
fog, time of day, and the post values listed above. Keys use linear interpolation
by default and appear on the **Lighting & Sky** timeline lane.

Creating another key at the same frame replaces the previous environment key.
Schema v7 serializes the complete keyframe list.

## Minecraft Materials

The panel controls nearest or linear filtering, a default material preset, and
optional biome tint colors. Built-in automatic mappings still select leaves,
water, and glass presets for their matching block types.

Biome tint is an explicit placeholder system. It tints grass, oak leaves, and
water in the current renderer; it does not parse biome data from imported
chunks yet.

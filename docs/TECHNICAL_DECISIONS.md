# Technical Decisions

## TD-001 - Extend the current architecture incrementally

Status: Accepted

Keep project schema, timeline, renderer, and registries in place. Introduce contracts and adapters around them. A rewrite would endanger migrations and working phase behavior.

## TD-002 - Runtime capabilities are centralized and evidence-based

Status: Accepted

One core snapshot reports WebGL/WebGPU, canvas, WebM codecs, audio, Tauri, FFmpeg, filesystem, and plugin sandbox support. Existing public support helpers delegate to it so UI cannot drift into fake support.

## TD-003 - Scene contracts move to core through compatibility re-exports

Status: Accepted

Move stable transform/entity type ownership to `src/core/scene` while re-exporting from `ProjectFile.ts`. Existing imports remain valid and future engine services gain a lower-level contract.

## TD-004 - Schema version has one source of truth

Status: Accepted

Use a core schema constant/type in project interfaces, defaults, and serializer assertions. Schema changes still require explicit migrations and tests.

## TD-005 - Service interfaces are boundaries, not a DI framework

Status: Accepted

Define simple generic interfaces for scene, timeline, render, VFX, audio, assets, project, export, and plugins. Implement adapters only when a feature needs them.

## TD-006 - Existing effects will be adapted into Phase 15

Status: Accepted

Keep schema 9 `effects.instances`, `EffectRegistry`, and `track_effects_main`
authoritative while Phase 15 is introduced. A pure compatibility projection
adapts legacy definitions and instances into typed VFX contracts without
changing project serialization. Reverse conversion rejects rotation, scale,
bone target, seed, quality, blend, layer, or definition changes that schema 9
cannot represent instead of silently losing them.

This temporary dual type vocabulary is preferred over a parallel store/lane or
a premature schema 10 migration. Runtime consumers migrate incrementally; a
schema change requires its own tested migration milestone.

## TD-007 - Generated identity and render randomness are separate

Status: Accepted

Use `createId` for editor/project identity. Use explicit seeded deterministic
functions for frame evaluation. Never derive visible VFX randomness from wall
clock time, UUIDs, or uncontrolled `Math.random()`.

## TD-008 - Runtime support is a lazy immutable snapshot

Status: Accepted

Probe browser/native capabilities once per runtime snapshot and expose explicit
refresh when the host changes. FFmpeg codecs require supplied detection evidence;
the registry does not claim codecs merely because the application is in Tauri.

## TD-009 - VFX frame evaluation is stateless and counter-addressed

Status: Accepted

Evaluate a VFX frame only from its validated instance, definition, and explicit
frame/FPS/context-seed/quality inputs. Combine versioned, typed seed parts with
the existing stable 32-bit content hash, then address every pseudo-random sample
by a semantic stream and numeric index. Never share mutable PRNG state between
instances or calls.

This makes playback, scrubbing, frame stepping, backward seeks, undo, schema 9
reload, preview evaluation, and offline evaluation order-independent without a
reset API. Quality profiles may change deterministic budgets but must not change
the underlying random stream. Stateful native primitives must later preserve
this contract through semantic sample coordinates or an explicit replay layer.

## TD-010 - Native VFX primitives are bounded renderer-neutral data

Status: Accepted

Represent primitive configuration and evaluated output as versioned
discriminated unions. Validate every descriptor, clamp safe integer work budgets
before allocation, and dispatch to focused pure evaluators. V1 covers particle
emitter, beam, trail, expanding ring, and light pulse with caps of 1,024
particles and 256 beam/trail/ring subdivisions or segments.

Particle quality consumes a literal stable prefix. Beam, trail, and ring select
nested canonical sample indices so shared details and endpoints do not move as
quality rises. Seeds never include quality or evaluation order. Three.js,
Canvas, CSS, target resolution, mutable registries, and GPU ownership remain
outside the primitive contract and are deferred to later integration milestones.

## TD-011 - Effects timeline editing keeps schema 9 as the sole authority

Status: Accepted

Route every effects-lane edit through a pure validated command controller that
mutates `effects.instances`, then regenerate exactly one `track_effects_main`
lane. Sanitize and preserve foreign timeline lanes, but never treat effect-lane
items as independent persisted state. The React bridge creates one whole-project
history checkpoint only for a successful non-no-op mutation.

This preserves schema 9, save/package compatibility, deterministic ordering,
undo/redo, and the current renderer while providing real move, trim, duplicate,
copy/paste, enable, priority, delete, and Inspector editing. New growth above
4,096 instances is blocked, but oversized legacy projects remain repairable.
Parameter keyframes and other native-only VFX fields wait for the tested schema
10 migration instead of being encoded in an unofficial parallel contract.

## TD-012 - The VFX schema generates Inspector parameter behavior

Status: Accepted

Derive number, integer, boolean, color, and enum controls from the canonical
`VfxParameterSchema`, including labels, categories, units, bounds, steps,
defaults, animation metadata, and current runtime support. Do not maintain a
second UI parameter definition. Route committed changes through the schema 9
timeline controller so one successful non-no-op edit creates one whole-project
history checkpoint.

Known parameters are validated against their definition. Bounded finite unknown
legacy keys remain untouched, and an invalid known legacy value may be repaired
one key at a time. New unknown keys remain rejected. Colors must be safe hex or
alphabetic named tokens before reaching CSS, Canvas, or Three.js. Parameter
keyframes and native-only fields remain schema 10 work.

## TD-013 - Schema 10 enriches the single existing effects collection

Status: Accepted

Migrate schemas 1-9 to project schema 10 by attaching one validated `nativeVfx`
record to every existing `effects.instances` entry. Do not add `project.vfx`, a
second store, or a second lane. During the 15.6-to-15.7 bridge, current edits
synchronize identity, display name, inclusive timing, enabled state, position,
entity target, and parameters into the native record while preserving native
rotation/scale, target bone, seed, local parameter keyframes, blend, layer, and
qualities.

Current schema 10 loads require native data and reject corrupt/future versions
or shared-field disagreement. Schemas 1-9 migrate without mutating their source.
Browser autosave keeps a previous payload, packages delegate to the canonical
serializer, and schema 9 rollback is allowed only after guarded lossless reverse
conversion. The legacy projection remains until typed runtime parity in 15.7.

## TD-014 - Native prepared frames unify preview and visual export

Status: Accepted in Phase 15.7.

Evaluate each schema 10 `nativeVfx` record through one pure project-frame
preparation boundary with explicit frame, FPS, seed, quality, and inclusion.
Three.js world visuals, React overlays, PNG/sequence, WebM, and FFmpeg consume
that result. Final-camera state applies export visibility before painting, and
`includeVfx=false` returns an empty prepared frame without inspecting effects.

WebM records the same composited captured frames used by PNG/FFmpeg instead of
the raw viewport canvas. Existing preset visuals remain a bounded compatibility
map over typed evaluations until primitive render parity is proven. Missing
entity/bone targets warn and resolve to null rather than unsafe access.

## TD-015 - Global VFX work is budgeted at prepared-frame ownership

Status: Accepted in Phase 15.8.

Measure compatibility-renderer work where schema 10 frames become visual stack
entries, before Three.js or Canvas consumers allocate. Preserve stable project
order and cap each frame to 64 active effects, 4,096 particles, 8,192 segments,
and 10,000 combined stack work units. Keep requested/allocated diagnostics and
limit-hit counts on the transient prepared frame; do not persist budget state.

Renderer object trees own their geometries and non-cached materials/textures.
Recursive disposal deduplicates shared references and handles render targets and
skeletons. Module caches explicitly mark borrowed materials/textures as shared,
so reconstruction cannot dispose a resource that a later frame will reuse.

## TD-016 - Effects command execution and validation have separate ownership

Status: Accepted in Phase 15.9.

Keep `copyEffectTimelineBlock`, `applyEffectTimelineCommand`, command types, and
result contracts stable. Move plain-data/accessor/vector/patch validation into
an input validator and schema/timing/parameter/native-project checks into a
project validator. The controller remains the single command mutation and lane
synchronization boundary; no parallel effect architecture is introduced.

The existing characterization suite is the behavior contract. This extraction
does not change errors, paths, no-op semantics, history labels, cloning, order,
schema synchronization, or public imports.

## TD-017 - Built-in preset metadata joins existing definition authorities

Status: Accepted in Phase 16.1.

Keep legacy `EffectRegistry` and native `VfxRegistry` authoritative. Build one
read-only catalog by joining validated metadata to those definitions, freeze all
published views, and consume the catalog directly in the Effects Library.

Catalog validation fails closed for corrupt records, duplicate/mismatched IDs,
missing assets/localization, bad duration/quality/schema compatibility, false
stable claims, or work outside primitive/global budgets. Compatibility and
experimental entries never count toward the 60 stable-preset acceptance target.

## TD-018 - Built-in previews are deterministic data and personal cache is local

Status: Accepted in Phase 16.

Generate bounded SVG thumbnails from validated native primitive descriptors and
schedule one cache operation per idle task. Version cache keys with preset
metadata, fail softly when storage is missing/corrupt/full, and never persist
preview cache or favorites/recents inside project files.

Stable built-ins require a registered native recipe, current schema support,
editable preview/export capabilities, bounded work, localization, deterministic
all-quality evaluation, ready preview generation, and integration regressions.
Compatibility and experimental records remain visible but outside stable claims.

## TD-019 - VFX authoring is a declarative stack over Primitive V1

Status: Accepted in Phase 17.1.

Authoring documents are versioned, structured-cloneable, immutable values that
contain existing VFX placement/quality fields and discriminated primitive,
emitter, or restricted modifier stack items. Built-in recipes are evaluated and
cloned into derived drafts; their catalog records are never mutated.

Recipe callbacks, arbitrary JavaScript, unrestricted shaders, and a node graph
are excluded. Stack commands compile back to the existing primitive/runtime
path rather than establishing a parallel effect or project architecture.

## TD-020 - Restricted VFX modifiers are ordered descriptor transforms

Status: Accepted in Phase 17.2.

Enabled tint, opacity, and scale modifiers transform all enabled primitive
descriptors earlier in the authoring stack. Each transformation returns plain
data, then reuses Primitive V1 validation and global single-effect budgets.
Disabled items are excluded and no modifier may contain callbacks or shader code.

This ordered model is deterministic, explainable in the UI, and portable. It is
intentionally less expressive than a graph until stack behavior and package
security are proven stable.

## TD-021 - Portable VFX packages use a closed bounded ZIP32 profile

Status: Accepted in Phase 17.3.

Use `.minemotion-vfx` ZIP archives with root `manifest.json` and `effect.json`
plus only declared assets. Parse central/local records directly with strict
ZIP32 bounds, CRC and metadata agreement, bounded streaming decompression, safe
normalized paths, case-insensitive uniqueness, and no symlinks or directories.

Reject code, WASM, executable files, unrestricted shader source, undeclared
files, unknown manifest fields/permissions, incompatible versions, and authoring
documents that fail existing Primitive V1 compilation or budgets. Reading is an
in-memory validation step and never implies installation.

## TD-022 - Package export is canonical and inspection precedes installation

Status: Accepted in Phase 17.4.

Canonicalize JSON object keys and non-semantic manifest lists, sort archive
assets by path, and use a fixed ZIP timestamp. Validate the finished archive
through the same bounded reader used for imports before returning it.

Package inspection compiles the authoring document and exposes preview, work,
licenses, permissions, assets, dependency satisfaction, and install readiness.
It performs no registry mutation or installation, preserving a clear review
boundary before locally persistent state changes.

## TD-023 - Store canonical archives and revalidate the local registry

Status: Accepted in Phase 17.5.

Persist the validated canonical package archive as immutable Base64 plus only
identity, version, enabled state, and timestamps. Reparse every archive with the
bounded reader on load and reject the whole runtime snapshot if enabled package
dependencies are inconsistent. Preserve corrupt stored text for recovery.

Bound browser-local storage separately from the portable archive format. Local
lifecycle operations must prevent built-in ID collisions and cannot disable,
remove, or incompatibly update a package required by an enabled dependent.

## TD-024 - Package assets use closed schemas and restricted templates fallback

Status: Accepted in Phase 17.6.

Resolve each declared asset kind through a closed bounded schema. JSON assets
share structural limits and reject unknown/prototype fields; binary assets must
match declared MIME signatures. Parsed results are immutable and data URLs are
created only on explicit resolution.

Restricted shader assets contain a built-in template ID and exact parameters,
never source. When a valid template is unavailable, use the existing Primitive
V1 default material and report the fallback instead of failing rendering or
claiming unsupported shader behavior.

## TD-025 - Custom packages embed compiled recipes in schema 10

Status: Accepted in Phase 17.7.

Represent an installed custom effect as the schema 10-only `customVfx` carrier
inside the existing `effects.instances` collection and timeline lane. Persist
the validated compiled Primitive V1 descriptors and package/document provenance
in `nativeVfx.customRecipe`; do not add a project package registry, second effect
store, dynamic callback registry, or executable recipe format.

The local package registry controls what can be newly inserted and provides
visible missing/disabled/version-mismatch diagnostics. Once inserted, the
project is self-contained: history, JSON, project packages, autosave, preview,
and export evaluate the embedded descriptors through the existing prepared-frame
and budget path. Schema 9 export rejects this native-only payload explicitly.

## TD-026 - Keep the ordered VFX stack as the sole authoring authority

Status: Accepted in Phase 17.8.

Defer a visual node graph because every currently supported authoring operation
is represented by the stable bounded stack and compiles directly to Primitive
V1. A graph today would duplicate documents, editing semantics, migration,
security validation, and deterministic evaluation without enabling a supported
runtime capability.

A future graph requires an accepted capability that the stack cannot represent,
a versioned closed acyclic schema, bounded deterministic compilation/work
accounting, migration/downgrade rules, accessibility/repair behavior, and
preview/export/adversarial evidence. Its first prototype must project or compile
into the existing path, never create a second project effect authority.

## TD-027 - Localize through one typed service outside project state

Status: Accepted and completed in Phase 18.

Use one flat typed key contract with English as the complete fallback catalog
and require French exact key/placeholder parity. The service owns system locale
resolution, interpolation, plural rules, number/date/duration/timecode formats,
and pseudolocalization; React panels consume it through one context.

Persist only `system`/`en`/`fr` in existing app settings. Never translate or
mutate project serialization values, technical IDs, error codes, file paths, or
user-authored content. Future community/content catalogs must be validated data
extensions of this boundary, not new localization engines or executable code.

Package localization remains a narrower untrusted-data boundary: a validated,
bounded `minemotion-localization` asset may supply only `package.displayName`
and `package.description`. Locale matching is deterministic and falls back to
the manifest. Package keys cannot override application catalogs or project data.

## TD-028 - Make global animation tracks authoritative for rig motion

Status: Accepted in Phase 19.1.

The existing `animation.tracks` collection is the sole runtime/editing authority
for `bone.rotation.*`. The older `character.boneKeyframes` array is a compatibility
projection: missing legacy frames migrate into the global track, an existing
global value wins a same-frame conflict, and serialization regenerates the
projection deterministically.

Do not add a parallel IK, constraint, procedural, or layer timeline. Future Phase
19 systems must evaluate into or bake to the existing global track contract.
Schema 10 remains unchanged for this consolidation milestone.

## TD-029 - Keep two-bone IK analytic, pure, and timeline-neutral

Status: Accepted in Phase 19.2.

Solve two positive-length segments from explicit root, target, pole direction,
limits, and influence inputs. The solver returns plain finite joint/end positions
and hierarchical XYZ-degree rotations. Reach violations clamp to physical bounds
with stable warnings; malformed or degenerate input fails explicitly.

The solver owns no persistent state and edits no project. Phase 19.3 controls
must bake its output through the existing global `bone.rotation.*` tracks.

## TD-030 - Keep IK controls session-local and bake through global tracks

Status: Accepted in Phase 19.3.

Segment Steve/Alex limbs into visually equivalent upper/lower child bones while
preserving the established upper-bone IDs and neutral cuboid extents. Existing
upper-bone tracks therefore continue moving the complete inherited limb. Use
parent-local `-Y`, XYZ degrees, explicit poles, and closed limb mappings.

Hand/foot targets are bounded session editing tools, not project animation
authority. Live preview derives a temporary project view. A successful bake
writes exactly two global bone tracks through the existing commit/history path;
the legacy character tracks remain a generated projection. Numeric controls
are honest while viewport gizmos remain unavailable.

## TD-031 - Extract touched orchestration incrementally from App.tsx

Status: Accepted in Phase 19.3.

Considered three approaches:

1. Keep callbacks in `App.tsx`: lowest immediate effort, but directly worsens
   the confirmed composition-root risk.
2. Introduce a generic event bus/service container: flexible, but high effort
   and creates a second coordination architecture.
3. Extract the touched rig domain into a focused React controller plus pure IK
   modules: moderate effort, testable, and reuses current state/history paths.

Choose option 3. Enforce the measured 2,839-line ceiling with a lightweight
source check; future touched domains follow the staged `APP-EXTRACT-*` backlog.
No global event bus or parallel store is introduced.

## TD-032 - Application versions move only at explicit release checkpoints

Status: Accepted in Phase 19.3.

Keep application `0.8.2` during the current unreleased phase stream. Project
schema 10 is independent. A future version bump must atomically synchronize all
Node, Tauri, Cargo, package, example, README, changelog, and compatibility
surfaces listed in `docs/VERSIONING.md`.

## TD-033 - Derive ground and foot-lock samples without persisted authority

Status: Accepted in Phase 19.4.

Extract terrain preset data generation from the Three.js mesh builder and build
one deterministic ground sampler over either embedded imported chunks or the
active preset. Imported chunks take precedence and queries use bounded vertical
windows. Air and water are not foot supports.

Foot locks are session-derived inclusive frame ranges with a fixed world anchor
placed on sampled ground. Each frame uses the existing animation sampler,
renderer-matched forward kinematics, world-to-parent-local conversion, and the
existing analytic two-bone solver. Any unreachable frame rejects the whole
operation. A successful range writes its two global leg tracks in one project
and history commit; no project fields, constraint tracks, or per-frame undo
entries are added.

## TD-034 - Use one bounded look-at solve across renderer Euler conventions

Status: Accepted in Phase 19.5.

Use local `-Z` as the closed forward convention and make Euler order explicit:
`XYZ` for rendered rig bones/scene objects and `YXZ` for the production camera
controller. Build the desired orientation from forward/up basis vectors, blend
from the current orientation with shortest-path quaternion interpolation, then
apply bounded component limits and report the evaluated direction honestly.

The solver consumes plain finite data and owns no project state. Focused
controllers map head parent space and camera/object world space. Preview remains
derived session state and successful bake reuses existing global bone or
transform rotation tracks rather than adding constraint tracks.

Animated target entities are sampled at the requested timeline frame before
solving. Head conversion includes character transform, root, and body; a shared
pure XYZ space-math module also retains the foot-lock coordinate behavior. One
constraint workspace hook composes IK then look-at preview without adding lines
to `App.tsx`.

## TD-035 - Derive motion paths from existing tracks without project snapshots

Status: Accepted in Phase 19.6.

Motion paths are derived bounded views over the authoritative transform and bone
tracks. Camera paths sample position; rig paths sample only the character
transform and required root-to-point bone chain. Relevant tracks are sorted once
and sampled with the production interpolation curves and binary search.

Do not call `Animator.sampleProject` for every path point because it clones the
broad project whenever tracks exist. Do not persist paths, duplicate keys, or
introduce a path timeline. Viewport geometry consumes the derived result,
disposes with the existing scene root, and is withheld whenever production
render preview/export is active. Session memoization ignores current-frame-only
updates so playback does not resample a static full-range path every tick.

## TD-036 - Evolve the existing NLA skeleton into ordered animation layers

Status: Accepted in Phase 19.7.

Use six fixed layer kinds in the order Base Animation, Upper Body, Head Look,
Hand Adjustment, Additive Motion, and VFX Synchronization. Mute and weight are
layer properties; the existing clip instance mute/weight remains multiplicative.
Override layers linearly blend their allowed values. Additive Motion applies the
sample delta from the clip's first frame, so reusable absolute clips do not jump
when activated.

The existing `animation.nlaTracks` must become the persistence container; do not
add a parallel layer collection. VFX synchronization stores bounded effect
references only and never duplicates effect timing or parameters.

Legacy NLA tracks without kind fields load as Base Animation. Global timeline
tracks are sampled first, then target layers compose in fixed kind order through
one shared project sampler. Playback/export and dependent tools use that same
composition so foot lock, look-at, and motion-path results cannot silently
diverge from the rendered pose.

## TD-037 - Procedural generators emit ordinary reusable clips and keys

Status: Accepted in Phase 19.8.

Keep generator settings as bounded session inputs and return a deterministic
`ReusableAnimationClip`. Baking applies that clip to the authoritative global
tracks, upserts it in the existing clip collection, synchronizes the rig lane,
and commits once through project history.

Do not persist generator settings, procedural nodes, caches, or a procedural
timeline. Generated motion must become ordinary editable keyframes. Equal-frame
application replaces the previous key so repeated generation is idempotent at
the same playhead.

## TD-038 - Keyframe tools operate on the existing Dopesheet selection

Status: Accepted in Phase 19.9.

Cleanup and transformation commands consume stable keyframe references from the
current selection and return normal global tracks. They do not create a cleanup
stack, modified clip format, or secondary timeline.

Exact redundant removal is conservative around non-linear interpolation. Noise
reduction is an explicit tolerance approximation. Both preserve track
endpoints, recompute against current neighbors after each removal, and prune
deleted references from selection. No-op results retain track identity so the
UI can avoid empty history checkpoints.

Loop, reverse, and mirror use immutable snapshots. Loop IDs derive from source
identity, destination frame, and repeat index; timeline bounds and occupied
frames are enforced before commit. Reverse rejects unselected-key collisions
and maps directional easing to the reversed segment. Mirror swaps supported
left/right limb tracks from the same snapshot and applies renderer-consistent
axis signs to rig rotations and transform motion.

## TD-039 - Pose clipboard is session-only and paste is a project command

Status: Accepted in Phase 19.10.

Copy captures one detached snapshot of the source rig's supported current bone
rotations. It is transient editor state, not project data. Paste and blend
resolve only bone IDs supported by the target rig; influence is finite and
clamped to 0-1.

Paste, blend, mirror, reset, and preset apply return the original project on
locked, missing, invalid, or unchanged targets. Successful user actions replace
the character once through whole-project history rather than producing one
checkpoint per bone.

## TD-040 - Attachment motion derives from authoritative bone animation

Status: Accepted in Phase 19.11.

An attachment remains a bounded character record mapped to one attachment
point. Its world transform comes from the resolved point offset under the
production-sampled parent bone. Do not add attachment copies of bone tracks,
per-frame attachment state, or a second attachment timeline.

Attachment commands mutate the existing character collection once per user
action. Cross-record validation resolves rig points/bones and project OBJ asset
references. The shared scene renderer resolves attached OBJ geometry so preview
and offline rendering consume the same project asset.

## TD-041 - Keep Blockbench source authoritative and report unsupported semantics

Status: Accepted in Phase 19.12.

`project.assets.blockbench` owns imported `.bbmodel` records. The historical
`project.rigs.blockbenchModels` field remains only as a sanitized compatibility
projection and is reconciled at migration and serialization boundaries. Reports
are recomputed from bounded source JSON instead of trusting stale stored counts.

Static OBJ conversion consumes current outliners or legacy groups and bakes
cube/group pivots and rotations deterministically. Texture and animation
metadata remain in the original asset and in the import report, but the preview
must not claim textured materials or mapped clips until their dedicated
consumers exist.

Phase 19.13 may add mapping metadata and commands, but mapped animation must
still target the existing global tracks and history path rather than introduce
a Blockbench-specific timeline.

## TD-042 - Auto-map Blockbench only with unique reviewed evidence

Status: Accepted in Phase 19.13.

Automatic group-to-bone mapping is restricted to unique normalized MineMotion
bone IDs and a small reviewed alias table. Duplicate targets become conflicts;
unknown names remain unmapped. Manual overrides are bounded, scoped to a rig
preset, may explicitly disable an automatic choice, and persist on the existing
Blockbench asset.

Animation conversion resolves animator UUIDs first and unique names second. It
accepts finite numeric or numeric-string rotation data only. It never evaluates
Blockbench expressions. Unsupported channels, animator kinds, duplicate
targets, and interpolation modes are skipped or approximated with stable
warnings.

Converted clips receive content-derived IDs, enter the existing reusable clip
collection, and bake at the playhead through the global bone tracks and
timeline synchronizer in one history operation. Reapplying an identical clip at
the same frame is a no-op.

## TD-043 - Keep expression overlays optional and subordinate to skin rendering

Status: Accepted in Phase 19.14.

Expression state is one bounded optional character setting with six closed
presets and a clamped intensity. Missing, disabled, invalid, or zero-intensity
state yields no descriptors and no Three.js objects, preserving existing skin
and fallback rendering by default.

Pure descriptor generation defines small pixel bars only. The shared rig
renderer attaches their owned geometry above the head face, uses explicitly
shared materials, and excludes the overlay meshes from picking. Preview and
offline export therefore consume the same result without a second renderer.

Rig Studio keeps draft preset/intensity changes local until Apply, avoiding an
undo entry per slider event. Enable, disable, and apply use one existing
whole-project history checkpoint. Expression state is intentionally static; no
parallel expression timeline or discrete keyframe system is introduced.

## TD-044 - Close Phase 19 with a composite path, not duplicated unit coverage

Status: Accepted in Phase 19.15.

Keep the specialized deterministic tests for IK, foot lock, constraints, motion
paths, layers, procedural generation, keyframe/pose tools, attachments,
Blockbench, and expressions as the detailed evidence. Add one compact composite
fixture only for the cross-system seam.

That fixture combines an optional expression, a visible bone attachment, and an
authoritative bone track. It must survive JSON, guarded schema 9, project
packages, autosave, undo/redo, and canonical rig-lane synchronization, then
produce equal shared-rig results from production preview sampling and final
export-frame preparation.

This gate verifies integration ownership without creating a Phase 19-specific
serializer, timeline, renderer, or broad duplicate test suite.

## TD-045 - Measure the production viewport without persisting telemetry

Status: Accepted in Phase 20.1.

Use the existing `SceneRenderer` animation loop and Three.js `renderer.info` as
the renderer source of truth. Keep rolling frame statistics and project
complexity collection in pure bounded modules, and update React diagnostics at
most every 500 ms rather than on every animation frame.

Measurements remain session-only callback data. Do not add them to schema 10,
history, autosave, canvas capture, or exports. Treat Chromium
`performance.memory` as optional and display an honest unavailable state in
other runtimes. Define budgets in Phase 20.2 before using these measurements to
drive quality changes or optimization recommendations.

## TD-046 - Separate device budgets from quality budgets

Status: Accepted in Phase 20.2.

`minimum` and `recommended` qualify device/runtime capability.
`draft`, `high`, and `final` qualify renderer workload; final is a
final-quality viewport tolerance, not an offline throughput guarantee. Keep the
five IDs in one versioned renderer-neutral contract while retaining their
distinct `kind`.

Every metric has a recommended maximum and a hard maximum. Evaluation is pure,
ordered, and advisory: it returns pass, recommendation, or limit plus unavailable
metrics, but never mutates quality or project state. Require at least 30 frame
samples for p95 and do not invent heap data. Named benchmark hardware and
before/after thresholds in later Phase 20 tasks may justify a new version; do
not silently rewrite version 1 values.

## TD-047 - Use semantic renderer ownership before explicit passes

Status: Accepted in Phase 20.3.

Tag Three.js scene objects as world, characters, props, VFX, or helpers and
record transparency as a cross-cutting material pass. Keep post and overlays as
explicit CSS-preview/Canvas-export owners. Do not assign arbitrary global
`renderOrder` values or camera masks to depth-sorted production geometry merely
to make the inventory look layered.

One pure visibility plan makes WebGL helpers editor-only. The final canvas excludes
the grid, axes, selection box, camera models, motion paths, chunk borders, and
world-origin marker without changing project or viewport preferences.

The current CSS preview and Canvas2D export composition orders are documented,
including their non-identical generic post passes. Later renderer work may
unify them, but semantic ownership must remain independent of a particular
Three.js pass implementation.

## TD-048 - Dispose caches only after releasing their owning scene

Status: Accepted in Phase 20.4.

The current production application owns one `SceneRenderer`. On rebuild, first
dispose the detached object tree while preserving marked shared resources, then
invalidate the Minecraft material cache only if its deterministic pack/filter/
tint/material signature changed, and prune skin textures not used by the next
scene. On renderer shutdown, clear both caches after the scene tree.

OBJ parser materials are owned temporary inputs and must be disposed when one
shared replacement material is assigned. Source geometry used only to derive
edges must be disposed immediately; chunk cube geometry must be allocated only
when attached to at least one mesh.

Media elements and their sources, the app-owned audio context, WebM bitmaps/
tracks/listeners, Blob URLs, callbacks, controls, listeners, RAF, renderer lists,
and context all require explicit normal/error/cancel shutdown. If multiple
renderers are introduced, move cache ownership from the current singleton
lifecycle to instance-safe asset owners before enabling them.

## TD-049 - Fail-open culling with camera-faithful final distance

Status: Accepted in Phase 20.5.

Evaluate semantic layer, distance, and six-plane frustum culling in one bounded
renderer-neutral sphere contract. Invalid descriptors/inputs and work beyond
4,096 roots remain visible. An editor selection may override geometric culling,
but disabled layers remain disabled. Final distance is the active camera far
plane, not an invented optimization radius.

Keep project visibility immutable and apply derived object visibility again
each frame. Imported blocks remain instanced by material within chunk-local
groups so whole chunks can cull independently. This intentionally exposes a
draw-call versus rejected-work tradeoff; Phase 20.6 must measure it before
changing batch size or caches.

## TD-050 - Retain chunk-local batches and share immutable geometry

Status: Accepted in Phase 20.6.

Use a bounded pure workload estimator to compare exact draw calls, submitted
instances, rejected instances, geometries, and materials. For the current
16-chunk/17-material fixture, chunk-local batches cost 272 all-visible world
calls (below the Draft recommended 400) and reject 75% of instances when only
4 chunks are visible. Retain chunk-local culling until hardware benchmarks
justify a hybrid.

Share one lazily allocated cube geometry across every imported chunk mesh in
one owned build; tree disposal deduplicates it. Continue reusing Minecraft
materials only for an identical deterministic context signature and skin
textures only while the asset remains active. Do not cache mutable Three.js
object trees or parsed OBJ assets before instance-safe ownership is defined.

## TD-051 - Pool only equivalent VFX resources under the renderer

Status: Accepted in Phase 20.7.

Reuse one unit cube, one unit sphere, bounded mesh/line material slots, and
bounded particle `InstancedMesh` capacity only after the previous scene tree is
detached. Each active primitive receives a distinct material slot, preventing
same-frame mutation from changing another effect. Overflow stays scene-owned;
the pool owns retained resources and disposes them on replacement or shutdown.

Do not pool evaluated line or shockwave geometry: their vertices, radius, and
topology vary by frame. General tree disposal must emit `InstancedMesh`
disposal for owned objects, while explicitly shared particle meshes remain
alive until their pool owner releases them. Treat the pure allocation estimate
as constructor-churn evidence only; Phase 20.15 still owns hardware timing.

# Phase 16.6 - Environment VFX

Ten native environment presets extend the shared recipe registry: rain, snow,
ash, ground fog, ambient dust, storm, End atmosphere, Nether atmosphere, cave
drips, and fireflies. They reuse deterministic particle fields, rings, beams,
and light pulses with the same pre-allocation global budgets.

The mixed storm requests 128 particles and 96 segments at final quality. All
parameters are editable and flow through schema 10, timeline, packages,
prepared-frame preview, and export. Primitive V1 motion is isotropic, so rain,
snow, ash, and cave-direction limitations are declared in catalog metadata.
Entries remain experimental pending thumbnails and stable regression gates.

During the final gate, the 4,097-effect legacy repair regression exposed
redundant per-effect definition construction and sanitation. Cached adapted
definitions plus a controller-internal validated clone path reduced the isolated
test from 17.6 seconds to 2.31 seconds without changing round-trip output or
raising the timeout.

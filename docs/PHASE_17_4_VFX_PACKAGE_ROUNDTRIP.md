# Phase 17.4 - Deterministic Package Round Trips And Inspection

The package writer emits canonical stored ZIP archives:

- manifest object keys are recursively sorted;
- dependencies, permissions, and assets use stable semantic ordering;
- `manifest.json`, `effect.json`, then asset paths have fixed entry order;
- every ZIP entry uses one fixed DOS timestamp;
- asset bytes are copied and validated against the exact manifest;
- the completed archive is read through the bounded reader before delivery.

Identical semantic inputs produce identical archive bytes. Export, import, and
rewrite preserve authoring and manifest data; asset input order does not affect
the result.

VFX Studio can export the current draft or inspect a package without installing
it. Inspection generates a deterministic preview and reports package identity,
author/license, required/optional dependency state, explicit permissions, asset
count/bytes/licenses, primitive count, particle/segment work, compatibility,
and install readiness. No inspection action mutates the draft or local library.

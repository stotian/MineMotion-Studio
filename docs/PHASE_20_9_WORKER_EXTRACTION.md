# Phase 20.9 - Safe worker extraction

## Outcome

Minecraft chunk decompression, NBT parsing, palette/section decoding, and
plain-data construction now run in a reusable Vite module worker during world
import. A shared deterministic decoder remains the tested fallback.

## Selected boundary

The MCA header is a fixed 8 KiB table and stays on the main thread to select
bounded chunk payloads. For each chosen location:

1. `McaFileReader` validates the payload range;
2. the client copies only the compressed payload, preserving the region buffer;
3. the copy transfers to one worker reused by the import;
4. the worker runs `decompressMcaPayload`, `NbtReader`, and `ChunkReader`;
5. structured-clone-safe `ImportedChunkData` returns to the manager;
6. project/world creation continues through the existing path.

The original typed-array view remains available for fallback. No `File`,
callback, Three.js object, DOM object, project store, or history state crosses
the worker boundary.

## Failure and lifecycle behavior

- missing `Worker`, factory failure, synchronous `postMessage` failure, or
  bootstrap error disables the worker and retries pending data through the
  shared main-thread decoder;
- a decoder error message preserves invalid-data failure and is not retried;
- each request has an internal monotonically increasing ID;
- completion ignores unknown IDs;
- import completion/error disposes the client and terminates its worker;
- explicit client disposal rejects pending requests.

User-driven abort and stale top-level import protection were assigned to Phase
20.10 and are now implemented in
[`PHASE_20_10_OPERATION_CANCELLATION.md`](PHASE_20_10_OPERATION_CANCELLATION.md).

## Required-workload audit

| Workload | Decision | Reason |
| --- | --- | --- |
| MCA header | Main, bounded | Fixed 8 KiB selection table |
| Decompress/NBT/chunk | Worker | Heavy and fully clone-safe |
| Visible-block mesh data | Deferred | Plain samples clone, but renderer rebuild is synchronous and Three.js stays main-thread |
| Texture atlas | Deferred | Current optional path requires DOM `Image`/canvas; no OffscreenCanvas gate |
| Package archive | Main, bounded | Explicit bounded operations lack a measured worker threshold |
| VFX thumbnail | Idle, bounded | Small cached SVG work already runs one at a time with cancellation |

The audit is a typed closed record covered by tests, preventing an unsafe
worker claim for DOM/Three.js work.

## Evidence

- focused worker/NBT/MCA audit gate: 5 files, 11 tests;
- complete frontend gate: 136 files, 582 tests;
- typecheck, localization, VFX examples, architecture, build, and audit pass;
- `App.tsx`: 2,642 / 2,839 lines;
- production build: 1,884 modules, main JavaScript 1,539.40 kB
  (420.15 kB gzip), worker JavaScript 7.55 kB;
- the known main-chunk warning remains assigned to Phase 20.11.

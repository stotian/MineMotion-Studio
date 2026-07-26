# Phase 20.10 - Abort and stale-result protection

## Outcome

World folder scans and chunk imports now share one latest-operation contract.
Every operation receives a monotonic public ID and `AbortSignal`; starting a
new operation aborts the previous one, and only the current ID may update
progress, project data, history, selection, focus, or status.

## Operation boundary

`LatestOperationController` owns the active `AbortController` without adding
project persistence. Its contract is renderer-neutral and independently tested:

- `start()` aborts the previous operation and returns a larger ID;
- `isCurrent()` rejects completed, cancelled, or superseded IDs;
- `finish()` cannot clear a newer operation;
- `cancel()` emits an identifiable abort error;
- abort checks preserve native `AbortError` reasons.

`useWorldImportOperations` owns this controller and the world-import UI state.
It cancels work when the editor unmounts, the project is replaced, or the world
is unloaded. This extraction reduces `App.tsx` from 2,642 to 2,474 lines.

## Import and worker behavior

- Scan abort checks surround file/decompression boundaries, and `level.dat`
  cancellation is rethrown instead of becoming a parse warning.
- Import abort checks surround region reads, chunk reads, decode completion,
  progress delivery, and browser yields. Region/chunk warning handlers never
  swallow cancellation.
- Progress and final results carry the public operation ID.
- Worker request/response messages carry both an internal request ID and the
  public operation ID. A mismatched response is ignored.
- Aborting an active decode rejects it and terminates the worker immediately.
  Any unrelated pending work can use the deterministic fallback.
- Worker infrastructure failure still falls back through the shared decoder;
  invalid chunk data still fails without retry.

No per-chunk project writes or history entries were introduced. One successful
latest import still commits the complete world update atomically.

## Race cases covered

- a newer operation aborts and invalidates the previous ID;
- an older completion cannot clear the newer active operation;
- explicit cancellation cannot later become an error or project commit;
- a stale worker reply cannot settle the current request;
- a pre-aborted fallback never starts decoding;
- disposal rejects pending work and removes abort listeners.

## Evidence

- focused operation/world-import gate: 5 files, 17 tests;
- complete frontend gate: 138 files, 591 tests;
- typecheck, localization, VFX examples, architecture, build, and audit pass;
- `App.tsx`: 2,474 / 2,839 lines;
- production build: 1,886 modules, main JavaScript 1,542.64 kB
  (421.39 kB gzip), worker JavaScript 7.61 kB;
- the known large-main-chunk warning remains assigned to Phase 20.11.

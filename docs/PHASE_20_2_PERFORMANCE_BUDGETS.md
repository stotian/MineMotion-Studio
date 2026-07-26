# Phase 20.2 - Performance budgets

## Outcome

MineMotion now has one immutable versioned contract for five named performance
budgets:

- `minimum` and `recommended` are device-qualification targets;
- `draft`, `high`, and `final` are renderer workload-quality targets.

These profiles classify measurements only. They do not change project quality,
drop content, or mutate renderer state.

## Runtime thresholds

Each cell is `recommended maximum / hard maximum`.

| Budget | Kind | Target FPS | Startup ms | p95 frame ms | Heap MiB |
| --- | --- | ---: | ---: | ---: | ---: |
| Minimum | Device | 30 | 5,000 / 10,000 | 33.33 / 50 | 384 / 512 |
| Recommended | Device | 60 | 3,000 / 6,000 | 16.67 / 25 | 768 / 1,024 |
| Draft | Quality | 60 | 2,500 / 5,000 | 16.67 / 25 | 384 / 512 |
| High | Quality | 30 | 4,000 / 8,000 | 33.33 / 50 | 1,024 / 1,536 |
| Final | Quality | 15 | 8,000 / 15,000 | 66.67 / 100 | 2,048 / 3,072 |

`final` describes final-quality viewport preview tolerance. It is not an
offline-render throughput promise.

## Workload thresholds

Each cell is `recommended maximum / hard maximum`.

| Budget | Calls | Triangles | Geometries | Textures | Scene objects | Chunks | Active effects |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Minimum | 500 / 750 | 500k / 750k | 2k / 3k | 256 / 384 | 25k / 50k | 8 / 16 | 12 / 16 |
| Recommended | 1k / 1.5k | 1m / 1.5m | 5k / 7.5k | 512 / 768 | 75k / 100k | 16 / 32 | 24 / 32 |
| Draft | 400 / 600 | 350k / 500k | 1.5k / 2.5k | 192 / 256 | 25k / 50k | 8 / 16 | 16 / 24 |
| High | 1.2k / 1.8k | 1.5m / 2.5m | 7.5k / 12k | 768 / 1,024 | 100k / 150k | 32 / 64 | 32 / 48 |
| Final | 2.5k / 4k | 4m / 6m | 20k / 30k | 1,536 / 2,048 | 200k / 300k | 64 / 128 | 48 / 64 |

The active-effect ceilings remain within the existing deterministic global VFX
limit of 64. Chunk thresholds start from the current bounded importer default
of 16 rather than claiming unlimited world support.

## Evaluation rules

- at or below the recommended maximum: `pass`;
- above recommended and at or below hard maximum: `recommendation`;
- above hard maximum: `limit`;
- p95 is unavailable until 30 positive frame samples exist;
- heap is unavailable when the runtime does not expose it;
- hostile non-finite or negative measurements are unavailable, never silently
  treated as passing;
- issues follow one stable metric order for deterministic diagnostics.

These are version 1 guardrails. Phase 20 benchmark tasks must record actual
hardware/context and Phase 20.17 may revise a future contract version from
before/after evidence rather than silently changing version 1.

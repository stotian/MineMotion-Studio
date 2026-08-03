# Phase 20.17 — Measurements and regression thresholds

## Accepted measurements

| Metric | Before | After |
| --- | ---: | ---: |
| Main JavaScript | 1,542,640 B | 1,439,600 B |
| Main gzip | — | 397,660 B |
| Deferred JavaScript | 0 B | 110,640 B |
| Worker JavaScript | — | 7,610 B |
| `App.tsx` | 2,014 lines | 1,855 lines |
| `TimelinePanel.tsx` | 1,411 lines | 973 lines |
| VFX geometry allocations | 15,360 | 5,762 |
| VFX material allocations | 15,360 | 128 |
| VFX particle-buffer allocations | 7,680 | 64 |

## Enforced ceilings

The shared JSON threshold source drives TypeScript tests and the post-build CI
check:

- main JavaScript: 1,520,000 B;
- all JavaScript: 1,700,000 B;
- worker JavaScript: 30,000 B;
- `App.tsx`: 1,900 lines;
- `TimelinePanel.tsx`: 1,000 lines.

The CI script discovers the production module entry from `dist/index.html`,
walks assets recursively, requires the world worker, and fails above a ceiling.
Thresholds must not be raised without a new recorded measurement and review.

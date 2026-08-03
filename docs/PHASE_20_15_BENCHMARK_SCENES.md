# Phase 20.15 — Reproducible benchmark scenes

MineMotion Studio now exposes five deterministic project fixtures:

| ID | Intent | Expected Draft result |
| --- | --- | --- |
| `small` | Minimal editing shot | pass |
| `medium` | Cast, props, eight chunks, stable VFX families | pass |
| `large-world` | Sixty-four chunks and large object estimate | limit |
| `vfx-fight` | Forty-eight layered combat effects | limit |
| `storm` | Sixty storms with deterministic VFX dropping | limit |

Every fixture uses fixed IDs/timestamps, creates a fresh project, records
expected complexity, and reuses the established deterministic VFX benchmark
fixtures. Tests cover repeat creation, budget classification, VFX allocation
expectations, and project JSON round trips.

These are reproducible software fixtures, not claims about frame rate on a
specific GPU or computer.

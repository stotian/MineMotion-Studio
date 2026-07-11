# Core Contracts

`src/core` owns low-level contracts that can be shared without importing the full
project schema or React UI.

- `ids`: generated identity and deterministic content IDs
- `time`: frame conversion and explicit playback clocks
- `scene`: stable entity and transform data
- `serialization`: schema, migration, and validation contracts
- `errors`: typed engine and user-facing errors
- `capabilities`: evidence-based runtime support registry
- `services`: lightweight boundaries for future orchestration extraction

These interfaces are not a dependency injection framework. Existing modules keep
their public APIs and delegate to core contracts incrementally.

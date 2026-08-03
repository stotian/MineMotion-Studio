# Public beta QA

The feature set is frozen for release stabilization. Automated matrices cover schemas 1–10, package corruption, repeated serialization/package work, modern/legacy world claims, golden projects, samples, templates, performance thresholds, and local diagnostics.

Installer smoke tests remain empty in `distribution/smoke-matrix.json`. Therefore no release candidate is promoted, no platform is marked supported, and no stable tag is justified in this environment.

Beta feedback is opt-in and local. The application can export a reproducible report and separately generated redacted diagnostics; it never uploads projects automatically.

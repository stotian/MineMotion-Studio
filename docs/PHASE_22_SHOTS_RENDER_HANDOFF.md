# Phase 22 — Professional shots and render handoff

MineMotion now stores production shots independently from timeline clips. A shot includes frame range, camera, state, notes, references, take/revision, output folder/name, validation and real render passes. Active takes can be duplicated, reordered, validated, queued individually or queued together. Storyboard cards and typed production markers remain lightweight and do not create an internal NLE.

The real pass set is beauty, alpha, world, characters, VFX, depth and object ID. Alpha uses a transparent renderer background; depth uses a depth material; object ID temporarily replaces mesh materials with deterministic ID colors and restores them immediately afterward. Output names and folders are deterministic. The handoff manifest includes FPS, frame range, timecode, audio metadata and pass paths. EDL/XML is not advertised because no reliable editor-specific writer is present.

Render jobs persist in the project. Jobs interrupted in `running` state reopen as `queued`; cancelled and error jobs can be run again from the same queue. Validation reports camera, range, dependencies, resources, codec/FFmpeg and estimated output-size issues before queueing.

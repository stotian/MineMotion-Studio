# Timeline architecture

The project stores canonical animation tracks, typed timeline lanes, markers, reusable clips, NLA tracks, effects, audio clips, lighting keyframes, and production shots. The timeline UI edits those canonical records through commands; it does not keep a parallel project model.

Frame evaluation is deterministic. Playback, scrub, preview, simulation bake, audio synchronization, and export use integer project frames and the project FPS. Shot preview is bounded by the active shot. Heavy views are split from `TimelinePanel.tsx`, whose architecture ceiling is enforced by `scripts/verify-app-size.mjs`.

# Phase 17.6 - Safe Package Assets And Restricted Templates

Package assets are now semantically validated and resolved by closed kind:

- texture, sprite, and thumbnail: bounded PNG already verified by archive IHDR;
- audio: WAV, Ogg, or MP3 MIME with matching magic signature;
- model: `minemotion-box-model` V1, at most 128 finite bounded colored boxes;
- gradient: 2-16 strictly ordered safe-color stops;
- curve: 2-64 strictly ordered bounded points and known interpolation;
- localization: bounded locale plus at most 256 bounded ID/string entries;
- restricted shader: one of soft-glow, heat-distortion, or pixel-dissolve with
  an exact bounded parameter object and no source text.

All JSON assets share depth 16, 4,096-node, key, string, plain-value, and finite
number limits. Dangerous prototype keys and unknown fields fail closed. Binary
assets resolve to bounded data URLs only on demand. Parsed outputs are deeply
frozen.

If a valid restricted template is unavailable on the current renderer, the
resolver returns `primitive-default-material` with an explicit warning. It never
loads arbitrary GLSL/WGSL or silently exposes a non-existent shader capability.
The bounded package reader now performs this semantic validation before a
package can be inspected, exported, or installed.

# Video Export

Phase 3 includes browser WebM recording where available and explicitly marks MP4
as future work.

## WebM

WebM export uses:

- the live viewport `<canvas>`
- browser `canvas.captureStream`
- browser `MediaRecorder`
- VP9 WebM when supported, otherwise generic WebM

Because it records the live viewport, the output resolution is the viewport
canvas resolution rather than the requested export width and height.

## MP4

MP4 is not implemented. It requires a future FFmpeg/native pipeline through
Tauri or another native renderer.

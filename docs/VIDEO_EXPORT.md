# Video Export

Browser WebM and desktop FFmpeg video exports have different capability
boundaries and are presented separately in the UI.

## WebM

WebM export uses the same composited explicit-frame PNG capture path as sequence
and FFmpeg staging, presents those frames on a dedicated canvas at the selected
output width/height, then records `canvas.captureStream` with browser
`MediaRecorder`. VP9 is preferred when supported, otherwise generic WebM.

WebM is currently video-only. Export WAV separately or use native MP4 when a
muxed audio result is required.

## Native Video

The Tauri build detects a user-installed FFmpeg executable, stages deterministic
PNG frames and optional WAV audio, then supports H.264 MP4, H.265 MP4, and
ProRes MOV. FFmpeg is not bundled and browser mode never claims those formats.

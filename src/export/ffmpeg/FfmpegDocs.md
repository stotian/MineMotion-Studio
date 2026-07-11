# FFmpeg native bridge

MineMotion Studio does not bundle FFmpeg. The desktop build detects an executable
chosen by the user, stages numbered PNG frames and an optional WAV mixdown in a
temporary directory, then invokes FFmpeg directly without a command shell.

The browser build never claims MP4, H.265, ProRes, or MP3 support. Those formats
are enabled only after the Tauri command bridge successfully detects FFmpeg.

Temporary files accept only generated job identifiers and the filenames
`frame_######.png` or `audio.wav`. The native bridge removes the job directory
after completion or cancellation.

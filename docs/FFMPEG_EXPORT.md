# FFmpeg Export

FFmpeg export is available only in the Tauri desktop runtime and requires a
user-installed FFmpeg executable.

## Setup

1. Install FFmpeg independently and review its license/build configuration.
2. Open **Production Export**.
3. Enter `ffmpeg` when it is on `PATH`, or enter the full executable path.
4. Enter an existing output directory.
5. Click **Detect FFmpeg**.
6. Choose H.264, H.265, ProRes, or MP3 and add the job to the queue.

## Pipeline

For video, MineMotion renders numbered `frame_######.png` files. If audio is
enabled, it also creates `audio.wav` for the selected frame range. The Tauri
bridge runs FFmpeg with an argument array, never through PowerShell, `cmd.exe`,
or another shell.

H.264 uses `libx264`, H.265 uses `libx265`, ProRes uses `prores_ks`, and MP3 uses
`libmp3lame`. Whether those encoders are available depends on the user's FFmpeg
build. Encoder failures are preserved in the render job log.

## Security

The native bridge:

- verifies that the executable reports an `ffmpeg version` header
- accepts only generated alphanumeric job IDs
- accepts only `frame_######.png` and `audio.wav` staging filenames
- validates the exact supported encoding argument shape
- requires one absolute `.mp4`, `.mov`, or `.mp3` output path
- rejects arbitrary inputs, codecs, flags, and extra output files
- removes the temporary job directory after completion or cancellation

## Licensing

FFmpeg is not bundled. Distribution teams must decide which FFmpeg build and
codec configuration is appropriate for their platform and licensing needs.

# Render Queue

Render jobs are stored with the project so users can prepare multiple outputs
before running them.

Each job contains:

- name and complete export settings
- frame range, camera, resolution, FPS, and format
- audio, post-processing, and VFX flags
- queued, running, complete, cancelled, or error status
- normalized progress and current message
- timestamped info, warning, and error logs
- native output path when FFmpeg writes a file

## Workflow

1. Open **Production Export** and configure the output.
2. Review validation and estimates.
3. Click **Add to Queue**.
4. Run any queued or finished job with the play button.
5. Use **Cancel** while frames are being rendered or staged.
6. Remove individual inactive jobs or clear all finished jobs.

Only one job runs at a time. Cancellation is checked between frames, before
audio mixdown, and before FFmpeg starts. Once the external FFmpeg process has
started, the current MVP waits for that process to finish and reports its exit
status.

Queue history is serialized in schema v10. A job that was marked running when a
project was last saved is recovered as queued on load.

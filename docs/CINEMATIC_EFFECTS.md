# Cinematic Effects

Effects are serializable timeline items stored in project schema v5.

Each effect has:

- stable `id`
- `type`
- name
- start frame
- duration
- world position
- optional target object
- parameters
- enabled flag

## Built-In Effects

- Lightning Strike
- Impact Frame
- Camera Shake
- Flash
- Speed Lines
- Shockwave
- Glow Burst
- Fog Pulse
- Vignette Pulse
- Color Grade Keyframe
- Cinematic Bars
- Explosion Flash

## Rendering

World-space effects are rendered by `SceneRenderer`:

- lightning uses a stylized line bolt
- shockwave uses an expanding ring
- glow burst uses small cube particles

Screen-space effects are rendered by `Viewport` overlays:

- flash and impact frame
- speed lines
- fog pulse
- vignette pulse
- cinematic bars
- camera shake

## Workflow

1. Move the timeline to the desired frame.
2. Click an effect in the Effects panel.
3. Select the effect block on the timeline.
4. Edit timing, position, color, alpha, intensity, radius, strength, frequency,
   or count in the inspector.
5. Play or scrub the timeline.

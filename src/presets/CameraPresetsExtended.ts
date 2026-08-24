import type { CameraPreset } from "./CameraPresets";

/**
 * Extended camera library.
 *
 * The base set covers a handful of establishing angles. These add the shot
 * vocabulary a cinematic actually needs: coverage heights, character framing,
 * architectural angles and the odd stylised setup. Positions are in world
 * units with the default rig standing at the origin, roughly 3.3 units tall.
 */

function shot(
  id: string,
  name: string,
  description: string,
  fov: number,
  position: [number, number, number],
  rotation: [number, number, number]
): CameraPreset {
  return {
    id,
    name,
    description,
    fov,
    transform: { position, rotation, scale: [1, 1, 1] }
  };
}

/** Standard coverage: the angles most shots are built from. */
const COVERAGE: CameraPreset[] = [
  shot("eye-level", "Eye level", "Neutral eye-height framing.", 40, [0, 2.9, 5.5], [-2, 0, 0]),
  shot("medium-shot", "Medium shot", "Waist-up framing of a character.", 38, [1.6, 2.6, 4.2], [-6, 20, 0]),
  shot("close-up", "Close-up", "Head and shoulders.", 32, [0.9, 3.0, 2.6], [-4, 18, 0]),
  shot("extreme-close-up", "Extreme close-up", "Tight on the face.", 26, [0.5, 3.1, 1.7], [-2, 16, 0]),
  shot("full-body", "Full body", "Head to feet with headroom.", 45, [2.4, 2.2, 6.4], [-8, 20, 0]),
  shot("wide-establishing", "Wide establishing", "Sets the location.", 62, [16, 9, 16], [-22, 45, 0]),
  shot("extreme-wide", "Extreme wide", "Subject small in the landscape.", 72, [30, 16, 30], [-24, 45, 0]),
  shot("over-shoulder-l", "Over shoulder L", "Framed past a left shoulder.", 36, [-1.9, 2.9, 3.4], [-6, -28, 0]),
  shot("over-shoulder-r", "Over shoulder R", "Framed past a right shoulder.", 36, [1.9, 2.9, 3.4], [-6, 28, 0]),
  shot("two-shot", "Two shot", "Room for two characters.", 46, [0, 2.7, 7.2], [-4, 0, 0])
];

/** Height and tilt: angles that change how the subject reads. */
const ANGLES: CameraPreset[] = [
  shot("low-hero", "Low hero", "Looking up; makes the subject dominant.", 40, [2.2, 0.8, 4.4], [12, 24, 0]),
  shot("worm-eye", "Worm's eye", "From the ground looking straight up.", 52, [1.4, 0.15, 2.6], [34, 24, 0]),
  shot("high-angle", "High angle", "Looking down; diminishes the subject.", 44, [3.2, 6.2, 5.0], [-34, 30, 0]),
  shot("birds-eye", "Bird's eye", "Steeply overhead.", 50, [1.5, 12, 3.0], [-70, 24, 0]),
  shot("plan-view", "Plan view", "Straight down on the scene.", 55, [0, 18, 0.01], [-89, 0, 0]),
  shot("dutch-left", "Dutch left", "Tilted horizon, leaning left.", 40, [1.8, 3.0, 4.6], [-4, 20, -14]),
  shot("dutch-right", "Dutch right", "Tilted horizon, leaning right.", 40, [1.8, 3.0, 4.6], [-4, 20, 14]),
  shot("ground-level", "Ground level", "Camera resting on the floor.", 46, [3.0, 0.3, 4.6], [4, 30, 0]),
  shot("shoulder-height", "Shoulder height", "Slightly below eye line.", 40, [1.7, 2.4, 4.4], [2, 20, 0]),
  shot("crane-high", "Crane high", "Elevated and angled down the set.", 54, [10, 11, 12], [-32, 40, 0])
];

/** Distances: pushing in and pulling out along the same axis. */
const DISTANCE: CameraPreset[] = [
  shot("push-far", "Push — far", "Start of a push-in move.", 44, [0, 2.9, 11], [-4, 0, 0]),
  shot("push-mid", "Push — mid", "Middle of a push-in move.", 40, [0, 2.9, 6.5], [-3, 0, 0]),
  shot("push-near", "Push — near", "End of a push-in move.", 34, [0, 2.9, 3.0], [-2, 0, 0]),
  shot("orbit-front", "Orbit — front", "Front quarter of an orbit.", 42, [0, 3.0, 6.5], [-4, 0, 0]),
  shot("orbit-side", "Orbit — side", "Side quarter of an orbit.", 42, [6.5, 3.0, 0], [-4, 90, 0]),
  shot("orbit-back", "Orbit — back", "Rear quarter of an orbit.", 42, [0, 3.0, -6.5], [-4, 180, 0]),
  shot("orbit-side-far", "Orbit — far side", "Opposite side of an orbit.", 42, [-6.5, 3.0, 0], [-4, -90, 0]),
  shot("profile-left", "Profile left", "Clean left-side silhouette.", 38, [-5.4, 2.9, 0], [-3, -90, 0]),
  shot("profile-right", "Profile right", "Clean right-side silhouette.", 38, [5.4, 2.9, 0], [-3, 90, 0]),
  shot("back-view", "Back view", "Following from behind.", 44, [0, 3.1, -5.6], [-6, 180, 0])
];

/** Stylised setups for builds, landscapes and title cards. */
const STYLISED: CameraPreset[] = [
  shot("isometric", "Isometric", "Classic 45-degree build view.", 30, [14, 14, 14], [-35, 45, 0]),
  shot("isometric-tight", "Isometric tight", "Isometric on a small build.", 24, [7, 7, 7], [-35, 45, 0]),
  shot("architectural", "Architectural", "Level horizon for straight walls.", 40, [10, 5, 10], [0, 45, 0]),
  shot("landscape-wide", "Landscape wide", "Sweeping terrain view.", 70, [26, 12, 26], [-16, 45, 0]),
  shot("hero-title", "Hero title", "Low, wide and centred for titles.", 50, [0, 1.6, 8.5], [6, 0, 0]),
  shot("silhouette", "Silhouette", "Low and backlit for a rim shot.", 44, [0, 1.9, -7.5], [4, 180, 0]),
  shot("macro-detail", "Macro detail", "Very close on a small object.", 20, [0.7, 1.2, 1.1], [-14, 30, 0]),
  shot("corridor", "Corridor", "Long lens down a straight run.", 28, [0, 2.7, 14], [-2, 0, 0]),
  shot("sky-look", "Sky look", "Aimed up past the subject.", 60, [2.5, 2.0, 5.0], [26, 20, 0]),
  shot("wide-vertical", "Wide vertical", "Tall framing for a big build.", 58, [8, 14, 12], [-30, 34, 0])
];

export const EXTENDED_CAMERA_PRESETS: readonly CameraPreset[] = Object.freeze([
  ...COVERAGE,
  ...ANGLES,
  ...DISTANCE,
  ...STYLISED
]);

/*
 * Aurora Pack — a worked example plugin for BlockMotion Studio.
 *
 * A plugin exports a single `extensions` object. Every key is optional: fill in
 * only the ones your pack provides, and request the matching permission in
 * plugin.json (this pack uses "registerPresets" and "registerRigs").
 *
 * Available keys: templates, skyPresets, blockPalettes, cameraPresets,
 * rigPosePresets, animationPresets, effects, postProcessingPresets, sfx,
 * renderPresets, timelineItemTypes, importers, exporters, tools.
 *
 * Note: skyPresets is listed by the API but its ids come from a closed union in
 * the host, so a plugin cannot add a NEW sky — only override a known one. This
 * example sticks to the extension points a pack can genuinely extend.
 *
 * Angles are degrees. Positions are [x, y, z] in world units, where the ground
 * plane is y = 0 and a character stands roughly 3.3 units tall.
 */

export const extensions = {
  /* ------------------------------ cameras ------------------------------ */
  cameraPresets: [
    {
      id: "aurora-low-hero",
      name: "Aurora: Low Hero",
      description: "Low three-quarter angle looking up at the subject.",
      fov: 38,
      transform: {
        position: [3.4, 1.1, 4.6],
        rotation: [8, 34, 0],
        scale: [1, 1, 1]
      }
    },
    {
      id: "aurora-top-down",
      name: "Aurora: Top Down",
      description: "Straight overhead plan view for blocking a build.",
      fov: 50,
      transform: {
        position: [0, 16, 0.01],
        rotation: [-89, 0, 0],
        scale: [1, 1, 1]
      }
    },
    {
      id: "aurora-dutch",
      name: "Aurora: Dutch Tilt",
      description: "Rolled horizon for unease.",
      fov: 44,
      transform: {
        position: [4.2, 3.1, 5.4],
        rotation: [-14, 38, 12],
        scale: [1, 1, 1]
      }
    }
  ],

  /* ------------------------------- poses ------------------------------- */
  rigPosePresets: [
    {
      id: "aurora-stargaze",
      name: "Aurora: Stargaze",
      description: "Head tilted back, arms loose.",
      boneRotations: {
        head: [-38, 0, 0],
        body: [-8, 0, 0],
        leftArm: [6, 0, -18],
        rightArm: [6, 0, 18]
      }
    },
    {
      id: "aurora-reach",
      name: "Aurora: Reach Up",
      description: "One arm stretched toward the sky.",
      boneRotations: {
        rightArm: [-166, 0, 14],
        leftArm: [8, 0, -14],
        head: [-30, -10, 0],
        body: [-10, -6, 0]
      }
    }
  ]
};

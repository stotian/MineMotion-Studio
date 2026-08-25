import type { RigAnimationClip } from "./RigTypes";

/**
 * Extended clip library.
 *
 * These are authored the same way as the core clips in AnimationPresetLibrary:
 * bone rotations in degrees, keyed on frames, at the project's default 24 fps.
 * Bone ids match the player rig (root, body, head, left/rightArm,
 * left/rightForearm, left/rightLeg, left/rightLowerLeg).
 *
 * Grouped by what an animator reaches for: locomotion, combat, work, emotes,
 * reactions and camera-facing beats.
 */

type Frames = Array<[number, RigAnimationClip["keyframes"][number]["boneRotations"]]>;

function clip(
  id: string,
  name: string,
  description: string,
  durationFrames: number,
  loop: boolean,
  frames: Frames
): RigAnimationClip {
  return {
    id,
    name,
    description,
    durationFrames,
    loop,
    keyframes: frames.map(([frame, boneRotations]) => ({ frame, boneRotations }))
  };
}

/** Builds a symmetric 4-key limb cycle: A, B, A — the shape of every gait. */
function gait(
  id: string,
  name: string,
  description: string,
  duration: number,
  armSwing: number,
  legSwing: number,
  bodyLean: number,
  extra: RigAnimationClip["keyframes"][number]["boneRotations"] = {}
): RigAnimationClip {
  const a = {
    leftArm: [armSwing, 0, -8],
    rightArm: [-armSwing, 0, 8],
    leftLeg: [-legSwing, 0, 0],
    rightLeg: [legSwing, 0, 0],
    body: [bodyLean, 0, 0],
    ...extra
  } as RigAnimationClip["keyframes"][number]["boneRotations"];
  const b = {
    leftArm: [-armSwing, 0, -8],
    rightArm: [armSwing, 0, 8],
    leftLeg: [legSwing, 0, 0],
    rightLeg: [-legSwing, 0, 0],
    body: [bodyLean, 0, 0],
    ...extra
  } as RigAnimationClip["keyframes"][number]["boneRotations"];
  return clip(id, name, description, duration, true, [
    [0, a],
    [Math.round(duration / 2), b],
    [duration, a]
  ]);
}

const LOCOMOTION: RigAnimationClip[] = [
  gait("walk-slow", "Walk Slow", "Unhurried walk cycle.", 44, 18, 20, 1),
  gait("walk-brisk", "Walk Brisk", "Purposeful walk.", 28, 32, 32, 3),
  gait("sprint", "Sprint", "Full-speed sprint, deep lean.", 18, 58, 52, 14),
  gait("sneak-walk", "Sneak Walk", "Crouched creep.", 40, 12, 16, 26, {
    head: [-10, 0, 0]
  }),
  gait("swim", "Swim", "Front crawl through water.", 32, 70, 22, 74, {
    head: [-58, 0, 0]
  }),
  gait("wade", "Wade", "Heavy steps through shallow water.", 46, 20, 26, 6),
  gait("march", "March", "Stiff parade march.", 32, 46, 38, 0),
  gait("limp", "Limp", "Uneven, favouring one leg.", 40, 14, 34, 6, {
    head: [6, 0, 0]
  }),
  clip("climb-ladder", "Climb Ladder", "Hand-over-hand ladder climb.", 32, true, [
    [0, { leftArm: [-150, 0, -10], rightArm: [-60, 0, 10], leftLeg: [-30, 0, 0], rightLeg: [10, 0, 0] }],
    [16, { leftArm: [-60, 0, -10], rightArm: [-150, 0, 10], leftLeg: [10, 0, 0], rightLeg: [-30, 0, 0] }],
    [32, { leftArm: [-150, 0, -10], rightArm: [-60, 0, 10], leftLeg: [-30, 0, 0], rightLeg: [10, 0, 0] }]
  ]),
  clip("crawl", "Crawl", "Belly crawl in a one-block gap.", 48, true, [
    [0, { body: [82, 0, 0], head: [-70, 0, 0], leftArm: [-120, 0, -20], rightArm: [-40, 0, 20], leftLeg: [-14, 0, 0], rightLeg: [14, 0, 0] }],
    [24, { body: [82, 0, 0], head: [-70, 0, 0], leftArm: [-40, 0, -20], rightArm: [-120, 0, 20], leftLeg: [14, 0, 0], rightLeg: [-14, 0, 0] }],
    [48, { body: [82, 0, 0], head: [-70, 0, 0], leftArm: [-120, 0, -20], rightArm: [-40, 0, 20], leftLeg: [-14, 0, 0], rightLeg: [14, 0, 0] }]
  ]),
  clip("jump-up", "Jump Up", "Crouch, spring, tuck.", 26, false, [
    [0, { body: [0, 0, 0], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0] }],
    [6, { body: [18, 0, 0], leftLeg: [-32, 0, 0], rightLeg: [-32, 0, 0], leftArm: [20, 0, -8], rightArm: [20, 0, 8] }],
    [14, { body: [-6, 0, 0], leftArm: [-130, 0, -14], rightArm: [-130, 0, 14], leftLeg: [16, 0, 0], rightLeg: [16, 0, 0] }],
    [26, { body: [0, 0, 0], leftArm: [0, 0, -8], rightArm: [0, 0, 8], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0] }]
  ]),
  clip("fall-loop", "Falling", "Airborne flail, loops.", 30, true, [
    [0, { body: [-8, 0, 0], leftArm: [-140, 0, -30], rightArm: [-150, 0, 26], leftLeg: [-18, 0, 0], rightLeg: [12, 0, 0] }],
    [15, { body: [-4, 0, 0], leftArm: [-152, 0, -22], rightArm: [-138, 0, 34], leftLeg: [10, 0, 0], rightLeg: [-16, 0, 0] }],
    [30, { body: [-8, 0, 0], leftArm: [-140, 0, -30], rightArm: [-150, 0, 26], leftLeg: [-18, 0, 0], rightLeg: [12, 0, 0] }]
  ]),
  clip("land-heavy", "Heavy Landing", "Impact absorbed through the knees.", 22, false, [
    [0, { body: [-6, 0, 0], leftLeg: [14, 0, 0], rightLeg: [14, 0, 0] }],
    [5, { body: [30, 0, 0], head: [-16, 0, 0], leftArm: [-52, 0, -22], rightArm: [-52, 0, 22], leftLeg: [-40, 0, -6], rightLeg: [-40, 0, 6] }],
    [22, { body: [0, 0, 0], head: [0, 0, 0], leftArm: [0, 0, -8], rightArm: [0, 0, 8], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0] }]
  ]),
  clip("turn-in-place", "Turn In Place", "180-degree pivot.", 32, false, [
    [0, { root: [0, 0, 0], head: [0, 0, 0] }],
    [16, { root: [0, 90, 0], head: [0, 30, 0], body: [0, -10, 0] }],
    [32, { root: [0, 180, 0], head: [0, 0, 0], body: [0, 0, 0] }]
  ])
];

const COMBAT: RigAnimationClip[] = [
  clip("sword-slash-down", "Sword Slash (Down)", "Overhead downward cut.", 22, false, [
    [0, { rightArm: [-160, 10, 18], body: [0, -14, 0], head: [-14, -10, 0] }],
    [8, { rightArm: [-20, -14, -34], body: [0, 20, 0], head: [-6, 16, 0] }],
    [22, { rightArm: [0, 0, 8], body: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("sword-slash-side", "Sword Slash (Side)", "Horizontal sweep.", 20, false, [
    [0, { rightArm: [-40, 60, 40], body: [0, -30, 0] }],
    [8, { rightArm: [-40, -60, -20], body: [0, 30, 0] }],
    [20, { rightArm: [0, 0, 8], body: [0, 0, 0] }]
  ]),
  clip("sword-thrust", "Sword Thrust", "Straight stab and recover.", 18, false, [
    [0, { rightArm: [-30, 20, 10], body: [0, -16, 0] }],
    [6, { rightArm: [-96, -6, 4], body: [0, 12, 0], leftLeg: [-20, 0, 0] }],
    [18, { rightArm: [0, 0, 8], body: [0, 0, 0], leftLeg: [0, 0, 0] }]
  ]),
  clip("sword-combo", "Sword Combo", "Three-hit chain.", 46, false, [
    [0, { rightArm: [-150, 10, 16], body: [0, -14, 0] }],
    [8, { rightArm: [-24, -12, -30], body: [0, 18, 0] }],
    [16, { rightArm: [-40, 60, 40], body: [0, -26, 0] }],
    [24, { rightArm: [-40, -60, -20], body: [0, 26, 0] }],
    [34, { rightArm: [-100, -4, 2], body: [0, 10, 0], leftLeg: [-22, 0, 0] }],
    [46, { rightArm: [0, 0, 8], body: [0, 0, 0], leftLeg: [0, 0, 0] }]
  ]),
  clip("axe-chop", "Axe Chop", "Heavy two-handed chop.", 28, false, [
    [0, { rightArm: [-168, 0, 12], leftArm: [-152, 0, -12], body: [-12, 0, 0] }],
    [10, { rightArm: [-14, 0, 4], leftArm: [-20, 0, -4], body: [26, 0, 0], head: [-18, 0, 0] }],
    [28, { rightArm: [0, 0, 8], leftArm: [0, 0, -8], body: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("bow-draw", "Bow Draw", "Raise, draw and hold.", 30, false, [
    [0, { leftArm: [0, 0, -8], rightArm: [0, 0, 8] }],
    [12, { leftArm: [-88, -16, -6], rightArm: [-70, 20, 10], head: [0, -14, 0], body: [0, -18, 0] }],
    [30, { leftArm: [-92, -18, -4], rightArm: [-52, 46, 16], head: [0, -16, 0], body: [0, -22, 0] }]
  ]),
  clip("bow-release", "Bow Release", "Loose the arrow and recoil.", 18, false, [
    [0, { leftArm: [-92, -18, -4], rightArm: [-52, 46, 16], body: [0, -22, 0] }],
    [4, { leftArm: [-84, -14, -6], rightArm: [-88, 8, 12], body: [0, -12, 0] }],
    [18, { leftArm: [0, 0, -8], rightArm: [0, 0, 8], body: [0, 0, 0] }]
  ]),
  clip("shield-raise", "Shield Raise", "Bring the shield up and brace.", 16, false, [
    [0, { leftArm: [0, 0, -8] }],
    [8, { leftArm: [-78, 26, -14], body: [6, 14, 0], head: [4, 10, 0] }],
    [16, { leftArm: [-74, 24, -12], body: [8, 12, 0], head: [4, 8, 0] }]
  ]),
  clip("shield-bash", "Shield Bash", "Punch forward with the shield.", 18, false, [
    [0, { leftArm: [-74, 24, -12], body: [8, 12, 0] }],
    [6, { leftArm: [-94, -14, -4], body: [0, -18, 0], rightLeg: [-24, 0, 0] }],
    [18, { leftArm: [-74, 24, -12], body: [8, 12, 0], rightLeg: [0, 0, 0] }]
  ]),
  clip("punch-jab", "Punch (Jab)", "Quick lead-hand jab.", 12, false, [
    [0, { leftArm: [-24, 0, -14], rightArm: [-30, 0, 14] }],
    [4, { leftArm: [-96, -8, -4], body: [0, -14, 0] }],
    [12, { leftArm: [-24, 0, -14], body: [0, 0, 0] }]
  ]),
  clip("punch-cross", "Punch (Cross)", "Rear-hand power punch.", 16, false, [
    [0, { leftArm: [-24, 0, -14], rightArm: [-30, 0, 14], body: [0, 16, 0] }],
    [6, { rightArm: [-100, 8, 4], body: [0, -22, 0], leftLeg: [-16, 0, 0] }],
    [16, { rightArm: [-30, 0, 14], body: [0, 16, 0], leftLeg: [0, 0, 0] }]
  ]),
  clip("kick-front", "Front Kick", "Straight snap kick.", 20, false, [
    [0, { rightLeg: [0, 0, 0], body: [0, 0, 0] }],
    [8, { rightLeg: [-88, 0, 0], rightLowerLeg: [-20, 0, 0], body: [-14, 0, 0], leftArm: [-40, 0, -20], rightArm: [30, 0, 16] }],
    [20, { rightLeg: [0, 0, 0], rightLowerLeg: [0, 0, 0], body: [0, 0, 0], leftArm: [0, 0, -8], rightArm: [0, 0, 8] }]
  ]),
  clip("dodge-roll", "Dodge Roll", "Duck under and roll clear.", 30, false, [
    [0, { body: [0, 0, 0] }],
    [8, { body: [64, 0, 0], head: [-46, 0, 0], leftLeg: [-60, 0, 0], rightLeg: [-40, 0, 0], leftArm: [-100, 0, -24], rightArm: [-100, 0, 24] }],
    [18, { body: [30, 0, 0], head: [-20, 0, 0], leftLeg: [40, 0, 0], rightLeg: [-30, 0, 0] }],
    [30, { body: [0, 0, 0], head: [0, 0, 0], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0], leftArm: [0, 0, -8], rightArm: [0, 0, 8] }]
  ]),
  clip("parry", "Parry", "Deflect and reset.", 14, false, [
    [0, { rightArm: [-30, 0, 14] }],
    [4, { rightArm: [-70, -40, -20], body: [0, 22, 0], head: [0, 12, 0] }],
    [14, { rightArm: [-30, 0, 14], body: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("stagger-back", "Stagger Back", "Knocked off balance.", 28, false, [
    [0, { body: [0, 0, 0] }],
    [7, { body: [-26, 0, 0], head: [-30, 0, 0], leftArm: [-60, 0, -28], rightArm: [-60, 0, 28], rightLeg: [-32, 0, 0] }],
    [16, { body: [-10, 0, 0], head: [-12, 0, 0], rightLeg: [18, 0, 0] }],
    [28, { body: [0, 0, 0], head: [0, 0, 0], leftArm: [0, 0, -8], rightArm: [0, 0, 8], rightLeg: [0, 0, 0] }]
  ]),
  clip("death-fall", "Death (Fall Back)", "Collapse backwards.", 40, false, [
    [0, { body: [0, 0, 0] }],
    [10, { body: [-18, 0, 0], head: [-26, 0, 0], leftArm: [-40, 0, -30], rightArm: [-40, 0, 30] }],
    [24, { body: [-70, 0, 0], head: [-30, 0, 0], leftLeg: [30, 0, 0], rightLeg: [24, 0, 0] }],
    [40, { body: [-88, 0, 0], head: [-14, 0, 0], leftArm: [-20, 0, -60], rightArm: [-20, 0, 60], leftLeg: [10, 0, 0], rightLeg: [8, 0, 0] }]
  ])
];

const WORK: RigAnimationClip[] = [
  clip("mine-swing", "Mine Swing", "Repeating pickaxe swing.", 20, true, [
    [0, { rightArm: [-150, 0, 10], body: [-8, 0, 0] }],
    [8, { rightArm: [-30, 0, 4], body: [16, 0, 0], head: [-12, 0, 0] }],
    [20, { rightArm: [-150, 0, 10], body: [-8, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("mine-fast", "Mine Fast", "Rapid efficiency-V swings.", 10, true, [
    [0, { rightArm: [-130, 0, 10], body: [-4, 0, 0] }],
    [4, { rightArm: [-40, 0, 6], body: [10, 0, 0] }],
    [10, { rightArm: [-130, 0, 10], body: [-4, 0, 0] }]
  ]),
  clip("place-block", "Place Block", "Reach out and set a block.", 18, false, [
    [0, { rightArm: [0, 0, 8] }],
    [8, { rightArm: [-84, -10, 4], head: [-16, -8, 0], body: [6, -8, 0] }],
    [18, { rightArm: [0, 0, 8], head: [0, 0, 0], body: [0, 0, 0] }]
  ]),
  clip("dig-down", "Dig Down", "Mining straight at the floor.", 22, true, [
    [0, { rightArm: [-120, 0, 10], head: [-34, 0, 0], body: [16, 0, 0] }],
    [9, { rightArm: [-46, 0, 6], head: [-40, 0, 0], body: [24, 0, 0] }],
    [22, { rightArm: [-120, 0, 10], head: [-34, 0, 0], body: [16, 0, 0] }]
  ]),
  clip("fish-cast", "Fish Cast", "Cast the line out.", 24, false, [
    [0, { rightArm: [-40, 0, 10] }],
    [8, { rightArm: [-158, 0, 14], body: [-10, 0, 0] }],
    [14, { rightArm: [-56, 0, 6], body: [12, 0, 0] }],
    [24, { rightArm: [-46, 0, 8], body: [0, 0, 0] }]
  ]),
  clip("fish-reel", "Fish Reel", "Reeling in, rod bent.", 32, true, [
    [0, { rightArm: [-52, 0, 8], leftArm: [-60, -16, -8], body: [-6, 0, 0] }],
    [16, { rightArm: [-46, 0, 8], leftArm: [-30, -16, -8], body: [4, 0, 0] }],
    [32, { rightArm: [-52, 0, 8], leftArm: [-60, -16, -8], body: [-6, 0, 0] }]
  ]),
  clip("eat", "Eat", "Bring food up and bite.", 36, true, [
    [0, { rightArm: [-20, 0, 8] }],
    [10, { rightArm: [-104, -22, 6], head: [10, -6, 0] }],
    [20, { rightArm: [-96, -20, 6], head: [-4, -6, 0] }],
    [36, { rightArm: [-20, 0, 8], head: [0, 0, 0] }]
  ]),
  clip("drink", "Drink", "Tip a bottle back.", 34, false, [
    [0, { rightArm: [-20, 0, 8] }],
    [12, { rightArm: [-118, -24, 8], head: [-24, -6, 0] }],
    [24, { rightArm: [-118, -24, 8], head: [-28, -6, 0] }],
    [34, { rightArm: [-20, 0, 8], head: [0, 0, 0] }]
  ]),
  clip("throw", "Throw", "Overarm throw.", 20, false, [
    [0, { rightArm: [-30, 0, 10] }],
    [7, { rightArm: [-168, 14, 16], body: [0, -20, 0] }],
    [13, { rightArm: [-40, -18, -8], body: [0, 22, 0], leftLeg: [-20, 0, 0] }],
    [20, { rightArm: [0, 0, 8], body: [0, 0, 0], leftLeg: [0, 0, 0] }]
  ]),
  clip("push", "Push", "Lean into a heavy push.", 40, true, [
    [0, { leftArm: [-84, -8, -10], rightArm: [-84, 8, 10], body: [22, 0, 0], leftLeg: [-22, 0, 0], rightLeg: [14, 0, 0] }],
    [20, { leftArm: [-88, -8, -10], rightArm: [-88, 8, 10], body: [26, 0, 0], leftLeg: [14, 0, 0], rightLeg: [-22, 0, 0] }],
    [40, { leftArm: [-84, -8, -10], rightArm: [-84, 8, 10], body: [22, 0, 0], leftLeg: [-22, 0, 0], rightLeg: [14, 0, 0] }]
  ])
];

const EMOTES: RigAnimationClip[] = [
  clip("wave", "Wave", "Friendly raised-hand wave.", 36, true, [
    [0, { rightArm: [-150, 0, 30] }],
    [9, { rightArm: [-150, 0, 4] }],
    [18, { rightArm: [-150, 0, 30] }],
    [27, { rightArm: [-150, 0, 4] }],
    [36, { rightArm: [-150, 0, 30] }]
  ]),
  clip("nod-yes", "Nod (Yes)", "Two clear nods.", 28, false, [
    [0, { head: [0, 0, 0] }],
    [7, { head: [22, 0, 0] }],
    [14, { head: [-6, 0, 0] }],
    [21, { head: [20, 0, 0] }],
    [28, { head: [0, 0, 0] }]
  ]),
  clip("shake-no", "Shake (No)", "Head shake.", 28, false, [
    [0, { head: [0, 0, 0] }],
    [7, { head: [0, 28, 0] }],
    [14, { head: [0, -28, 0] }],
    [21, { head: [0, 20, 0] }],
    [28, { head: [0, 0, 0] }]
  ]),
  clip("point-forward", "Point", "Extend an arm and point.", 24, false, [
    [0, { rightArm: [0, 0, 8] }],
    [8, { rightArm: [-92, -6, 4], head: [0, -10, 0] }],
    [18, { rightArm: [-92, -6, 4], head: [0, -10, 0] }],
    [24, { rightArm: [0, 0, 8], head: [0, 0, 0] }]
  ]),
  clip("clap", "Clap", "Applause loop.", 20, true, [
    [0, { leftArm: [-70, -34, -20], rightArm: [-70, 34, 20] }],
    [5, { leftArm: [-74, -6, -8], rightArm: [-74, 6, 8] }],
    [10, { leftArm: [-70, -34, -20], rightArm: [-70, 34, 20] }],
    [15, { leftArm: [-74, -6, -8], rightArm: [-74, 6, 8] }],
    [20, { leftArm: [-70, -34, -20], rightArm: [-70, 34, 20] }]
  ]),
  clip("cheer", "Cheer", "Both arms thrown up.", 30, true, [
    [0, { leftArm: [-160, 0, -24], rightArm: [-160, 0, 24], body: [-6, 0, 0] }],
    [15, { leftArm: [-140, 0, -40], rightArm: [-140, 0, 40], body: [2, 0, 0] }],
    [30, { leftArm: [-160, 0, -24], rightArm: [-160, 0, 24], body: [-6, 0, 0] }]
  ]),
  clip("bow-greeting", "Bow", "Respectful bow.", 40, false, [
    [0, { body: [0, 0, 0], head: [0, 0, 0] }],
    [14, { body: [46, 0, 0], head: [-20, 0, 0], leftArm: [10, 0, -14], rightArm: [10, 0, 14] }],
    [26, { body: [46, 0, 0], head: [-20, 0, 0] }],
    [40, { body: [0, 0, 0], head: [0, 0, 0], leftArm: [0, 0, -8], rightArm: [0, 0, 8] }]
  ]),
  clip("shrug", "Shrug", "Palms-up shrug.", 30, false, [
    [0, { leftArm: [0, 0, -8], rightArm: [0, 0, 8] }],
    [12, { leftArm: [-30, 0, -54], rightArm: [-30, 0, 54], head: [-8, 0, 0] }],
    [22, { leftArm: [-30, 0, -54], rightArm: [-30, 0, 54], head: [-8, 0, 0] }],
    [30, { leftArm: [0, 0, -8], rightArm: [0, 0, 8], head: [0, 0, 0] }]
  ]),
  clip("facepalm", "Facepalm", "Hand to forehead.", 34, false, [
    [0, { rightArm: [0, 0, 8] }],
    [12, { rightArm: [-138, -18, 10], head: [24, 0, 0] }],
    [24, { rightArm: [-138, -18, 10], head: [28, 0, 0] }],
    [34, { rightArm: [0, 0, 8], head: [0, 0, 0] }]
  ]),
  clip("dance-bob", "Dance (Bob)", "Simple side-to-side bob.", 32, true, [
    [0, { body: [0, 0, 6], head: [0, 0, -6], leftArm: [-40, 0, -30], rightArm: [-10, 0, 14] }],
    [16, { body: [0, 0, -6], head: [0, 0, 6], leftArm: [-10, 0, -14], rightArm: [-40, 0, 30] }],
    [32, { body: [0, 0, 6], head: [0, 0, -6], leftArm: [-40, 0, -30], rightArm: [-10, 0, 14] }]
  ]),
  clip("sit-idle", "Sit", "Seated with a slight sway.", 60, true, [
    [0, { body: [6, 0, 0], leftLeg: [-88, 0, 0], rightLeg: [-88, 0, 0], leftLowerLeg: [80, 0, 0], rightLowerLeg: [80, 0, 0] }],
    [30, { body: [9, 0, 0], head: [3, 4, 0], leftLeg: [-88, 0, 0], rightLeg: [-88, 0, 0], leftLowerLeg: [80, 0, 0], rightLowerLeg: [80, 0, 0] }],
    [60, { body: [6, 0, 0], head: [0, 0, 0], leftLeg: [-88, 0, 0], rightLeg: [-88, 0, 0], leftLowerLeg: [80, 0, 0], rightLowerLeg: [80, 0, 0] }]
  ]),
  clip("sleep", "Sleep", "Lying down, breathing.", 96, true, [
    [0, { body: [-90, 0, 0], head: [12, 0, 0], leftArm: [-10, 0, -16], rightArm: [-10, 0, 16] }],
    [48, { body: [-88, 0, 0], head: [14, 0, 0], leftArm: [-8, 0, -18], rightArm: [-8, 0, 18] }],
    [96, { body: [-90, 0, 0], head: [12, 0, 0], leftArm: [-10, 0, -16], rightArm: [-10, 0, 16] }]
  ])
];

const IDLES: RigAnimationClip[] = [
  clip("idle-alert", "Idle Alert", "Tense, ready stance.", 60, true, [
    [0, { body: [2, 0, 0], leftArm: [-14, 0, -12], rightArm: [-14, 0, 12] }],
    [30, { body: [4, 0, 0], head: [-2, 0, 0], leftArm: [-11, 0, -12], rightArm: [-11, 0, 12] }],
    [60, { body: [2, 0, 0], head: [0, 0, 0], leftArm: [-14, 0, -12], rightArm: [-14, 0, 12] }]
  ]),
  clip("idle-relaxed", "Idle Relaxed", "Loose weight shift.", 96, true, [
    [0, { body: [0, 0, 1], head: [0, 3, 0] }],
    [48, { body: [0, 0, -1], head: [0, -3, 0] }],
    [96, { body: [0, 0, 1], head: [0, 3, 0] }]
  ]),
  clip("idle-impatient", "Idle Impatient", "Foot tap and glance.", 48, true, [
    [0, { rightLeg: [0, 0, 0], head: [0, 0, 0] }],
    [8, { rightLeg: [-16, 0, 0] }],
    [14, { rightLeg: [0, 0, 0] }],
    [22, { rightLeg: [-16, 0, 0] }],
    [28, { rightLeg: [0, 0, 0], head: [0, -22, 0] }],
    [48, { rightLeg: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("idle-cold", "Idle Cold", "Shivering, arms tucked.", 24, true, [
    [0, { body: [6, 0, 0], leftArm: [-24, 0, -30], rightArm: [-24, 0, 30], head: [4, 0, 0] }],
    [6, { body: [7, 0, 1], leftArm: [-26, 0, -32], rightArm: [-22, 0, 28], head: [5, 1, 0] }],
    [12, { body: [6, 0, -1], leftArm: [-22, 0, -28], rightArm: [-26, 0, 32], head: [4, -1, 0] }],
    [24, { body: [6, 0, 0], leftArm: [-24, 0, -30], rightArm: [-24, 0, 30], head: [4, 0, 0] }]
  ]),
  clip("look-up", "Look Up", "Raise the gaze slowly.", 36, false, [
    [0, { head: [0, 0, 0] }],
    [18, { head: [-34, 0, 0], body: [-6, 0, 0] }],
    [36, { head: [-34, 0, 0], body: [-6, 0, 0] }]
  ]),
  clip("look-behind", "Look Behind", "Glance over the shoulder.", 40, false, [
    [0, { head: [0, 0, 0], body: [0, 0, 0] }],
    [16, { head: [0, 70, 0], body: [0, 24, 0] }],
    [26, { head: [0, 70, 0], body: [0, 24, 0] }],
    [40, { head: [0, 0, 0], body: [0, 0, 0] }]
  ])
];

const CINEMATIC: RigAnimationClip[] = [
  clip("hero-reveal", "Hero Reveal", "Slow rise into a hero stance.", 72, false, [
    [0, { body: [34, 0, 0], head: [-26, 0, 0], leftArm: [-14, 0, -12], rightArm: [-14, 0, 12] }],
    [40, { body: [10, 0, 0], head: [-8, 0, 0] }],
    [72, { body: [0, 0, 0], head: [0, 0, 0], leftArm: [0, 0, -10], rightArm: [0, 0, 10] }]
  ]),
  clip("slow-turn-to-camera", "Slow Turn To Camera", "Turn in, then meet the lens.", 84, false, [
    [0, { root: [0, 150, 0], head: [0, 20, 0] }],
    [50, { root: [0, 60, 0], head: [0, 10, 0] }],
    [84, { root: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("power-up", "Power Up", "Arms down, energy gathering.", 60, false, [
    [0, { leftArm: [0, 0, -8], rightArm: [0, 0, 8], body: [0, 0, 0] }],
    [24, { leftArm: [24, 0, -34], rightArm: [24, 0, 34], body: [-10, 0, 0], head: [-18, 0, 0] }],
    [44, { leftArm: [30, 0, -44], rightArm: [30, 0, 44], body: [-16, 0, 0], head: [-26, 0, 0] }],
    [60, { leftArm: [0, 0, -10], rightArm: [0, 0, 10], body: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("cape-flourish", "Cape Flourish", "Sweeping arm for a cape beat.", 48, false, [
    [0, { rightArm: [0, 0, 8], body: [0, 0, 0] }],
    [16, { rightArm: [-70, 60, 40], body: [0, -26, 0], head: [0, -16, 0] }],
    [32, { rightArm: [-30, -50, -20], body: [0, 24, 0], head: [0, 14, 0] }],
    [48, { rightArm: [0, 0, 8], body: [0, 0, 0], head: [0, 0, 0] }]
  ]),
  clip("kneel", "Kneel", "Drop to one knee.", 44, false, [
    [0, { body: [0, 0, 0], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0] }],
    [20, { body: [16, 0, 0], head: [-10, 0, 0], leftLeg: [-70, 0, 0], leftLowerLeg: [86, 0, 0], rightLeg: [-24, 0, 0] }],
    [44, { body: [18, 0, 0], head: [-6, 0, 0], leftLeg: [-74, 0, 0], leftLowerLeg: [90, 0, 0], rightLeg: [-28, 0, 0], rightLowerLeg: [10, 0, 0] }]
  ]),
  clip("t-pose-hold", "T-Pose Hold", "Reference T-pose.", 12, true, [
    [0, { root: [0, 0, 0], body: [0, 0, 0], head: [0, 0, 0], leftArm: [0, 0, -90], rightArm: [0, 0, 90], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0] }],
    [12, { root: [0, 0, 0], body: [0, 0, 0], head: [0, 0, 0], leftArm: [0, 0, -90], rightArm: [0, 0, 90], leftLeg: [0, 0, 0], rightLeg: [0, 0, 0] }]
  ]),
  clip("a-pose-hold", "A-Pose Hold", "Reference A-pose.", 12, true, [
    [0, { leftArm: [0, 0, -50], rightArm: [0, 0, 50] }],
    [12, { leftArm: [0, 0, -50], rightArm: [0, 0, 50] }]
  ])
];

/** Every extended clip, in the order the library presents them. */
export const EXTENDED_RIG_ANIMATION_CLIPS: readonly RigAnimationClip[] = Object.freeze([
  ...LOCOMOTION,
  ...COMBAT,
  ...WORK,
  ...EMOTES,
  ...IDLES,
  ...CINEMATIC
]);

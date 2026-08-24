import type { RigPose } from "./RigTypes";

/**
 * Extended built-in pose library.
 *
 * The base library covers a walk and a run cycle. These add the poses a
 * Minecraft animator actually reaches for: locomotion variants, combat beats,
 * mining and building, emotes, falls and idles. Every entry is authored by
 * hand — rotations are in degrees on the rig's bones, matching boneRotations.
 *
 * Bones: root, body, head, leftArm, leftForearm, rightArm, rightForearm,
 * leftLeg, leftLowerLeg, rightLeg, rightLowerLeg, cape.
 */

function pose(
  id: string,
  name: string,
  description: string,
  boneRotations: RigPose["boneRotations"]
): RigPose {
  return { id, name, description, boneRotations };
}

/** Locomotion: walk, run, sprint, sneak, swim, climb, fall. */
const LOCOMOTION: RigPose[] = [
  pose("walk-contact-l", "Walk contact L", "Left foot strikes the ground.", {
    leftArm: [30, 0, -8], rightArm: [-30, 0, 8],
    leftLeg: [-30, 0, 0], rightLeg: [26, 0, 0],
    leftLowerLeg: [4, 0, 0], rightLowerLeg: [-16, 0, 0], body: [2, 0, 0]
  }),
  pose("walk-passing", "Walk passing", "Legs cross at mid-stride.", {
    leftArm: [6, 0, -8], rightArm: [-6, 0, 8],
    leftLeg: [-6, 0, 0], rightLeg: [8, 0, 0],
    rightLowerLeg: [-26, 0, 0], body: [0, 0, 0]
  }),
  pose("walk-contact-r", "Walk contact R", "Right foot strikes the ground.", {
    leftArm: [-30, 0, -8], rightArm: [30, 0, 8],
    leftLeg: [26, 0, 0], rightLeg: [-30, 0, 0],
    leftLowerLeg: [-16, 0, 0], rightLowerLeg: [4, 0, 0], body: [2, 0, 0]
  }),
  pose("run-contact-l", "Run contact L", "Long left stride with forward lean.", {
    body: [10, 0, 0], head: [-8, 0, 0],
    leftArm: [62, 0, -12], rightArm: [-58, 0, 12],
    leftForearm: [-40, 0, 0], rightForearm: [-46, 0, 0],
    leftLeg: [-46, 0, 0], rightLeg: [40, 0, 0], rightLowerLeg: [-34, 0, 0]
  }),
  pose("run-contact-r", "Run contact R", "Long right stride with forward lean.", {
    body: [10, 0, 0], head: [-8, 0, 0],
    leftArm: [-58, 0, -12], rightArm: [62, 0, 12],
    leftForearm: [-46, 0, 0], rightForearm: [-40, 0, 0],
    leftLeg: [40, 0, 0], rightLeg: [-46, 0, 0], leftLowerLeg: [-34, 0, 0]
  }),
  pose("sprint", "Sprint", "Deep lean with a driving arm swing.", {
    body: [22, 0, 0], head: [-18, 0, 0],
    leftArm: [78, 0, -14], rightArm: [-70, 0, 14],
    leftForearm: [-62, 0, 0], rightForearm: [-58, 0, 0],
    leftLeg: [-58, 0, 0], rightLeg: [48, 0, 0], rightLowerLeg: [-46, 0, 0]
  }),
  pose("sneak", "Sneak", "Minecraft's crouched sneak stance.", {
    body: [26, 0, 0], head: [-22, 0, 0],
    leftArm: [16, 0, -14], rightArm: [16, 0, 14],
    leftLeg: [-16, 0, 0], rightLeg: [-16, 0, 0],
    leftLowerLeg: [30, 0, 0], rightLowerLeg: [30, 0, 0]
  }),
  pose("sneak-walk", "Sneak walk", "Crouched with a short stride.", {
    body: [26, 0, 0], head: [-22, 0, 0],
    leftArm: [24, 0, -14], rightArm: [8, 0, 14],
    leftLeg: [-26, 0, 0], rightLeg: [-6, 0, 0],
    leftLowerLeg: [34, 0, 0], rightLowerLeg: [24, 0, 0]
  }),
  pose("swim", "Swim", "Horizontal crawl stroke.", {
    body: [80, 0, 0], head: [-50, 0, 0],
    leftArm: [-150, 0, -10], rightArm: [40, 0, 10],
    leftLeg: [12, 0, 0], rightLeg: [-12, 0, 0]
  }),
  pose("climb", "Climb", "Reaching up a ladder.", {
    body: [8, 0, 0], head: [-14, 0, 0],
    leftArm: [-160, 0, -6], rightArm: [-110, 0, 6],
    leftLeg: [-34, 0, 0], rightLeg: [10, 0, 0], leftLowerLeg: [26, 0, 0]
  }),
  pose("jump-launch", "Jump launch", "Push-off at the start of a jump.", {
    body: [14, 0, 0], leftArm: [-40, 0, -16], rightArm: [-40, 0, 16],
    leftLeg: [-30, 0, 0], rightLeg: [-30, 0, 0],
    leftLowerLeg: [46, 0, 0], rightLowerLeg: [46, 0, 0]
  }),
  pose("jump-apex", "Jump apex", "Tucked at the top of the arc.", {
    leftArm: [-96, 0, -20], rightArm: [-96, 0, 20],
    leftLeg: [-40, 0, 0], rightLeg: [-24, 0, 0],
    leftLowerLeg: [58, 0, 0], rightLowerLeg: [34, 0, 0]
  }),
  pose("fall", "Falling", "Arms trailing in freefall.", {
    body: [-12, 0, 0], head: [16, 0, 0],
    leftArm: [-140, 0, -26], rightArm: [-140, 0, 26],
    leftLeg: [-18, 0, 0], rightLeg: [12, 0, 0]
  }),
  pose("land-soft", "Land soft", "Absorbing a light landing.", {
    body: [18, 0, 0], head: [-12, 0, 0],
    leftArm: [-24, 0, -18], rightArm: [-24, 0, 18],
    leftLeg: [-24, 0, 0], rightLeg: [-24, 0, 0],
    leftLowerLeg: [40, 0, 0], rightLowerLeg: [40, 0, 0]
  }),
  pose("land-heavy", "Land heavy", "Deep crouch after a long drop.", {
    body: [40, 0, 0], head: [-34, 0, 0],
    leftArm: [-10, 0, -30], rightArm: [-10, 0, 30],
    leftForearm: [-40, 0, 0], rightForearm: [-40, 0, 0],
    leftLeg: [-46, 0, 0], rightLeg: [-46, 0, 0],
    leftLowerLeg: [76, 0, 0], rightLowerLeg: [76, 0, 0]
  })
];

/** Combat: swings, blocks, bow, shield, hurt reactions. */
const COMBAT: RigPose[] = [
  pose("sword-ready", "Sword ready", "Guard stance before a swing.", {
    body: [0, -18, 0], head: [0, 18, 0],
    rightArm: [-40, 0, 20], rightForearm: [-50, 0, 0],
    leftArm: [10, 0, -22], leftLeg: [-14, 0, 0], rightLeg: [16, 0, 0]
  }),
  pose("sword-windup", "Sword wind-up", "Blade drawn back over the shoulder.", {
    body: [0, -34, 0], head: [0, 30, 0],
    rightArm: [-140, 0, 24], rightForearm: [-40, 0, 0],
    leftArm: [22, 0, -26], leftLeg: [-18, 0, 0], rightLeg: [20, 0, 0]
  }),
  pose("sword-strike", "Sword strike", "Peak of a downward swing.", {
    body: [16, 26, 0], head: [-10, -22, 0],
    rightArm: [70, 0, 12], rightForearm: [-14, 0, 0],
    leftArm: [-24, 0, -30], leftLeg: [22, 0, 0], rightLeg: [-20, 0, 0]
  }),
  pose("sword-follow", "Sword follow-through", "Blade past the target.", {
    body: [20, 40, 0], head: [-6, -34, 0],
    rightArm: [100, 0, 6], rightForearm: [-30, 0, 0],
    leftArm: [-40, 0, -34], leftLeg: [26, 0, 0], rightLeg: [-24, 0, 0]
  }),
  pose("axe-overhead", "Axe overhead", "Two-handed overhead chop.", {
    body: [8, 0, 0], head: [-14, 0, 0],
    leftArm: [-158, 0, -14], rightArm: [-158, 0, 14],
    leftLeg: [-16, 0, 0], rightLeg: [14, 0, 0]
  }),
  pose("bow-draw", "Bow draw", "Arrow nocked and drawn.", {
    body: [0, -46, 0], head: [0, 44, 0],
    leftArm: [-88, 0, -4], leftForearm: [-6, 0, 0],
    rightArm: [-72, 0, 34], rightForearm: [-72, 0, 0],
    leftLeg: [-10, 0, 0], rightLeg: [12, 0, 0]
  }),
  pose("bow-release", "Bow release", "Just after the string is loosed.", {
    body: [0, -42, 0], head: [0, 40, 0],
    leftArm: [-90, 0, -4],
    rightArm: [-64, 0, 46], rightForearm: [-24, 0, 0],
    leftLeg: [-10, 0, 0], rightLeg: [12, 0, 0]
  }),
  pose("shield-block", "Shield block", "Braced behind a raised shield.", {
    body: [10, 12, 0], head: [-6, -10, 0],
    leftArm: [-84, 0, -22], leftForearm: [-40, 0, 0],
    rightArm: [-16, 0, 26], rightForearm: [-60, 0, 0],
    leftLeg: [-20, 0, 0], rightLeg: [18, 0, 0]
  }),
  pose("punch", "Punch", "Straight right jab.", {
    body: [0, -22, 0], head: [0, 20, 0],
    rightArm: [-88, 0, 6], leftArm: [-30, 0, -24], leftForearm: [-56, 0, 0],
    leftLeg: [-14, 0, 0], rightLeg: [16, 0, 0]
  }),
  pose("hurt", "Hurt", "Recoiling from a hit.", {
    body: [-22, 0, 0], head: [24, 0, 0],
    leftArm: [-48, 0, -34], rightArm: [-48, 0, 34],
    leftLeg: [14, 0, 0], rightLeg: [-10, 0, 0]
  }),
  pose("death", "Death", "Collapsing backwards.", {
    root: [-80, 0, 0], body: [-10, 0, 0], head: [20, 0, 0],
    leftArm: [-30, 0, -50], rightArm: [-30, 0, 50],
    leftLeg: [10, 0, 0], rightLeg: [-8, 0, 0]
  }),
  pose("victory", "Victory", "Both arms thrown up.", {
    body: [-8, 0, 0], head: [-16, 0, 0],
    leftArm: [-170, 0, -30], rightArm: [-170, 0, 30],
    leftLeg: [-6, 0, 0], rightLeg: [6, 0, 0]
  })
];

/** Work: mining, building, fishing, eating, casting. */
const WORK: RigPose[] = [
  pose("mine-windup", "Mine wind-up", "Pickaxe raised before the swing.", {
    body: [6, -14, 0], head: [-10, 12, 0],
    rightArm: [-150, 0, 16], rightForearm: [-30, 0, 0],
    leftArm: [-40, 0, -18], leftLeg: [-10, 0, 0], rightLeg: [10, 0, 0]
  }),
  pose("mine-strike", "Mine strike", "Pickaxe biting into stone.", {
    body: [22, 10, 0], head: [-18, -8, 0],
    rightArm: [-16, 0, 10], rightForearm: [-10, 0, 0],
    leftArm: [-34, 0, -16], leftLeg: [-14, 0, 0], rightLeg: [12, 0, 0]
  }),
  pose("place-block", "Place block", "Reaching out to set a block.", {
    body: [8, -10, 0], head: [-12, 10, 0],
    rightArm: [-74, 0, 8], rightForearm: [-16, 0, 0],
    leftArm: [8, 0, -12], leftLeg: [-8, 0, 0], rightLeg: [8, 0, 0]
  }),
  pose("dig-down", "Dig down", "Digging straight at the feet.", {
    body: [34, 0, 0], head: [-30, 0, 0],
    leftArm: [-14, 0, -16], rightArm: [-20, 0, 16], rightForearm: [-30, 0, 0],
    leftLeg: [-20, 0, 0], rightLeg: [-20, 0, 0],
    leftLowerLeg: [30, 0, 0], rightLowerLeg: [30, 0, 0]
  }),
  pose("fishing", "Fishing", "Rod held out over the water.", {
    body: [4, -12, 0], head: [-6, 10, 0],
    rightArm: [-52, 0, 10], rightForearm: [-20, 0, 0],
    leftArm: [-18, 0, -14], leftLeg: [-6, 0, 0], rightLeg: [6, 0, 0]
  }),
  pose("eat", "Eat", "Bringing food to the mouth.", {
    head: [12, 0, 0],
    rightArm: [-104, 0, 22], rightForearm: [-70, 0, 0],
    leftArm: [6, 0, -12]
  }),
  pose("drink", "Drink", "Tipping a bottle back.", {
    head: [-24, 0, 0],
    rightArm: [-120, 0, 18], rightForearm: [-64, 0, 0],
    leftArm: [6, 0, -12]
  }),
  pose("cast-spell", "Cast spell", "Both hands raised to channel.", {
    body: [-6, 0, 0], head: [-14, 0, 0],
    leftArm: [-128, 0, -34], leftForearm: [-36, 0, 0],
    rightArm: [-128, 0, 34], rightForearm: [-36, 0, 0],
    leftLeg: [-8, 0, 0], rightLeg: [8, 0, 0]
  }),
  pose("point-forward", "Point forward", "Directing attention ahead.", {
    body: [0, -12, 0], head: [0, 12, 0],
    rightArm: [-86, 0, 6], leftArm: [6, 0, -10]
  }),
  pose("carry", "Carry", "Holding something heavy in both arms.", {
    body: [-10, 0, 0], head: [6, 0, 0],
    leftArm: [-70, 0, -20], leftForearm: [-60, 0, 0],
    rightArm: [-70, 0, 20], rightForearm: [-60, 0, 0]
  })
];

/** Emotes and idles: the poses a cinematic needs between beats. */
const EXPRESSION: RigPose[] = [
  pose("idle-relaxed", "Idle relaxed", "Loose neutral stance.", {
    leftArm: [0, 0, -6], rightArm: [0, 0, 6], head: [2, 0, 0]
  }),
  pose("idle-alert", "Idle alert", "Upright and watchful.", {
    body: [-4, 0, 0], head: [-6, 0, 0],
    leftArm: [-8, 0, -12], rightArm: [-8, 0, 12],
    leftLeg: [-6, 0, 0], rightLeg: [6, 0, 0]
  }),
  pose("idle-tired", "Idle tired", "Shoulders down, head hanging.", {
    body: [12, 0, 0], head: [18, 0, 0],
    leftArm: [10, 0, -4], rightArm: [10, 0, 4]
  }),
  pose("wave", "Wave", "Raised hand waving.", {
    body: [0, -8, 0], head: [0, 10, 0],
    rightArm: [-150, 0, 30], rightForearm: [-30, 0, 0],
    leftArm: [4, 0, -8]
  }),
  pose("salute", "Salute", "Hand to the brow.", {
    head: [-4, 0, 0],
    rightArm: [-136, 0, 46], rightForearm: [-84, 0, 0],
    leftArm: [0, 0, -4]
  }),
  pose("shrug", "Shrug", "Palms up, shoulders raised.", {
    head: [-6, 0, 0],
    leftArm: [-30, 0, -46], leftForearm: [-56, 0, 0],
    rightArm: [-30, 0, 46], rightForearm: [-56, 0, 0]
  }),
  pose("facepalm", "Facepalm", "Hand covering the face.", {
    body: [10, 0, 0], head: [16, 0, 0],
    rightArm: [-130, 0, 30], rightForearm: [-80, 0, 0],
    leftArm: [8, 0, -10]
  }),
  pose("think", "Think", "Hand at the chin.", {
    body: [4, -6, 0], head: [8, 8, 0],
    rightArm: [-116, 0, 26], rightForearm: [-78, 0, 0],
    leftArm: [-16, 0, -18], leftForearm: [-30, 0, 0]
  }),
  pose("cheer", "Cheer", "Fists up in celebration.", {
    body: [-10, 0, 0], head: [-18, 0, 0],
    leftArm: [-150, 0, -34], leftForearm: [-54, 0, 0],
    rightArm: [-150, 0, 34], rightForearm: [-54, 0, 0],
    leftLeg: [-10, 0, 0], rightLeg: [10, 0, 0]
  }),
  pose("bow-greeting", "Bow", "A respectful bow from the waist.", {
    body: [48, 0, 0], head: [-24, 0, 0],
    leftArm: [16, 0, -10], rightArm: [16, 0, 10],
    leftLeg: [-8, 0, 0], rightLeg: [8, 0, 0]
  }),
  pose("sit", "Sit", "Seated with legs forward.", {
    root: [0, 0, 0], body: [-4, 0, 0],
    leftLeg: [-88, 0, 0], rightLeg: [-88, 0, 0],
    leftLowerLeg: [84, 0, 0], rightLowerLeg: [84, 0, 0],
    leftArm: [-14, 0, -8], rightArm: [-14, 0, 8]
  }),
  pose("kneel", "Kneel", "One knee to the ground.", {
    body: [10, 0, 0], head: [-8, 0, 0],
    leftLeg: [-86, 0, 0], leftLowerLeg: [92, 0, 0],
    rightLeg: [-30, 0, 0], rightLowerLeg: [40, 0, 0],
    leftArm: [-18, 0, -10], rightArm: [-6, 0, 10]
  }),
  pose("lie-down", "Lie down", "Flat on the back.", {
    root: [-90, 0, 0], leftArm: [0, 0, -18], rightArm: [0, 0, 18]
  }),
  pose("look-up", "Look up", "Head tilted to the sky.", {
    head: [-40, 0, 0], body: [-6, 0, 0]
  }),
  pose("look-around", "Look around", "Head turned over the shoulder.", {
    head: [0, 62, 0], body: [0, 12, 0]
  }),
  pose("t-pose", "T-pose", "Reference pose with arms level.", {
    root: [0, 0, 0], body: [0, 0, 0], head: [0, 0, 0],
    leftArm: [0, 0, -90], rightArm: [0, 0, 90],
    leftForearm: [0, 0, 0], rightForearm: [0, 0, 0],
    leftLeg: [0, 0, 0], rightLeg: [0, 0, 0]
  }),
  pose("a-pose", "A-pose", "Reference pose with arms lowered.", {
    root: [0, 0, 0], body: [0, 0, 0], head: [0, 0, 0],
    leftArm: [0, 0, -45], rightArm: [0, 0, 45],
    leftLeg: [0, 0, -3], rightLeg: [0, 0, 3]
  })
];

export const EXTENDED_RIG_POSES: readonly RigPose[] = Object.freeze([
  ...LOCOMOTION,
  ...COMBAT,
  ...WORK,
  ...EXPRESSION
]);

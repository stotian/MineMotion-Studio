import type { RigBone } from "./Bone";
import type { RigDefinition, RigAttachmentPoint } from "./RigDefinition";
import type { RigPresetId } from "./RigTypes";
import { validateRigDefinition, type RigContractIssue } from "./RigContract";

function playerBones(armWidth: 3 | 4, includeCape = true): RigBone[] {
  const armSize = armWidth === 3 ? 0.3 : 0.4;
  const shoulderOffset = armWidth === 3 ? 0.55 : 0.6;

  return [
    {
      id: "root",
      label: "Root",
      parentId: null,
      size: [0.2, 0.2, 0.2],
      pivot: [0, 0, 0],
      offset: [0, 0, 0],
      selectable: false
    },
    {
      id: "body",
      label: "Body",
      parentId: "root",
      size: [0.8, 1.2, 0.4],
      pivot: [0, 0.6, 0],
      offset: [0, 1.2, 0],
      skinPart: "body"
    },
    {
      id: "head",
      label: "Head",
      parentId: "body",
      size: [0.8, 0.8, 0.8],
      pivot: [0, -0.35, 0],
      offset: [0, 0.98, 0],
      skinPart: "head"
    },
    {
      id: "leftArm",
      label: "Left Upper Arm",
      parentId: "body",
      size: [armSize, 0.6, 0.4],
      pivot: [0, -0.3, 0],
      offset: [-shoulderOffset, 1.2, 0],
      skinPart: "leftArm",
      skinSegment: "upper",
      mirrorOf: "rightArm"
    },
    {
      id: "leftForearm",
      label: "Left Forearm",
      parentId: "leftArm",
      size: [armSize, 0.6, 0.4],
      pivot: [0, -0.3, 0],
      offset: [0, -0.6, 0],
      skinPart: "leftArm",
      skinSegment: "lower",
      mirrorOf: "rightForearm"
    },
    {
      id: "rightArm",
      label: "Right Upper Arm",
      parentId: "body",
      size: [armSize, 0.6, 0.4],
      pivot: [0, -0.3, 0],
      offset: [shoulderOffset, 1.2, 0],
      skinPart: "rightArm",
      skinSegment: "upper",
      mirrorOf: "leftArm"
    },
    {
      id: "rightForearm",
      label: "Right Forearm",
      parentId: "rightArm",
      size: [armSize, 0.6, 0.4],
      pivot: [0, -0.3, 0],
      offset: [0, -0.6, 0],
      skinPart: "rightArm",
      skinSegment: "lower",
      mirrorOf: "leftForearm"
    },
    {
      id: "leftLeg",
      label: "Left Upper Leg",
      parentId: "root",
      size: [0.4, 0.6, 0.4],
      pivot: [0, -0.3, 0],
      offset: [-0.2, 1.12, 0],
      skinPart: "leftLeg",
      skinSegment: "upper",
      mirrorOf: "rightLeg"
    },
    {
      id: "leftLowerLeg",
      label: "Left Lower Leg",
      parentId: "leftLeg",
      size: [0.4, 0.6, 0.4],
      pivot: [0, -0.3, 0],
      offset: [0, -0.6, 0],
      skinPart: "leftLeg",
      skinSegment: "lower",
      mirrorOf: "rightLowerLeg"
    },
    {
      id: "rightLeg",
      label: "Right Upper Leg",
      parentId: "root",
      size: [0.4, 0.6, 0.4],
      pivot: [0, -0.3, 0],
      offset: [0.2, 1.12, 0],
      skinPart: "rightLeg",
      skinSegment: "upper",
      mirrorOf: "leftLeg"
    },
    {
      id: "rightLowerLeg",
      label: "Right Lower Leg",
      parentId: "rightLeg",
      size: [0.4, 0.6, 0.4],
      pivot: [0, -0.3, 0],
      offset: [0, -0.6, 0],
      skinPart: "rightLeg",
      skinSegment: "lower",
      mirrorOf: "leftLowerLeg"
    },
    ...(includeCape
      ? [
          {
            id: "cape",
            label: "Cape",
            parentId: "body",
            size: [0.78, 1.05, 0.05],
            pivot: [0, 0.45, 0],
            offset: [0, 0.12, 0.26],
            skinPart: "cape",
            selectable: true
          } satisfies RigBone
        ]
      : [])
  ];
}

const PLAYER_ATTACHMENT_POINTS: RigAttachmentPoint[] = [
  {
    id: "rightHand",
    label: "Right Hand",
    boneId: "rightForearm",
    offset: [0, -0.66, -0.08],
    rotation: [0, 0, 0]
  },
  {
    id: "leftHand",
    label: "Left Hand",
    boneId: "leftForearm",
    offset: [0, -0.66, -0.08],
    rotation: [0, 0, 0]
  },
  {
    id: "head",
    label: "Head",
    boneId: "head",
    offset: [0, 0.16, 0],
    rotation: [0, 0, 0]
  },
  {
    id: "back",
    label: "Back",
    boneId: "body",
    offset: [0, 0.38, 0.28],
    rotation: [0, 0, 0]
  }
];

function playerDefinition(
  id: RigPresetId,
  name: string,
  description: string,
  armWidthPixels: 3 | 4,
  status: RigDefinition["status"] = "mvp"
): RigDefinition {
  return {
    id,
    name,
    description,
    modelType: armWidthPixels === 3 ? "alex" : "steve",
    armWidthPixels,
    bones: playerBones(armWidthPixels),
    attachmentPoints: PLAYER_ATTACHMENT_POINTS,
    tags: ["player", "minecraft-native"],
    status
  };
}

function humanoidMobDefinition(
  id: RigPresetId,
  name: string,
  description: string,
  scale: { body?: number; limb?: number; head?: number } = {}
): RigDefinition {
  const body = scale.body ?? 1;
  const limb = scale.limb ?? 1;
  const head = scale.head ?? 1;
  return {
    id,
    name,
    description,
    modelType: "mob",
    armWidthPixels: 4,
    bones: playerBones(4, false).map((bone) => ({
      ...bone,
      size: [
        bone.size[0] * (bone.id === "head" ? head : bone.id === "body" ? body : limb),
        bone.size[1] * (bone.id === "head" ? head : bone.id === "body" ? body : limb),
        bone.size[2] * (bone.id === "head" ? head : bone.id === "body" ? body : limb)
      ],
      offset: bone.id === "head" ? [bone.offset[0], bone.offset[1] + (head - 1) * 0.3, bone.offset[2]] : bone.offset
    })),
    attachmentPoints: PLAYER_ATTACHMENT_POINTS,
    tags: ["mob", "minecraft-native", "humanoid"],
    status: "mvp"
  };
}

function quadrupedDefinition(
  id: RigPresetId,
  name: string,
  description: string,
  bodySize: [number, number, number],
  legLength: number,
  headSize: [number, number, number]
): RigDefinition {
  const legs = [
    ["leftArm", "Front Left Leg", -bodySize[0] * 0.34, -bodySize[2] * 0.34, "rightArm"],
    ["rightArm", "Front Right Leg", bodySize[0] * 0.34, -bodySize[2] * 0.34, "leftArm"],
    ["leftLeg", "Back Left Leg", -bodySize[0] * 0.34, bodySize[2] * 0.34, "rightLeg"],
    ["rightLeg", "Back Right Leg", bodySize[0] * 0.34, bodySize[2] * 0.34, "leftLeg"]
  ] as const;
  return {
    id,
    name,
    description,
    modelType: "mob",
    armWidthPixels: 4,
    bones: [
      { id: "root", label: "Root", parentId: null, size: [0.2, 0.2, 0.2], pivot: [0, 0, 0], offset: [0, 0, 0], selectable: false },
      { id: "body", label: "Body", parentId: "root", size: bodySize, pivot: [0, 0, 0], offset: [0, legLength + bodySize[1] * 0.5, 0] },
      { id: "head", label: "Head", parentId: "body", size: headSize, pivot: [0, 0, 0], offset: [0, bodySize[1] * 0.15, -bodySize[2] * 0.62] },
      ...legs.map(([boneId, label, x, z, mirrorOf]) => ({
        id: boneId,
        label,
        parentId: "body",
        size: [0.28, legLength, 0.28] as [number, number, number],
        pivot: [0, -legLength * 0.5, 0] as [number, number, number],
        offset: [x, -bodySize[1] * 0.35, z] as [number, number, number],
        mirrorOf
      }))
    ],
    attachmentPoints: [],
    tags: ["mob", "minecraft-native", "quadruped"],
    status: "mvp"
  };
}

function creeperDefinition(): RigDefinition {
  return {
    ...quadrupedDefinition("creeper", "Creeper", "Four-legged Creeper rig with independent head and legs.", [0.8, 1.0, 0.5], 0.75, [0.8, 0.8, 0.8]),
    tags: ["mob", "minecraft-native", "hostile", "creeper"]
  };
}

function spiderDefinition(): RigDefinition {
  const sides = [-1, 1] as const;
  const bones: RigBone[] = [
    { id: "root", label: "Root", parentId: null, size: [0.2, 0.2, 0.2], pivot: [0, 0, 0], offset: [0, 0, 0], selectable: false },
    { id: "body", label: "Abdomen", parentId: "root", size: [1.1, 0.45, 1.25], pivot: [0, 0, 0], offset: [0, 0.65, 0.25] },
    { id: "head", label: "Head", parentId: "body", size: [0.8, 0.5, 0.65], pivot: [0, 0, 0], offset: [0, 0, -0.9] }
  ];
  for (const side of sides) {
    for (let index = 0; index < 4; index += 1) {
      const left = side < 0;
      const id = `${left ? "left" : "right"}${index < 2 ? "Arm" : "Leg"}${index % 2 === 0 ? "" : "Lower"}`;
      const mirrorOf = `${left ? "right" : "left"}${index < 2 ? "Arm" : "Leg"}${index % 2 === 0 ? "" : "Lower"}`;
      bones.push({
        id,
        label: `${left ? "Left" : "Right"} leg ${index + 1}`,
        parentId: "body",
        size: [0.72, 0.16, 0.16],
        pivot: [side * 0.35, 0, 0],
        offset: [side * 0.58, 0, (index - 1.5) * 0.28],
        mirrorOf
      });
    }
  }
  return {
    id: "spider",
    name: "Spider",
    description: "Eight-legged Minecraft spider rig.",
    modelType: "mob",
    armWidthPixels: 4,
    bones,
    attachmentPoints: [],
    tags: ["mob", "minecraft-native", "arthropod", "hostile"],
    status: "mvp"
  };
}

export const MINECRAFT_RIG_PRESETS: RigDefinition[] = [
  playerDefinition(
    "steve",
    "Steve Classic",
    "Classic Minecraft player rig with 4px-wide arms.",
    4
  ),
  playerDefinition(
    "alex",
    "Alex Slim",
    "Slim Minecraft player rig with 3px-wide arms.",
    3
  ),
  playerDefinition(
    "generic_blocky",
    "Generic Blocky Character",
    "Neutral block character rig for custom skins or placeholders.",
    4,
    "placeholder"
  ),
  playerDefinition(
    "armored_player",
    "Player With Armor Placeholders",
    "Player rig prepared for armor overlay objects.",
    4,
    "placeholder"
  ),
  humanoidMobDefinition("zombie", "Zombie", "Minecraft zombie rig with split arms and legs."),
  humanoidMobDefinition("skeleton", "Skeleton", "Slender skeleton rig prepared for bow animation.", { body: 0.72, limb: 0.55, head: 0.92 }),
  creeperDefinition(),
  humanoidMobDefinition("enderman", "Enderman", "Tall Enderman rig with extended limbs.", { body: 0.75, limb: 1.65, head: 0.92 }),
  humanoidMobDefinition("villager", "Villager", "Villager rig with blocky humanoid controls.", { body: 1.08, limb: 0.92, head: 1.05 }),
  quadrupedDefinition("pig", "Pig", "Minecraft pig quadruped rig.", [0.9, 0.65, 1.15], 0.55, [0.72, 0.62, 0.62]),
  quadrupedDefinition("cow", "Cow", "Minecraft cow quadruped rig.", [1.0, 0.78, 1.35], 0.78, [0.78, 0.72, 0.72]),
  quadrupedDefinition("wolf", "Wolf", "Minecraft wolf quadruped rig.", [0.72, 0.62, 1.05], 0.62, [0.62, 0.62, 0.62]),
  spiderDefinition()
];

export function validateMinecraftRigPresetCatalog(): readonly RigContractIssue[] {
  return Object.freeze(MINECRAFT_RIG_PRESETS.flatMap((definition) =>
    validateRigDefinition(definition).map((entry) => ({
      ...entry,
      path: `${definition.id}.${entry.path}`
    }))
  ));
}

const RIG_CATALOG_ISSUES = validateMinecraftRigPresetCatalog();
if (RIG_CATALOG_ISSUES.length > 0) {
  throw new Error(RIG_CATALOG_ISSUES.map((entry) => `[${entry.code}] ${entry.path}`).join(" "));
}

export function normalizeRigPresetId(presetId: string | undefined): RigPresetId {
  if (presetId === "default_steve") return "steve";
  const match = MINECRAFT_RIG_PRESETS.find((preset) => preset.id === presetId);
  return match?.id ?? "steve";
}

export function getRigDefinition(presetId: string | undefined): RigDefinition {
  const normalized = normalizeRigPresetId(presetId);
  return MINECRAFT_RIG_PRESETS.find((preset) => preset.id === normalized) ?? MINECRAFT_RIG_PRESETS[0];
}

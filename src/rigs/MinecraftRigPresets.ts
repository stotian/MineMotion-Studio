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

function mobPlaceholder(id: RigPresetId, name: string, description: string): RigDefinition {
  return {
    ...playerDefinition(id, name, description, 4, "placeholder"),
    modelType: "mob",
    tags: ["mob", "placeholder"]
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
  mobPlaceholder("zombie", "Zombie", "Zombie-compatible placeholder rig."),
  mobPlaceholder("skeleton", "Skeleton", "Skeleton-compatible placeholder rig."),
  mobPlaceholder("creeper", "Creeper", "Creeper placeholder mapped to core bones."),
  mobPlaceholder("enderman", "Enderman", "Enderman placeholder mapped to core bones.")
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

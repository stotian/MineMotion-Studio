import { createDeterministicId } from "../../core/ids/Id";
import type { MineMotionProject } from "../../project/ProjectFile";
import { RIG_CONTRACT_LIMITS } from "../RigContract";
import { getRigDefinition } from "../MinecraftRigPresets";
import type {
  CharacterAttachment,
  CharacterAttachmentPointId
} from "../RigTypes";

const ATTACHMENT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const ATTACHMENT_KINDS = new Set([
  "placeholder_sword",
  "placeholder_item_cube",
  "obj"
]);

export interface AttachmentValidationIssue {
  code: string;
  characterId: string;
  attachmentId: string;
  message: string;
}

export interface AttachmentCommandResult {
  project: MineMotionProject;
  changed: boolean;
  error: string | null;
}

export interface AttachmentPatch {
  visible?: boolean;
  pointId?: CharacterAttachmentPointId;
}

export function validateProjectAttachments(
  project: MineMotionProject
): AttachmentValidationIssue[] {
  const assetIds = new Set(project.assets.obj.map((asset) => asset.id));
  const issues: AttachmentValidationIssue[] = [];
  for (const character of project.scene.characters) {
    const definition = getRigDefinition(character.rigPreset);
    const points = new Map(
      definition.attachmentPoints.map((point) => [point.id, point])
    );
    const boneIds = new Set(definition.bones.map((bone) => bone.id));
    const attachmentIds = new Set<string>();
    const attachments = character.attachments ?? [];
    if (attachments.length > RIG_CONTRACT_LIMITS.attachments) {
      issues.push(issue(
        "ATTACHMENT_LIMIT_EXCEEDED",
        character.id,
        character.id,
        "Character exceeds the attachment limit."
      ));
    }
    for (const attachment of attachments) {
      if (!ATTACHMENT_ID_PATTERN.test(attachment.id)) {
        issues.push(issue(
          "ATTACHMENT_ID_INVALID",
          character.id,
          attachment.id,
          "Attachment ID is invalid."
        ));
      }
      if (attachmentIds.has(attachment.id)) {
        issues.push(issue(
          "ATTACHMENT_ID_DUPLICATE",
          character.id,
          attachment.id,
          "Attachment ID is duplicated."
        ));
      }
      attachmentIds.add(attachment.id);
      if (!ATTACHMENT_KINDS.has(attachment.kind)) {
        issues.push(issue(
          "ATTACHMENT_KIND_INVALID",
          character.id,
          attachment.id,
          "Attachment kind is unsupported."
        ));
      }
      if (typeof attachment.visible !== "boolean") {
        issues.push(issue(
          "ATTACHMENT_VISIBILITY_INVALID",
          character.id,
          attachment.id,
          "Attachment visibility must be boolean."
        ));
      }
      const point = points.get(attachment.pointId);
      if (!point) {
        issues.push(issue(
          "ATTACHMENT_POINT_MISSING",
          character.id,
          attachment.id,
          "Attachment point is not supported by this rig."
        ));
      } else if (!boneIds.has(point.boneId)) {
        issues.push(issue(
          "ATTACHMENT_BONE_MISSING",
          character.id,
          attachment.id,
          "Attachment point does not resolve to a rig bone."
        ));
      }
      if (attachment.kind === "obj" &&
        (!attachment.assetId || !assetIds.has(attachment.assetId))) {
        issues.push(issue(
          "ATTACHMENT_ASSET_MISSING",
          character.id,
          attachment.id,
          "Attached OBJ asset is missing."
        ));
      }
    }
  }
  return issues;
}

export function updateProjectAttachment(
  project: MineMotionProject,
  characterId: string,
  attachmentId: string,
  patch: AttachmentPatch
): AttachmentCommandResult {
  return updateCharacterAttachments(project, characterId, (attachments) => {
    const index = attachments.findIndex(
      (attachment) => attachment.id === attachmentId
    );
    if (index < 0) {
      return { attachments, error: "ATTACHMENT_MISSING" };
    }
    if (patch.visible !== undefined && typeof patch.visible !== "boolean") {
      return { attachments, error: "ATTACHMENT_VISIBILITY_INVALID" };
    }
    const definition = getRigDefinition(
      project.scene.characters.find(
        (character) => character.id === characterId
      )!.rigPreset
    );
    const pointId = patch.pointId ?? attachments[index].pointId;
    if (!definition.attachmentPoints.some((point) => point.id === pointId)) {
      return { attachments, error: "ATTACHMENT_POINT_INVALID" };
    }
    const updated: CharacterAttachment = {
      ...attachments[index],
      pointId,
      visible: patch.visible ?? attachments[index].visible
    };
    if (attachmentsEqual(attachments[index], updated)) {
      return { attachments, error: "ATTACHMENT_UNCHANGED" };
    }
    const next = [...attachments];
    next[index] = updated;
    return { attachments: next, error: null };
  });
}

export function addProjectObjAttachment(
  project: MineMotionProject,
  characterId: string,
  assetId: string,
  pointId: CharacterAttachmentPointId
): AttachmentCommandResult {
  const asset = project.assets.obj.find((candidate) => candidate.id === assetId);
  if (!asset) return commandFailure(project, "ATTACHMENT_ASSET_MISSING");
  return updateCharacterAttachments(project, characterId, (attachments) => {
    const character = project.scene.characters.find(
      (candidate) => candidate.id === characterId
    )!;
    const definition = getRigDefinition(character.rigPreset);
    if (!definition.attachmentPoints.some((point) => point.id === pointId)) {
      return { attachments, error: "ATTACHMENT_POINT_INVALID" };
    }
    if (attachments.length >= RIG_CONTRACT_LIMITS.attachments) {
      return { attachments, error: "ATTACHMENT_LIMIT_REACHED" };
    }
    const id = createDeterministicId(
      "attachment",
      `${characterId}:${assetId}:${pointId}`
    );
    if (attachments.some((attachment) => attachment.id === id)) {
      return { attachments, error: "ATTACHMENT_UNCHANGED" };
    }
    return {
      attachments: [
        ...attachments,
        {
          id,
          name: asset.name,
          pointId,
          kind: "obj",
          assetId,
          visible: true
        }
      ],
      error: null
    };
  });
}

export function removeProjectAttachment(
  project: MineMotionProject,
  characterId: string,
  attachmentId: string
): AttachmentCommandResult {
  return updateCharacterAttachments(project, characterId, (attachments) => {
    const next = attachments.filter(
      (attachment) => attachment.id !== attachmentId
    );
    return next.length === attachments.length
      ? { attachments, error: "ATTACHMENT_MISSING" }
      : { attachments: next, error: null };
  });
}

function updateCharacterAttachments(
  project: MineMotionProject,
  characterId: string,
  update: (
    attachments: CharacterAttachment[]
  ) => { attachments: CharacterAttachment[]; error: string | null }
): AttachmentCommandResult {
  const character = project.scene.characters.find(
    (candidate) => candidate.id === characterId
  );
  if (!character) return commandFailure(project, "ATTACHMENT_CHARACTER_MISSING");
  if (character.locked) {
    return commandFailure(project, "ATTACHMENT_CHARACTER_LOCKED");
  }
  const attachments = character.attachments ?? [];
  const result = update(attachments);
  if (result.error) return commandFailure(project, result.error);
  if (result.attachments === attachments) {
    return commandFailure(project, "ATTACHMENT_UNCHANGED");
  }
  return {
    project: {
      ...project,
      scene: {
        ...project.scene,
        characters: project.scene.characters.map((candidate) =>
          candidate.id === characterId
            ? { ...candidate, attachments: result.attachments }
            : candidate
        )
      }
    },
    changed: true,
    error: null
  };
}

function attachmentsEqual(
  left: CharacterAttachment,
  right: CharacterAttachment
): boolean {
  return left.id === right.id &&
    left.name === right.name &&
    left.pointId === right.pointId &&
    left.kind === right.kind &&
    left.assetId === right.assetId &&
    left.visible === right.visible;
}

function issue(
  code: string,
  characterId: string,
  attachmentId: string,
  message: string
): AttachmentValidationIssue {
  return { code, characterId, attachmentId, message };
}

function commandFailure(
  project: MineMotionProject,
  error: string
): AttachmentCommandResult {
  return { project, changed: false, error };
}

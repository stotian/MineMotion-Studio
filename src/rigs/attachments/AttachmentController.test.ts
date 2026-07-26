import { describe, expect, it } from "vitest";
import { HistoryStack } from "../../history/HistoryStack";
import {
  loadProjectAutosave,
  saveProjectAutosave
} from "../../project/ProjectAutosave";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import { createMineMotionPackageData } from "../../project/package/MineMotionPackage";
import { PackageReader } from "../../project/package/PackageReader";
import {
  addProjectObjAttachment,
  removeProjectAttachment,
  updateProjectAttachment,
  validateProjectAttachments
} from "./AttachmentController";
import { RIG_CONTRACT_LIMITS } from "../RigContract";

describe("AttachmentController", () => {
  it("adds, edits, and removes an OBJ attachment atomically", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    project.assets.obj.push({
      id: "asset_sword",
      name: "Custom Sword",
      rawObj: "v 0 0 0\nv 0 1 0\nv 1 0 0\nf 1 2 3",
      importedAt: "2026-07-26T00:00:00.000Z"
    });

    const added = addProjectObjAttachment(
      project,
      character.id,
      "asset_sword",
      "rightHand"
    );
    expect(added.changed).toBe(true);
    const attachment = added.project.scene.characters[0].attachments?.at(-1)!;
    expect(attachment).toMatchObject({
      name: "Custom Sword",
      pointId: "rightHand",
      kind: "obj",
      assetId: "asset_sword",
      visible: true
    });
    expect(addProjectObjAttachment(
      added.project,
      character.id,
      "asset_sword",
      "rightHand"
    ).changed).toBe(false);

    const updated = updateProjectAttachment(
      added.project,
      character.id,
      attachment.id,
      { pointId: "leftHand", visible: false }
    );
    expect(updated.project.scene.characters[0].attachments?.at(-1))
      .toMatchObject({ pointId: "leftHand", visible: false });
    expect(updateProjectAttachment(
      updated.project,
      character.id,
      attachment.id,
      { pointId: "leftHand", visible: false }
    ).project).toBe(updated.project);

    const removed = removeProjectAttachment(
      updated.project,
      character.id,
      attachment.id
    );
    expect(removed.changed).toBe(true);
    expect(removed.project.scene.characters[0].attachments)
      .toHaveLength((project.scene.characters[0].attachments?.length ?? 0));
  });

  it("rejects invalid, locked, missing, and over-limit edits", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    const attachment = character.attachments![0];

    expect(addProjectObjAttachment(
      project,
      character.id,
      "missing",
      "rightHand"
    ).error).toBe("ATTACHMENT_ASSET_MISSING");
    expect(updateProjectAttachment(
      project,
      character.id,
      attachment.id,
      { pointId: "tail" as never }
    ).error).toBe("ATTACHMENT_POINT_INVALID");
    character.locked = true;
    expect(removeProjectAttachment(
      project,
      character.id,
      attachment.id
    ).project).toBe(project);
    expect(removeProjectAttachment(
      project,
      "missing",
      attachment.id
    ).error).toBe("ATTACHMENT_CHARACTER_MISSING");

    const crowded = createInitialProject();
    crowded.assets.obj.push({
      id: "asset_extra",
      name: "Extra",
      rawObj: "v 0 0 0\nv 0 1 0\nv 1 0 0\nf 1 2 3",
      importedAt: "2026-07-26T00:00:00.000Z"
    });
    crowded.scene.characters[0].attachments = Array.from(
      { length: RIG_CONTRACT_LIMITS.attachments },
      (_, index) => ({
        id: `attachment_${index}`,
        name: `Attachment ${index}`,
        pointId: "rightHand" as const,
        kind: "placeholder_item_cube" as const,
        visible: false
      })
    );
    expect(addProjectObjAttachment(
      crowded,
      crowded.scene.characters[0].id,
      "asset_extra",
      "rightHand"
    ).error).toBe("ATTACHMENT_LIMIT_REACHED");
  });

  it("reports duplicate IDs, unsupported points, and missing OBJ assets", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    character.attachments = [
      {
        id: "duplicate",
        name: "Missing asset",
        pointId: "tail" as never,
        kind: "obj",
        assetId: "missing",
        visible: true
      },
      {
        id: "duplicate",
        name: "Duplicate",
        pointId: "rightHand",
        kind: "unsupported" as never,
        visible: "yes" as never
      }
    ];
    expect(validateProjectAttachments(project).map((issue) => issue.code))
      .toEqual(expect.arrayContaining([
        "ATTACHMENT_ID_DUPLICATE",
        "ATTACHMENT_POINT_MISSING",
        "ATTACHMENT_ASSET_MISSING",
        "ATTACHMENT_KIND_INVALID",
        "ATTACHMENT_VISIBILITY_INVALID"
      ]));
  });

  it("preserves valid attachments through save, package, autosave, legacy, and history", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    project.assets.obj.push({
      id: "asset_tool",
      name: "Tool",
      rawObj: "v 0 0 0\nv 0 1 0\nv 1 0 0\nf 1 2 3",
      importedAt: "2026-07-26T00:00:00.000Z"
    });
    const attached = addProjectObjAttachment(
      project,
      character.id,
      "asset_tool",
      "back"
    ).project;

    const serialized = ProjectSerializer.parse(
      ProjectSerializer.serialize(attached)
    );
    const packaged = PackageReader.parse(
      JSON.stringify(createMineMotionPackageData(attached))
    );
    const schema9 = ProjectSerializer.parse(
      ProjectSerializer.serializeLegacyV9(attached)
    );
    for (const candidate of [serialized, packaged, schema9]) {
      expect(candidate.scene.characters[0].attachments?.at(-1))
        .toMatchObject({ assetId: "asset_tool", pointId: "back" });
      expect(validateProjectAttachments(candidate)).toEqual([]);
    }

    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      }
    };
    saveProjectAutosave(storage, attached);
    expect(loadProjectAutosave(storage)?.project.scene.characters[0]
      .attachments?.at(-1)?.assetId).toBe("asset_tool");

    const history = new HistoryStack<typeof project>();
    history.push(project, "Before attachment");
    expect(history.undo(attached)?.scene.characters[0].attachments)
      .toHaveLength(project.scene.characters[0].attachments?.length ?? 0);
  });
});

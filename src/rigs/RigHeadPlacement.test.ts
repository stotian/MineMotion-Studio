import { describe, expect, it } from "vitest";
import type { RigBone } from "./Bone";
import { createInitialProject } from "../project/ProjectStore";
import { getRigDefinition } from "./MinecraftRigPresets";

/**
 * Regression guard: the head used to be authored with a negative pivot, which
 * placed the skull entirely inside the torso ("head stuck in the chest").
 * These tests pin the head/torso relationship in root space.
 */

/** Vertical span [bottom, top] of a bone's mesh, in root space. */
function verticalSpan(bones: readonly RigBone[], id: string): [number, number] {
  const byId = new Map(bones.map((bone) => [bone.id, bone]));
  const bone = byId.get(id);
  if (!bone) throw new Error(`Missing bone: ${id}`);

  // A bone's pivot group is placed at `offset` inside its parent's group, and
  // its mesh sits at `pivot` inside that group (see createBoneObject).
  let groupY = 0;
  for (let node: RigBone | undefined = bone; node; node = node.parentId ? byId.get(node.parentId) : undefined) {
    groupY += node.offset[1];
  }
  const centre = groupY + bone.pivot[1];
  const half = bone.size[1] / 2;
  return [centre - half, centre + half];
}

describe("player rig head placement", () => {
  const bones = getRigDefinition("steve").bones;

  it("rests the head on top of the torso instead of inside it", () => {
    const [, torsoTop] = verticalSpan(bones, "body");
    const [headBottom, headTop] = verticalSpan(bones, "head");

    expect(headBottom).toBeCloseTo(torsoTop, 5);
    expect(headTop).toBeGreaterThan(torsoTop);
  });

  it("puts the head pivot at the neck so it turns around the shoulders", () => {
    const [, torsoTop] = verticalSpan(bones, "body");
    const head = bones.find((bone) => bone.id === "head");
    if (!head) throw new Error("Missing head bone");

    // Pivot group y = body offset + head offset (head is parented to body).
    const body = bones.find((bone) => bone.id === "body");
    if (!body) throw new Error("Missing body bone");
    const pivotY = body.offset[1] + head.offset[1];

    expect(pivotY).toBeCloseTo(torsoTop, 5);
  });

  it("stands the default character's feet on the grid", () => {
    const project = createInitialProject();
    const character = project.scene.characters[0];
    // The lowest mesh in rig space is the shin; adding the character's own Y
    // offset must land it on the ground plane, not float it above the grid.
    const [shinBottom] = verticalSpan(bones, "leftLowerLeg");

    expect(character.transform.position[1] + shinBottom).toBeCloseTo(0, 5);
  });

  it("clears the skull with the head attachment point", () => {
    const definition = getRigDefinition("steve");
    const head = bones.find((bone) => bone.id === "head");
    const body = bones.find((bone) => bone.id === "body");
    const point = definition.attachmentPoints.find((candidate) => candidate.id === "head");
    if (!head || !body || !point) throw new Error("Missing head rig data");

    const pivotY = body.offset[1] + head.offset[1];
    const [, headTop] = verticalSpan(bones, "head");

    // Hats hang off the pivot group, so the anchor must sit above the crown.
    expect(pivotY + point.offset[1]).toBeGreaterThanOrEqual(headTop);
  });
});

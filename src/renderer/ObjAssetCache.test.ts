import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialProject } from "../project/ProjectStore";
import type { ImportedObjAsset } from "../project/ProjectFile";
import { disposeThreeObjectTree } from "./ThreeResourceDisposal";
import {
  collectRenderedObjAssetIds,
  ObjAssetCache
} from "./ObjAssetCache";

const TRIANGLE_OBJ = [
  "o Triangle",
  "v 0 0 0",
  "v 1 0 0",
  "v 0 1 0",
  "f 1 2 3"
].join("\n");

function asset(
  id = "obj_a",
  rawObj = TRIANGLE_OBJ
): ImportedObjAsset {
  return {
    id,
    name: id,
    rawObj,
    importedAt: "2026-07-26T00:00:00.000Z"
  };
}

function firstMesh(root: THREE.Object3D): THREE.Mesh {
  let mesh: THREE.Mesh | null = null;
  root.traverse((object) => {
    if (!mesh && object instanceof THREE.Mesh) mesh = object;
  });
  if (!mesh) throw new Error("Expected an OBJ mesh.");
  return mesh;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ObjAssetCache", () => {
  it("parses lazily once and returns independent nodes sharing owned resources", () => {
    const parse = vi.spyOn(OBJLoader.prototype, "parse");
    const cache = new ObjAssetCache();

    expect(cache.size).toBe(0);
    const first = cache.resolve(asset());
    expect(cache.prune([asset()])).toEqual({
      templates: 0,
      geometries: 0,
      materials: 0
    });
    const second = cache.resolve(asset());
    const firstResolvedMesh = firstMesh(first);
    const secondResolvedMesh = firstMesh(second);
    const geometryDispose = vi.spyOn(firstResolvedMesh.geometry, "dispose");
    const material = firstResolvedMesh.material as THREE.Material;
    const materialDispose = vi.spyOn(material, "dispose");

    expect(parse).toHaveBeenCalledOnce();
    expect(second).not.toBe(first);
    expect(secondResolvedMesh).not.toBe(firstResolvedMesh);
    expect(secondResolvedMesh.geometry).toBe(firstResolvedMesh.geometry);
    expect(secondResolvedMesh.material).toBe(material);
    expect(disposeThreeObjectTree(first)).toMatchObject({
      geometries: 0,
      materials: 0
    });
    expect(disposeThreeObjectTree(second)).toMatchObject({
      geometries: 0,
      materials: 0
    });
    expect(geometryDispose).not.toHaveBeenCalled();
    expect(materialDispose).not.toHaveBeenCalled();
    expect(cache.clear()).toEqual({
      templates: 1,
      geometries: 1,
      materials: 1
    });
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(materialDispose).toHaveBeenCalledOnce();
  });

  it("invalidates changed/removed assets and releases the last material", () => {
    const cache = new ObjAssetCache();
    const first = cache.resolve(asset());
    const firstGeometry = firstMesh(first).geometry;
    const firstDispose = vi.spyOn(firstGeometry, "dispose");
    disposeThreeObjectTree(first);
    const changed = asset(
      "obj_a",
      `${TRIANGLE_OBJ}\nv 0 0 1\nf 1 3 4`
    );

    expect(cache.prune([changed])).toEqual({
      templates: 1,
      geometries: 1,
      materials: 1
    });
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(cache.size).toBe(0);

    const replacement = cache.resolve(changed);
    expect(firstMesh(replacement).geometry).not.toBe(firstGeometry);
    disposeThreeObjectTree(replacement);
    expect(cache.prune([])).toEqual({
      templates: 1,
      geometries: 1,
      materials: 1
    });
  });

  it("derives only visible scene and attachment consumers", () => {
    const project = createInitialProject();
    project.scene.importedObjects = [
      {
        id: "visible",
        type: "obj",
        name: "Visible",
        visible: true,
        locked: false,
        metadata: {},
        transform: project.scene.characters[0].transform,
        assetId: "obj_visible"
      },
      {
        id: "hidden",
        type: "obj",
        name: "Hidden",
        visible: false,
        locked: false,
        metadata: {},
        transform: project.scene.characters[0].transform,
        assetId: "obj_hidden"
      }
    ];
    project.scene.characters[0].attachments = [
      {
        id: "attachment_visible",
        name: "Visible attachment",
        kind: "obj",
        pointId: "rightHand",
        visible: true,
        assetId: "obj_attachment"
      },
      {
        id: "attachment_hidden",
        name: "Hidden attachment",
        kind: "obj",
        pointId: "leftHand",
        visible: false,
        assetId: "obj_hidden_attachment"
      }
    ];

    expect([...collectRenderedObjAssetIds(project)].sort()).toEqual([
      "obj_attachment",
      "obj_visible"
    ]);
  });
});

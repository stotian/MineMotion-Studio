import type { ExportSettings } from "../../export/ExportTypes";
import type { MineMotionProject } from "../../project/ProjectFile";

export interface RenderPassMetadata {
  schemaVersion: 1;
  pass: ExportSettings["renderPass"];
  frame: number;
  cameraId: string;
  width: number;
  height: number;
  colorSpace: "srgb" | "linear-data";
  transparent: boolean;
  objectIds?: Record<string, string>;
}

export function createRenderPassMetadata(project: MineMotionProject, settings: ExportSettings, frame = project.animation.currentFrame): RenderPassMetadata {
  const dataPass = settings.renderPass === "depth" || settings.renderPass === "normals" || settings.renderPass === "object-id";
  const objectIds = settings.renderPass === "object-id" ? Object.fromEntries([
    ...project.scene.characters, ...project.scene.cameras, ...project.scene.importedObjects, ...project.scene.lights
  ].map((entity) => [entity.id, entity.name])) : undefined;
  return {
    schemaVersion: 1,
    pass: settings.renderPass,
    frame,
    cameraId: settings.cameraId,
    width: settings.width,
    height: settings.height,
    colorSpace: dataPass ? "linear-data" : "srgb",
    transparent: settings.transparentBackground,
    objectIds
  };
}

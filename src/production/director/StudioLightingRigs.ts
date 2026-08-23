import { createId } from "../../core/ids/Id";
import type { LightEntity, MineMotionProject, Vector3Tuple } from "../../project/ProjectFile";
import { createTransform } from "../../core/scene/SceneTypes";

export const STUDIO_LIGHTING_RIGS = [
  "three-point",
  "moonlight",
  "torch-circle",
  "portal-glow",
  "boss-reveal",
  "silhouette",
  "interior-window",
  "arena"
] as const;
export type StudioLightingRig = (typeof STUDIO_LIGHTING_RIGS)[number];

export interface LightingRigResult {
  project: MineMotionProject;
  changed: boolean;
  lightIds: string[];
  rig: StudioLightingRig;
  error: string | null;
}

interface LightSpec {
  role: string;
  offset: Vector3Tuple;
  color: string;
  intensity: number;
  distance: number;
  castShadow?: boolean;
}

export function createStudioLightingRig(
  project: MineMotionProject,
  rig: StudioLightingRig,
  targetId?: string
): LightingRigResult {
  const target = targetId ? findTarget(project, targetId) : project.scene.characters[0] ?? null;
  const center: Vector3Tuple = target ? [...target.transform.position] : [0, 1.5, 0];
  const specs = specsForRig(rig);
  if (specs.length === 0) return { project, changed: false, lightIds: [], rig, error: "LIGHT_RIG_UNKNOWN" };
  const rigId = createId("studio_light_rig");
  const staleIds = new Set(project.scene.lights.filter((light) => light.metadata.studioRig === rig).map((light) => light.id));
  const lights = specs.map((spec, index) => createLight(rigId, rig, spec, center, index));
  const next = {
    ...project,
    scene: {
      ...project.scene,
      lights: [...project.scene.lights.filter((light) => !staleIds.has(light.id)), ...lights]
    },
    lighting: {
      ...project.lighting,
      shadowsEnabled: true,
      ambientIntensity: ambientForRig(rig)
    },
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
  return { project: next, changed: true, lightIds: lights.map((light) => light.id), rig, error: null };
}

export function removeStudioLightingRigs(project: MineMotionProject): LightingRigResult {
  const removed = project.scene.lights.filter((light) => typeof light.metadata.studioRig === "string");
  if (removed.length === 0) return { project, changed: false, lightIds: [], rig: "three-point", error: "NO_STUDIO_LIGHTS" };
  const removedIds = new Set(removed.map((light) => light.id));
  return {
    project: {
      ...project,
      scene: { ...project.scene, lights: project.scene.lights.filter((light) => !removedIds.has(light.id)) }
    },
    changed: true,
    lightIds: [...removedIds],
    rig: "three-point",
    error: null
  };
}

function createLight(
  rigId: string,
  rig: StudioLightingRig,
  spec: LightSpec,
  center: Vector3Tuple,
  index: number
): LightEntity {
  return {
    id: createId("light"),
    type: "light",
    name: `${label(rig)} · ${spec.role}`,
    visible: true,
    locked: false,
    metadata: {
      generatedBy: "BlockMotion Studio Lighting",
      studioRig: rig,
      studioRigId: rigId,
      lightRole: spec.role,
      distance: spec.distance,
      castShadow: spec.castShadow ?? index === 0
    },
    transform: createTransform({ position: add(center, spec.offset) }),
    intensity: spec.intensity,
    color: spec.color
  };
}

function specsForRig(rig: StudioLightingRig): LightSpec[] {
  switch (rig) {
    case "three-point":
      return [
        { role: "Key", offset: [4, 5, 5], color: "#fff0d2", intensity: 2.8, distance: 22, castShadow: true },
        { role: "Fill", offset: [-4, 3, 3], color: "#b9d8ff", intensity: 1.25, distance: 18 },
        { role: "Rim", offset: [0, 4, -5], color: "#d7e7ff", intensity: 2.1, distance: 18 }
      ];
    case "moonlight":
      return [
        { role: "Moon key", offset: [-5, 8, -6], color: "#86a9ff", intensity: 3.1, distance: 30, castShadow: true },
        { role: "Ground bounce", offset: [2, 0.4, 2], color: "#334d8a", intensity: 0.85, distance: 14 },
        { role: "Cold rim", offset: [5, 4, -2], color: "#b4d5ff", intensity: 1.5, distance: 18 }
      ];
    case "torch-circle":
      return [0, 90, 180, 270].map((angle, index) => ({
        role: `Torch ${index + 1}`,
        offset: orbit(4.5, angle, 1.2),
        color: "#ff8a32",
        intensity: 2.2,
        distance: 11,
        castShadow: index === 0
      }));
    case "portal-glow":
      return [
        { role: "Portal core", offset: [0, 2, -2], color: "#a65cff", intensity: 4.5, distance: 16, castShadow: true },
        { role: "Portal left", offset: [-2.2, 2, -1], color: "#5d7cff", intensity: 2, distance: 13 },
        { role: "Portal right", offset: [2.2, 2, -1], color: "#d56cff", intensity: 2, distance: 13 }
      ];
    case "boss-reveal":
      return [
        { role: "Underlight", offset: [0, -0.3, 1], color: "#ff2f32", intensity: 4.2, distance: 13, castShadow: true },
        { role: "Back crown", offset: [0, 5, -4], color: "#ff7a22", intensity: 3.2, distance: 20 },
        { role: "Side edge", offset: [-4, 2.5, 0], color: "#7c1fff", intensity: 1.8, distance: 16 }
      ];
    case "silhouette":
      return [
        { role: "Hard backlight", offset: [0, 4, -6], color: "#fff4dc", intensity: 6, distance: 28, castShadow: true },
        { role: "Floor glow", offset: [0, 0.2, -2], color: "#ffa24b", intensity: 1.1, distance: 10 }
      ];
    case "interior-window":
      return [
        { role: "Window key", offset: [-5, 4, 2], color: "#d9ecff", intensity: 3.4, distance: 24, castShadow: true },
        { role: "Warm practical", offset: [3, 2, 2], color: "#ffb66d", intensity: 1.8, distance: 12 },
        { role: "Ceiling fill", offset: [0, 5, 0], color: "#fff2d1", intensity: 0.8, distance: 16 }
      ];
    case "arena":
      return [0, 60, 120, 180, 240, 300].map((angle, index) => ({
        role: `Arena ${index + 1}`,
        offset: orbit(8, angle, 6),
        color: index % 2 === 0 ? "#e9f3ff" : "#ffd7a3",
        intensity: 2.7,
        distance: 24,
        castShadow: index === 0
      }));
  }
}

function ambientForRig(rig: StudioLightingRig): number {
  if (rig === "silhouette" || rig === "boss-reveal") return 0.18;
  if (rig === "moonlight" || rig === "portal-glow") return 0.35;
  return 0.55;
}

function findTarget(project: MineMotionProject, id: string) {
  return [...project.scene.characters, ...project.scene.importedObjects].find((entity) => entity.id === id) ?? null;
}

function add(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function orbit(radius: number, degrees: number, y: number): Vector3Tuple {
  const radians = degrees * Math.PI / 180;
  return [Math.sin(radians) * radius, y, Math.cos(radians) * radius];
}

function label(rig: StudioLightingRig): string {
  return rig.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
}

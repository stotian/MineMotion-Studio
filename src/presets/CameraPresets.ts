import type { CameraEntity, TransformData } from "../project/ProjectFile";

export interface CameraPreset {
  id: string;
  name: string;
  description: string;
  fov: number;
  transform: TransformData;
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: "wide-cinematic",
    name: "Wide cinematic",
    description: "Wide establishing shot from above the scene.",
    fov: 55,
    transform: {
      position: [12, 7, 12],
      rotation: [-30, 42, 0],
      scale: [1, 1, 1]
    }
  },
  {
    id: "close-character",
    name: "Close character shot",
    description: "Close camera aimed at a character-scale subject.",
    fov: 35,
    transform: {
      position: [2.2, 2.4, 4],
      rotation: [-10, 24, 0],
      scale: [1, 1, 1]
    }
  },
  {
    id: "low-angle",
    name: "Low angle",
    description: "Low camera looking up for dramatic character poses.",
    fov: 42,
    transform: {
      position: [3, 1.2, 4.5],
      rotation: [-6, 32, 0],
      scale: [1, 1, 1]
    }
  },
  {
    id: "top-down",
    name: "Top-down",
    description: "Orthographic-like top-down layout view using perspective camera.",
    fov: 50,
    transform: {
      position: [0, 16, 0.1],
      rotation: [-90, 0, 0],
      scale: [1, 1, 1]
    }
  },
  {
    id: "orbit-setup",
    name: "Orbit setup",
    description: "Side angle ready for an orbit animation preset.",
    fov: 45,
    transform: {
      position: [9, 5, 0],
      rotation: [-18, 90, 0],
      scale: [1, 1, 1]
    }
  },
  {
    id: "dutch-angle",
    name: "Dutch angle",
    description: "Tilted camera for uneasy dramatic beats.",
    fov: 42,
    transform: {
      position: [6, 3.2, 6],
      rotation: [-18, 45, 12],
      scale: [1, 1, 1]
    }
  },
  {
    id: "chase-camera",
    name: "Chase camera",
    description: "Low trailing shot for movement and action scenes.",
    fov: 58,
    transform: {
      position: [-4, 2.2, 7],
      rotation: [-10, -28, 0],
      scale: [1, 1, 1]
    }
  },
  {
    id: "over-shoulder",
    name: "Over the shoulder",
    description: "Character-focused over-shoulder cinematic framing.",
    fov: 38,
    transform: {
      position: [-1.4, 2.3, 3.2],
      rotation: [-8, -16, 0],
      scale: [1, 1, 1]
    }
  },
  {
    id: "dramatic-zoom",
    name: "Dramatic zoom",
    description: "Compressed lens style setup for zoom-in animation presets.",
    fov: 26,
    transform: {
      position: [0, 2.4, 7.5],
      rotation: [-8, 0, 0],
      scale: [1, 1, 1]
    }
  }
];

export function applyCameraPreset(
  camera: CameraEntity,
  preset: CameraPreset
): CameraEntity {
  return {
    ...camera,
    fov: preset.fov,
    transform: {
      position: [...preset.transform.position],
      rotation: [...preset.transform.rotation],
      scale: [...preset.transform.scale]
    }
  };
}

import type {
  EffectDefinition,
  EffectInstance,
  EffectParameters,
  EffectType
} from "./EffectTypes";

export const BUILTIN_EFFECTS: EffectDefinition[] = [
  {
    type: "lightningStrike",
    name: "Lightning Strike",
    description: "A stylized world-space bolt with optional screen flash.",
    space: "world",
    defaultDurationFrames: 10,
    defaultParameters: {
      color: "#b9e7ff",
      secondaryColor: "#ffffff",
      intensity: 1.2,
      alpha: 0.9,
      radius: 2.5,
      flash: true
    },
    tags: ["vfx", "lightning", "world"]
  },
  {
    type: "impactFrame",
    name: "Impact Frame",
    description: "A short anime-style high-contrast screen punch.",
    space: "screen",
    defaultDurationFrames: 4,
    defaultParameters: {
      color: "#ffffff",
      secondaryColor: "#050507",
      alpha: 0.92,
      contrast: 1.8,
      intensity: 1
    },
    tags: ["screen", "anime", "hit"]
  },
  {
    type: "cameraShake",
    name: "Camera Shake",
    description: "Viewport shake for impacts, explosions, and handheld shots.",
    space: "camera",
    defaultDurationFrames: 18,
    defaultParameters: {
      strength: 0.8,
      frequency: 18,
      decay: 0.8,
      intensity: 1
    },
    tags: ["camera", "motion"]
  },
  {
    type: "flash",
    name: "Flash",
    description: "A color screen flash with fade-out.",
    space: "screen",
    defaultDurationFrames: 12,
    defaultParameters: {
      color: "#ffffff",
      alpha: 0.75,
      intensity: 1
    },
    tags: ["screen", "flash"]
  },
  {
    type: "speedLines",
    name: "Speed Lines",
    description: "Screen-space motion lines for fast action shots.",
    space: "screen",
    defaultDurationFrames: 24,
    defaultParameters: {
      color: "#ffffff",
      alpha: 0.45,
      intensity: 0.9,
      direction: "forward",
      speed: 1
    },
    tags: ["screen", "motion", "anime"]
  },
  {
    type: "shockwave",
    name: "Shockwave",
    description: "A world-space expanding ring.",
    space: "world",
    defaultDurationFrames: 20,
    defaultParameters: {
      color: "#9ed6ff",
      alpha: 0.8,
      radius: 4,
      intensity: 1
    },
    tags: ["world", "ring"]
  },
  {
    type: "glowBurst",
    name: "Glow Burst",
    description: "A particle-like burst of glowing cubes.",
    space: "world",
    defaultDurationFrames: 26,
    defaultParameters: {
      color: "#ffe27a",
      alpha: 0.9,
      count: 18,
      size: 0.16,
      radius: 2,
      intensity: 1
    },
    tags: ["world", "particles"]
  },
  {
    type: "fogPulse",
    name: "Fog Pulse",
    description: "A moody screen-space fog swell.",
    space: "screen",
    defaultDurationFrames: 36,
    defaultParameters: {
      color: "#8aa0bb",
      alpha: 0.36,
      intensity: 0.7
    },
    tags: ["screen", "mood"]
  },
  {
    type: "vignettePulse",
    name: "Vignette Pulse",
    description: "A dark edge pulse for reveals and horror beats.",
    space: "screen",
    defaultDurationFrames: 24,
    defaultParameters: {
      color: "#000000",
      alpha: 0.55,
      intensity: 1
    },
    tags: ["screen", "mood"]
  },
  {
    type: "colorGradeKeyframe",
    name: "Color Grade Keyframe",
    description: "A timeline marker for post-processing changes.",
    space: "screen",
    defaultDurationFrames: 1,
    defaultParameters: {
      contrast: 1.2,
      saturation: 1.1,
      intensity: 1
    },
    tags: ["post", "timeline"]
  },
  {
    type: "cinematicBars",
    name: "Cinematic Bars",
    description: "Screen overlay bars for 16:9 or 2.35:1 framing.",
    space: "screen",
    defaultDurationFrames: 90,
    defaultParameters: {
      barStyle: "2.35:1",
      alpha: 1,
      intensity: 1
    },
    tags: ["screen", "framing"]
  },
  {
    type: "explosionFlash",
    name: "Explosion Flash",
    description: "Warm flash plus shake-friendly timing for explosions.",
    space: "screen",
    defaultDurationFrames: 14,
    defaultParameters: {
      color: "#ffb35c",
      alpha: 0.8,
      intensity: 1.2
    },
    tags: ["screen", "explosion"]
  }
];

export class EffectRegistry {
  private readonly effects = new Map<EffectType, EffectDefinition>();

  constructor(definitions: EffectDefinition[] = BUILTIN_EFFECTS) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  register(definition: EffectDefinition): void {
    this.effects.set(definition.type, definition);
  }

  list(): EffectDefinition[] {
    return Array.from(this.effects.values());
  }

  get(type: EffectType): EffectDefinition | null {
    return this.effects.get(type) ?? null;
  }
}

export const effectRegistry = new EffectRegistry();

export function createEffectInstance(
  type: EffectType,
  options: {
    id: string;
    startFrame: number;
    position?: [number, number, number];
    targetObjectId?: string;
    parameters?: EffectParameters;
  }
): EffectInstance {
  const definition = effectRegistry.get(type);
  if (!definition) {
    throw new Error(`Unknown effect type: ${type}`);
  }

  return {
    id: options.id,
    type,
    name: definition.name,
    startFrame: Math.max(0, Math.round(options.startFrame)),
    durationFrames: definition.defaultDurationFrames,
    position: options.position ?? [0, 2, 0],
    targetObjectId: options.targetObjectId ?? "",
    parameters: {
      ...definition.defaultParameters,
      ...options.parameters
    },
    enabled: true
  };
}

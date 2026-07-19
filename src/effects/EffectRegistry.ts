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
  },
  {
    type: "combatSparks",
    name: "Combat Sparks",
    description: "A compact directional burst for weapon contact.",
    space: "world",
    defaultDurationFrames: 10,
    defaultParameters: { color: "#ffd36a", alpha: 1, count: 28, size: 0.08, radius: 0.18, speed: 5.5, intensity: 1 },
    tags: ["combat", "sparks", "impact"]
  },
  {
    type: "combatImpact",
    name: "Combat Impact",
    description: "A readable contact ring and short light pulse.",
    space: "world",
    defaultDurationFrames: 12,
    defaultParameters: { color: "#fff3c4", alpha: 0.95, radius: 1.5, intensity: 1.4 },
    tags: ["combat", "impact", "ring"]
  },
  {
    type: "swordSlash",
    name: "Sword Slash",
    description: "A tapered arc trail for melee swings.",
    space: "world",
    defaultDurationFrames: 14,
    defaultParameters: { color: "#d8f3ff", alpha: 0.9, radius: 1.8, size: 0.16, intensity: 1 },
    tags: ["combat", "slash", "trail"]
  },
  {
    type: "parryBurst",
    name: "Parry Burst",
    description: "A bright crossed spark and defensive ring.",
    space: "world",
    defaultDurationFrames: 10,
    defaultParameters: { color: "#a9e8ff", secondaryColor: "#ffffff", alpha: 1, radius: 1.3, intensity: 1.8 },
    tags: ["combat", "parry", "spark"]
  },
  {
    type: "groundSlam",
    name: "Ground Slam",
    description: "A heavy ground ring with an outward debris burst.",
    space: "world",
    defaultDurationFrames: 24,
    defaultParameters: { color: "#d8b17a", alpha: 0.9, count: 48, size: 0.14, radius: 4.5, speed: 3.2, intensity: 1.4 },
    tags: ["combat", "slam", "ground"]
  },
  {
    type: "landingDust",
    name: "Landing Dust",
    description: "A low dust puff and subtle landing ring.",
    space: "world",
    defaultDurationFrames: 22,
    defaultParameters: { color: "#b8aa92", alpha: 0.65, count: 36, size: 0.22, radius: 2.2, speed: 1.5, intensity: 0.8 },
    tags: ["combat", "landing", "dust"]
  },
  {
    type: "criticalHit",
    name: "Critical Hit",
    description: "A high-contrast impact burst for decisive strikes.",
    space: "world",
    defaultDurationFrames: 16,
    defaultParameters: { color: "#fff0a6", secondaryColor: "#ff4d6d", alpha: 1, count: 54, size: 0.12, radius: 2.4, speed: 6.2, intensity: 2 },
    tags: ["combat", "critical", "impact"]
  },
  {
    type: "hitStop",
    name: "Hit Stop",
    description: "Briefly holds the animated pose while timeline VFX continue.",
    space: "screen",
    defaultDurationFrames: 3,
    defaultParameters: { color: "#ffffff", alpha: 0.2, intensity: 1 },
    tags: ["combat", "timing", "screen"]
  },
  {
    type: "electricStrike",
    name: "Electric Strike",
    description: "A native vertical lightning strike with a contact flare.",
    space: "world",
    defaultDurationFrames: 12,
    defaultParameters: { color: "#aee8ff", secondaryColor: "#ffffff", alpha: 1, radius: 5, count: 20, size: 0.08, speed: 4, intensity: 1.8 },
    tags: ["electric", "lightning", "strike"]
  },
  {
    type: "electricStorm",
    name: "Electric Storm",
    description: "Multiple deterministic bolts across a wide area.",
    space: "world",
    defaultDurationFrames: 36,
    defaultParameters: { color: "#8fdcff", alpha: 0.9, radius: 7, intensity: 1.4 },
    tags: ["electric", "lightning", "storm"]
  },
  {
    type: "electricBeam",
    name: "Electric Beam",
    description: "A focused jittered energy beam.",
    space: "world",
    defaultDurationFrames: 20,
    defaultParameters: { color: "#9cecff", alpha: 0.95, radius: 6, size: 0.1, intensity: 1.5 },
    tags: ["electric", "beam", "energy"]
  },
  {
    type: "electricAura",
    name: "Electric Aura",
    description: "Orbiting electrical particles and a pulsing ring.",
    space: "world",
    defaultDurationFrames: 48,
    defaultParameters: { color: "#73d7ff", alpha: 0.8, radius: 1.8, count: 34, size: 0.07, speed: 1.2, intensity: 1 },
    tags: ["electric", "aura", "loop"]
  },
  {
    type: "electricCharge",
    name: "Electric Charge",
    description: "A gathering spark field with a bright core pulse.",
    space: "world",
    defaultDurationFrames: 30,
    defaultParameters: { color: "#b9f2ff", alpha: 0.9, radius: 2.4, count: 42, size: 0.09, speed: 1.8, intensity: 2 },
    tags: ["electric", "charge", "power-up"]
  },
  {
    type: "electricSparks",
    name: "Electric Sparks",
    description: "A crisp blue-white electrical spark burst.",
    space: "world",
    defaultDurationFrames: 14,
    defaultParameters: { color: "#d5f7ff", alpha: 1, radius: 0.3, count: 32, size: 0.06, speed: 5, intensity: 1.2 },
    tags: ["electric", "sparks", "burst"]
  },
  {
    type: "chainLightning",
    name: "Chain Lightning",
    description: "A segmented bolt linking several nearby points.",
    space: "world",
    defaultDurationFrames: 18,
    defaultParameters: { color: "#a7e9ff", secondaryColor: "#ffffff", alpha: 0.95, radius: 6, intensity: 1.6 },
    tags: ["electric", "lightning", "chain"]
  },
  {
    type: "electricWeaponTrail",
    name: "Electric Weapon Trail",
    description: "A charged tapered trail for weapon motion.",
    space: "world",
    defaultDurationFrames: 18,
    defaultParameters: { color: "#9be7ff", secondaryColor: "#ffffff", alpha: 0.9, radius: 2, size: 0.13, intensity: 1.3 },
    tags: ["electric", "weapon", "trail"]
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

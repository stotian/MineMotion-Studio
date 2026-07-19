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
  },
  {
    type: "nativeFire", name: "Fire", description: "A warm rising native flame field.", space: "world", defaultDurationFrames: 48,
    defaultParameters: { color: "#ff8a2b", secondaryColor: "#ffd166", alpha: 0.9, radius: 1.2, count: 42, size: 0.16, speed: 1.8, intensity: 1.2 }, tags: ["fire", "flame", "loop"]
  },
  {
    type: "smokePlume", name: "Smoke Plume", description: "A broad rising smoke volume.", space: "world", defaultDurationFrames: 60,
    defaultParameters: { color: "#5f6268", alpha: 0.55, radius: 1.8, count: 48, size: 0.32, speed: 1.1, intensity: 0.8 }, tags: ["fire", "smoke", "plume"]
  },
  {
    type: "nativeExplosion", name: "Native Explosion", description: "A layered flash, blast ring, flame, and debris burst.", space: "world", defaultDurationFrames: 24,
    defaultParameters: { color: "#ff9f43", secondaryColor: "#fff1b8", alpha: 1, radius: 4, count: 64, size: 0.18, speed: 5, intensity: 2 }, tags: ["fire", "explosion", "blast"]
  },
  {
    type: "emberBurst", name: "Ember Burst", description: "Long-lived glowing embers from a fire source.", space: "world", defaultDurationFrames: 36,
    defaultParameters: { color: "#ffb347", alpha: 0.9, radius: 0.8, count: 36, size: 0.07, speed: 2.4, intensity: 1 }, tags: ["fire", "embers", "particles"]
  },
  {
    type: "debrisBurst", name: "Debris Burst", description: "A heavy outward block-debris burst.", space: "world", defaultDurationFrames: 30,
    defaultParameters: { color: "#8b7355", alpha: 0.9, radius: 0.4, count: 44, size: 0.2, speed: 4.2, intensity: 1.3 }, tags: ["explosion", "debris", "impact"]
  },
  {
    type: "dustCloud", name: "Dust Cloud", description: "A soft expanding ground-level dust cloud.", space: "world", defaultDurationFrames: 48,
    defaultParameters: { color: "#b9aa91", alpha: 0.5, radius: 2.6, count: 52, size: 0.3, speed: 1.3, intensity: 0.7 }, tags: ["dust", "smoke", "ground"]
  },
  {
    type: "netherFire", name: "Nether Fire", description: "A deep red-orange Nether flame field.", space: "world", defaultDurationFrames: 48,
    defaultParameters: { color: "#ff4b22", secondaryColor: "#ffb000", alpha: 0.95, radius: 1.3, count: 46, size: 0.15, speed: 1.9, intensity: 1.4 }, tags: ["fire", "nether", "flame"]
  },
  {
    type: "soulFire", name: "Soul Fire", description: "A cyan soul-fire flame field and pulse.", space: "world", defaultDurationFrames: 48,
    defaultParameters: { color: "#35e7e4", secondaryColor: "#b9ffff", alpha: 0.9, radius: 1.3, count: 46, size: 0.14, speed: 1.7, intensity: 1.5 }, tags: ["fire", "soul", "cyan"]
  },
  {
    type: "magicAura", name: "Magic Aura", description: "Layered orbiting energy around a subject.", space: "world", defaultDurationFrames: 48,
    defaultParameters: { color: "#b978ff", secondaryColor: "#f3dcff", alpha: 0.85, radius: 1.8, count: 38, size: 0.08, speed: 1.3, intensity: 1.2 }, tags: ["magic", "aura", "energy"]
  },
  {
    type: "magicBeam", name: "Magic Beam", description: "A focused dual-layer arcane beam.", space: "world", defaultDurationFrames: 24,
    defaultParameters: { color: "#9c6cff", secondaryColor: "#ffffff", alpha: 0.95, radius: 7, size: 0.12, intensity: 1.6 }, tags: ["magic", "beam", "energy"]
  },
  {
    type: "magicProjectile", name: "Magic Projectile", description: "A moving energy core with a luminous trail.", space: "world", defaultDurationFrames: 30,
    defaultParameters: { color: "#7f8cff", secondaryColor: "#dce1ff", alpha: 0.95, radius: 4, size: 0.16, intensity: 1.5 }, tags: ["magic", "projectile", "trail"]
  },
  {
    type: "magicPortal", name: "Magic Portal", description: "Concentric arcane rings with portal sparks.", space: "world", defaultDurationFrames: 60,
    defaultParameters: { color: "#8d4dcc", secondaryColor: "#dfb8ff", alpha: 0.9, radius: 2.5, count: 44, size: 0.08, speed: 1.1, intensity: 1.4 }, tags: ["magic", "portal", "ring"]
  },
  {
    type: "magicTeleport", name: "Magic Teleport", description: "A fast collapsing ring and displacement burst.", space: "world", defaultDurationFrames: 18,
    defaultParameters: { color: "#62d5ff", secondaryColor: "#ffffff", alpha: 1, radius: 2.2, count: 48, size: 0.09, speed: 4, intensity: 1.8 }, tags: ["magic", "teleport", "burst"]
  },
  {
    type: "magicHeal", name: "Magic Heal", description: "A gentle restorative ring and rising motes.", space: "world", defaultDurationFrames: 42,
    defaultParameters: { color: "#65f5a5", secondaryColor: "#e0ffec", alpha: 0.8, radius: 1.8, count: 34, size: 0.1, speed: 1.2, intensity: 1.1 }, tags: ["magic", "heal", "restoration"]
  },
  {
    type: "magicCorruption", name: "Magic Corruption", description: "Dark unstable motes and contracting energy rings.", space: "world", defaultDurationFrames: 48,
    defaultParameters: { color: "#57256f", secondaryColor: "#d04cff", alpha: 0.85, radius: 2.1, count: 42, size: 0.11, speed: 1.5, intensity: 1.5 }, tags: ["magic", "corruption", "dark"]
  },
  {
    type: "magicPowerUp", name: "Magic Power Up", description: "A strong gathering aura, rings, and core pulse.", space: "world", defaultDurationFrames: 36,
    defaultParameters: { color: "#ffd45e", secondaryColor: "#fff7d1", alpha: 0.95, radius: 2.8, count: 56, size: 0.1, speed: 2, intensity: 2 }, tags: ["magic", "power-up", "energy"]
  },
  {
    type: "environmentRain", name: "Rain Field", description: "A dense local rain volume.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#9fc7df", alpha: 0.55, radius: 8, count: 120, size: 0.04, speed: 6, intensity: 1 }, tags: ["environment", "rain", "weather"]
  },
  {
    type: "environmentSnow", name: "Snow Field", description: "A soft drifting local snow volume.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#f4f8ff", alpha: 0.75, radius: 8, count: 96, size: 0.1, speed: 0.8, intensity: 0.8 }, tags: ["environment", "snow", "weather"]
  },
  {
    type: "environmentAsh", name: "Ash Fall", description: "Slow dark ash drifting through the scene.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#69645f", alpha: 0.55, radius: 7, count: 84, size: 0.08, speed: 0.7, intensity: 0.8 }, tags: ["environment", "ash", "weather"]
  },
  {
    type: "environmentFog", name: "Ground Fog", description: "Low expanding fog motes around a location.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#a9b5bf", alpha: 0.3, radius: 5, count: 72, size: 0.4, speed: 0.35, intensity: 0.7 }, tags: ["environment", "fog", "mood"]
  },
  {
    type: "environmentDust", name: "Ambient Dust", description: "Fine dust suspended in a lit scene.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#c6b58f", alpha: 0.45, radius: 6, count: 76, size: 0.06, speed: 0.3, intensity: 0.6 }, tags: ["environment", "dust", "ambient"]
  },
  {
    type: "environmentStorm", name: "Storm Field", description: "Rain, charged air, and intermittent native bolts.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#7796ad", secondaryColor: "#d9f4ff", alpha: 0.65, radius: 9, count: 128, size: 0.05, speed: 7, intensity: 1.4 }, tags: ["environment", "storm", "weather"]
  },
  {
    type: "environmentEnd", name: "End Atmosphere", description: "Purple End motes and spatial energy rings.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#b06cff", secondaryColor: "#e8d4ff", alpha: 0.65, radius: 6, count: 68, size: 0.08, speed: 0.6, intensity: 1 }, tags: ["environment", "end", "motes"]
  },
  {
    type: "environmentNether", name: "Nether Atmosphere", description: "Hot red ash and a low heat pulse.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#8f3c2e", secondaryColor: "#ff8a3d", alpha: 0.55, radius: 6, count: 76, size: 0.09, speed: 0.7, intensity: 1 }, tags: ["environment", "nether", "ash"]
  },
  {
    type: "environmentCave", name: "Cave Drips", description: "Sparse cave droplets and damp motes.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#7da8b5", alpha: 0.55, radius: 5, count: 42, size: 0.07, speed: 1.2, intensity: 0.7 }, tags: ["environment", "cave", "drips"]
  },
  {
    type: "environmentFireflies", name: "Fireflies", description: "Warm floating lights for night scenes.", space: "world", defaultDurationFrames: 120,
    defaultParameters: { color: "#eaff76", secondaryColor: "#fffbd1", alpha: 0.85, radius: 5, count: 36, size: 0.08, speed: 0.35, intensity: 1.1 }, tags: ["environment", "fireflies", "night"]
  },
  {
    type: "nativeScreenFlash", name: "Native Screen Flash", description: "A deterministic full-frame color flash.", space: "screen", defaultDurationFrames: 10,
    defaultParameters: { color: "#ffffff", alpha: 0.75, intensity: 1 }, tags: ["screen", "flash", "cinematic"]
  },
  {
    type: "nativeScreenShake", name: "Native Screen Shake", description: "A deterministic cinematic camera shake.", space: "camera", defaultDurationFrames: 18,
    defaultParameters: { strength: 0.9, frequency: 20, decay: 0.8, intensity: 1 }, tags: ["screen", "camera", "shake"]
  },
  {
    type: "screenGlitch", name: "Screen Glitch", description: "Horizontal slice displacement and color glitch.", space: "screen", defaultDurationFrames: 12,
    defaultParameters: { color: "#55eaff", secondaryColor: "#ff4fd8", alpha: 0.55, strength: 0.7, frequency: 18, intensity: 1 }, tags: ["screen", "glitch", "digital"]
  },
  {
    type: "cinematicFrameBars", name: "Cinematic Frame Bars", description: "Animated cinematic aspect-ratio bars.", space: "screen", defaultDurationFrames: 90,
    defaultParameters: { color: "#000000", alpha: 1, barStyle: "2.35:1", intensity: 1 }, tags: ["screen", "bars", "framing"]
  },
  {
    type: "screenBloom", name: "Screen Bloom", description: "A soft luminous center bloom overlay.", space: "screen", defaultDurationFrames: 24,
    defaultParameters: { color: "#fff4d6", alpha: 0.35, radius: 0.7, intensity: 1.3 }, tags: ["screen", "bloom", "light"]
  },
  {
    type: "nativeVignette", name: "Native Vignette", description: "A controllable dark edge vignette pulse.", space: "screen", defaultDurationFrames: 30,
    defaultParameters: { color: "#000000", alpha: 0.55, intensity: 1 }, tags: ["screen", "vignette", "mood"]
  },
  {
    type: "cinematicFreeze", name: "Cinematic Freeze", description: "Holds the animated pose while cinematic overlays continue.", space: "screen", defaultDurationFrames: 6,
    defaultParameters: { color: "#ffffff", alpha: 0.08, intensity: 1 }, tags: ["screen", "freeze", "timing"]
  },
  {
    type: "colorDrain", name: "Color Drain", description: "Temporarily drains scene saturation for dramatic beats.", space: "screen", defaultDurationFrames: 36,
    defaultParameters: { alpha: 0.8, saturation: 0, intensity: 1 }, tags: ["screen", "color", "desaturate"]
  },
  {
    type: "movementDash", name: "Dash Trail", description: "A fast layered trail and launch ring for directional dashes.", space: "world", defaultDurationFrames: 14,
    defaultParameters: { color: "#d8f4ff", secondaryColor: "#ffffff", alpha: 0.9, radius: 3.5, size: 0.16, speed: 5, intensity: 1.4, direction: "forward" }, tags: ["movement", "dash", "trail"]
  },
  {
    type: "movementWeaponTrail", name: "Weapon Trail", description: "A clean dual-layer trail for swords, axes, and tools.", space: "world", defaultDurationFrames: 18,
    defaultParameters: { color: "#dcecff", secondaryColor: "#ffffff", alpha: 0.9, radius: 2.1, size: 0.14, speed: 3.5, intensity: 1.2, direction: "right" }, tags: ["movement", "weapon", "trail"]
  },
  {
    type: "movementProjectileTrail", name: "Projectile Trail", description: "A luminous tapered projectile path with trailing motes.", space: "world", defaultDurationFrames: 30,
    defaultParameters: { color: "#76d7ff", secondaryColor: "#e8fbff", alpha: 0.9, radius: 5, size: 0.1, count: 32, speed: 4.5, intensity: 1.3, direction: "forward" }, tags: ["movement", "projectile", "trail"]
  },
  {
    type: "movementFootsteps", name: "Footstep Trail", description: "Alternating ground impressions with a compact dust wake.", space: "world", defaultDurationFrames: 36,
    defaultParameters: { color: "#9b876c", secondaryColor: "#d2c0a6", alpha: 0.65, radius: 0.45, size: 0.08, count: 24, speed: 1.2, intensity: 0.8 }, tags: ["movement", "footsteps", "ground"]
  },
  {
    type: "movementRunning", name: "Running Trail", description: "A low wake of speed streaks and kicked-up particles.", space: "world", defaultDurationFrames: 42,
    defaultParameters: { color: "#c9d4dc", secondaryColor: "#ffffff", alpha: 0.65, radius: 3.2, size: 0.09, count: 28, speed: 4, intensity: 1, direction: "forward" }, tags: ["movement", "running", "speed"]
  },
  {
    type: "movementFalling", name: "Falling Trail", description: "A vertical air trail that emphasizes a rapid fall.", space: "world", defaultDurationFrames: 36,
    defaultParameters: { color: "#d8e7ef", secondaryColor: "#ffffff", alpha: 0.6, radius: 4, size: 0.08, count: 36, speed: 5, intensity: 1.1 }, tags: ["movement", "falling", "air"]
  },
  {
    type: "movementFlying", name: "Flying Trail", description: "A broad twin wake for fast aerial movement.", space: "world", defaultDurationFrames: 48,
    defaultParameters: { color: "#8edcff", secondaryColor: "#e5f8ff", alpha: 0.75, radius: 6, size: 0.11, count: 40, speed: 6, intensity: 1.3, direction: "forward" }, tags: ["movement", "flying", "trail"]
  },
  {
    type: "movementElytraTrail", name: "Elytra Trail", description: "Two long Minecraft-native wingtip wakes with air motes.", space: "world", defaultDurationFrames: 60,
    defaultParameters: { color: "#79cfff", secondaryColor: "#f1fbff", alpha: 0.72, radius: 7, size: 0.1, count: 32, speed: 7, intensity: 1.2, direction: "forward" }, tags: ["movement", "elytra", "minecraft"]
  },
  {
    type: "movementEnderPearlTrail", name: "Ender Pearl Trail", description: "A violet teleport projectile trail with an End pulse.", space: "world", defaultDurationFrames: 28,
    defaultParameters: { color: "#7e3fb2", secondaryColor: "#49d8c8", alpha: 0.9, radius: 5, size: 0.1, count: 36, speed: 5, intensity: 1.4, direction: "forward" }, tags: ["movement", "ender-pearl", "minecraft"]
  },
  {
    type: "movementSwimmingTrail", name: "Swimming Trail", description: "A cool bubble wake and ripple for underwater motion.", space: "world", defaultDurationFrames: 48,
    defaultParameters: { color: "#72c7e8", secondaryColor: "#d9f7ff", alpha: 0.65, radius: 3.5, size: 0.1, count: 38, speed: 2.4, intensity: 0.9, direction: "forward" }, tags: ["movement", "swimming", "water"]
  }
];

/** Schema 10 carrier for portable compiled recipes; deliberately not built-in catalog content. */
export const CUSTOM_VFX_EFFECT_DEFINITION: EffectDefinition = {
  type: "customVfx",
  name: "Custom VFX",
  description: "A portable declarative VFX package embedded in schema 10 project data.",
  space: "world",
  defaultDurationFrames: 24,
  defaultParameters: {},
  tags: ["vfx", "custom", "package"]
};

export class EffectRegistry {
  private readonly effects = new Map<EffectType, EffectDefinition>();

  constructor(
    definitions: EffectDefinition[] = [
      ...BUILTIN_EFFECTS,
      CUSTOM_VFX_EFFECT_DEFINITION
    ]
  ) {
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

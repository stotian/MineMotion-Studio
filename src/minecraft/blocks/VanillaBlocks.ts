import type { BlockDefinition } from "../MinecraftWorldTypes";

/**
 * The vanilla block catalogue.
 *
 * Minecraft's block set is built from families — every wood type gets planks,
 * logs, slabs, stairs, fences and so on; every dye colour gets wool, concrete,
 * terracotta and glass. Expanding those families here produces correct ids and
 * stays maintainable, where a hand-written list of a thousand entries would
 * drift and contain typos.
 *
 * Colours are original approximations chosen so blocks are distinguishable in
 * the viewport. They are NOT Mojang's textures: real textures come from a
 * resource pack or the user's own game installation, imported separately.
 */

type Def = Omit<BlockDefinition, "id"> & { id: string };

function block(
  id: string,
  label: string,
  color: string,
  options: { transparent?: boolean; opacity?: number } = {}
): Def {
  return {
    id,
    label,
    color,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  };
}

/** Turns "oak_planks" into "Oak Planks". */
function titleCase(path: string): string {
  return path
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Shifts a hex colour by a signed percentage, for family variations. */
function shade(hex: string, percent: number): string {
  const value = parseInt(hex.slice(1), 16);
  const channel = (offset: number) => {
    const raw = (value >> offset) & 0xff;
    const next = Math.round(raw + (percent / 100) * 255);
    return Math.min(255, Math.max(0, next)).toString(16).padStart(2, "0");
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/* ============================== wood ============================== */

interface WoodType {
  id: string;
  plank: string;
  log: string;
  leaves?: string;
  nether?: boolean;
}

const WOODS: WoodType[] = [
  { id: "oak", plank: "#b8945f", log: "#6e5837", leaves: "#4a8d34" },
  { id: "spruce", plank: "#7a5a34", log: "#4a3418", leaves: "#3d6a35" },
  { id: "birch", plank: "#d7c9a0", log: "#d4d0c6", leaves: "#5ba03c" },
  { id: "jungle", plank: "#b1805c", log: "#5b4322", leaves: "#3fa02c" },
  { id: "acacia", plank: "#ba6c3a", log: "#70603a", leaves: "#6a9b32" },
  { id: "dark_oak", plank: "#4b3418", log: "#3a2a13", leaves: "#3f7a2c" },
  { id: "mangrove", plank: "#7a3a3a", log: "#5a3122", leaves: "#57a03a" },
  { id: "cherry", plank: "#e2b6ae", log: "#3b2224", leaves: "#f0a8c8" },
  { id: "bamboo", plank: "#c8ba45", log: "#7f9142" },
  { id: "pale_oak", plank: "#e5ded4", log: "#6f6a62", leaves: "#a8b39a" },
  { id: "crimson", plank: "#6a344b", log: "#5d2b3a", nether: true },
  { id: "warped", plank: "#2c6d6a", log: "#3a3e5a", nether: true }
];

/** Every shape a wood type produces. */
const WOOD_SHAPES = [
  "planks",
  "slab",
  "stairs",
  "fence",
  "fence_gate",
  "door",
  "trapdoor",
  "button",
  "pressure_plate",
  "sign",
  "wall_sign",
  "hanging_sign"
] as const;

function woodBlocks(): Def[] {
  const out: Def[] = [];
  for (const wood of WOODS) {
    for (const shape of WOOD_SHAPES) {
      const path = shape === "planks" ? `${wood.id}_planks` : `${wood.id}_${shape}`;
      out.push(block(path, titleCase(path), wood.plank));
    }
    // Logs come in four bark variants, plus the nether "stem"/"hyphae" names.
    const stem = wood.nether ? "stem" : "log";
    const wrap = wood.nether ? "hyphae" : "wood";
    out.push(block(`${wood.id}_${stem}`, titleCase(`${wood.id}_${stem}`), wood.log));
    out.push(block(`stripped_${wood.id}_${stem}`, titleCase(`stripped_${wood.id}_${stem}`), shade(wood.log, 12)));
    out.push(block(`${wood.id}_${wrap}`, titleCase(`${wood.id}_${wrap}`), shade(wood.log, -4)));
    out.push(block(`stripped_${wood.id}_${wrap}`, titleCase(`stripped_${wood.id}_${wrap}`), shade(wood.log, 8)));
    if (wood.leaves) {
      out.push(block(`${wood.id}_leaves`, titleCase(`${wood.id}_leaves`), wood.leaves, { transparent: true, opacity: 0.85 }));
      out.push(block(`${wood.id}_sapling`, titleCase(`${wood.id}_sapling`), shade(wood.leaves, 6), { transparent: true, opacity: 0.6 }));
    }
  }
  return out;
}

/* ============================= colours ============================= */

const DYES: Array<{ id: string; color: string }> = [
  { id: "white", color: "#e9ecec" },
  { id: "light_gray", color: "#8e8e86" },
  { id: "gray", color: "#3e4447" },
  { id: "black", color: "#1d1c21" },
  { id: "brown", color: "#7d5230" },
  { id: "red", color: "#b02e26" },
  { id: "orange", color: "#f07613" },
  { id: "yellow", color: "#f8c627" },
  { id: "lime", color: "#80c71f" },
  { id: "green", color: "#5e7c16" },
  { id: "cyan", color: "#169c9c" },
  { id: "light_blue", color: "#3ab3da" },
  { id: "blue", color: "#3c44aa" },
  { id: "purple", color: "#8932b8" },
  { id: "magenta", color: "#c74ebd" },
  { id: "pink", color: "#f38baa" }
];

const DYED_SHAPES: Array<{ suffix: string; shift: number; transparent?: boolean; opacity?: number }> = [
  { suffix: "wool", shift: 0 },
  { suffix: "carpet", shift: 4 },
  { suffix: "concrete", shift: -6 },
  { suffix: "concrete_powder", shift: 8 },
  { suffix: "terracotta", shift: -14 },
  { suffix: "glazed_terracotta", shift: -8 },
  { suffix: "stained_glass", shift: 6, transparent: true, opacity: 0.45 },
  { suffix: "stained_glass_pane", shift: 6, transparent: true, opacity: 0.4 },
  { suffix: "shulker_box", shift: -10 },
  { suffix: "bed", shift: -4 },
  { suffix: "banner", shift: 2 },
  { suffix: "candle", shift: 10, transparent: true, opacity: 0.7 }
];

function dyedBlocks(): Def[] {
  const out: Def[] = [];
  for (const dye of DYES) {
    for (const shape of DYED_SHAPES) {
      const path = `${dye.id}_${shape.suffix}`;
      out.push(
        block(path, titleCase(path), shade(dye.color, shape.shift), {
          transparent: shape.transparent,
          opacity: shape.opacity
        })
      );
    }
  }
  return out;
}

/* ============================== stone ============================== */

interface StoneType {
  id: string;
  color: string;
  shapes: readonly string[];
}

const FULL_SHAPES = ["slab", "stairs", "wall"] as const;

const STONES: StoneType[] = [
  { id: "stone", color: "#7d7d7d", shapes: ["slab", "stairs", "button", "pressure_plate"] },
  { id: "cobblestone", color: "#7a7a7a", shapes: FULL_SHAPES },
  { id: "mossy_cobblestone", color: "#6b7a5c", shapes: FULL_SHAPES },
  { id: "smooth_stone", color: "#9d9d9d", shapes: ["slab"] },
  { id: "stone_bricks", color: "#7a7a7a", shapes: FULL_SHAPES },
  { id: "mossy_stone_bricks", color: "#6f7a63", shapes: FULL_SHAPES },
  { id: "cracked_stone_bricks", color: "#6f6f6f", shapes: [] },
  { id: "chiseled_stone_bricks", color: "#787878", shapes: [] },
  { id: "granite", color: "#9a6a55", shapes: FULL_SHAPES },
  { id: "polished_granite", color: "#a06d58", shapes: ["slab", "stairs"] },
  { id: "diorite", color: "#bfbfbf", shapes: FULL_SHAPES },
  { id: "polished_diorite", color: "#c9c9c9", shapes: ["slab", "stairs"] },
  { id: "andesite", color: "#888a88", shapes: FULL_SHAPES },
  { id: "polished_andesite", color: "#909290", shapes: ["slab", "stairs"] },
  { id: "deepslate", color: "#4f4f52", shapes: [] },
  { id: "cobbled_deepslate", color: "#4a4a4d", shapes: FULL_SHAPES },
  { id: "polished_deepslate", color: "#4b4b4e", shapes: FULL_SHAPES },
  { id: "deepslate_bricks", color: "#464649", shapes: FULL_SHAPES },
  { id: "deepslate_tiles", color: "#3d3d40", shapes: FULL_SHAPES },
  { id: "tuff", color: "#6b6d63", shapes: FULL_SHAPES },
  { id: "polished_tuff", color: "#72746a", shapes: FULL_SHAPES },
  { id: "tuff_bricks", color: "#6a6c62", shapes: FULL_SHAPES },
  { id: "calcite", color: "#dfdfd6", shapes: [] },
  { id: "dripstone_block", color: "#8a6a5b", shapes: [] },
  { id: "sandstone", color: "#dbd3a0", shapes: FULL_SHAPES },
  { id: "smooth_sandstone", color: "#e1d9a8", shapes: ["slab", "stairs"] },
  { id: "cut_sandstone", color: "#dcd4a1", shapes: ["slab"] },
  { id: "chiseled_sandstone", color: "#d8d09c", shapes: [] },
  { id: "red_sandstone", color: "#bf6f36", shapes: FULL_SHAPES },
  { id: "smooth_red_sandstone", color: "#c5753a", shapes: ["slab", "stairs"] },
  { id: "cut_red_sandstone", color: "#bd6d34", shapes: ["slab"] },
  { id: "bricks", color: "#96604a", shapes: FULL_SHAPES },
  { id: "prismarine", color: "#6ba392", shapes: FULL_SHAPES },
  { id: "prismarine_bricks", color: "#63a893", shapes: ["slab", "stairs"] },
  { id: "dark_prismarine", color: "#345b4a", shapes: ["slab", "stairs"] },
  { id: "nether_bricks", color: "#2c161a", shapes: FULL_SHAPES },
  { id: "red_nether_bricks", color: "#460709", shapes: FULL_SHAPES },
  { id: "blackstone", color: "#2a2429", shapes: FULL_SHAPES },
  { id: "polished_blackstone", color: "#31292f", shapes: FULL_SHAPES },
  { id: "polished_blackstone_bricks", color: "#2e2730", shapes: FULL_SHAPES },
  { id: "gilded_blackstone", color: "#3b2c26", shapes: [] },
  { id: "basalt", color: "#4c4a4f", shapes: [] },
  { id: "polished_basalt", color: "#575459", shapes: [] },
  { id: "smooth_basalt", color: "#48464b", shapes: [] },
  { id: "end_stone", color: "#dad9a4", shapes: [] },
  { id: "end_stone_bricks", color: "#d8dba4", shapes: FULL_SHAPES },
  { id: "purpur_block", color: "#a97fa9", shapes: ["slab", "stairs"] },
  { id: "purpur_pillar", color: "#ab82ab", shapes: [] },
  { id: "quartz_block", color: "#ece5dd", shapes: ["slab", "stairs"] },
  { id: "smooth_quartz", color: "#eee8e0", shapes: ["slab", "stairs"] },
  { id: "chiseled_quartz_block", color: "#eae3db", shapes: [] },
  { id: "quartz_bricks", color: "#e9e2da", shapes: [] },
  { id: "quartz_pillar", color: "#ebe4dc", shapes: [] },
  { id: "mud_bricks", color: "#8c6a52", shapes: FULL_SHAPES },
  { id: "resin_bricks", color: "#c8622a", shapes: FULL_SHAPES },
  // Added in 26.2 ("Chaos Cubed"): the sulfur caves biome.
  { id: "cinnabar", color: "#a8322c", shapes: FULL_SHAPES },
  { id: "polished_cinnabar", color: "#b13a33", shapes: FULL_SHAPES },
  { id: "cinnabar_bricks", color: "#9c2f29", shapes: FULL_SHAPES },
  { id: "chiseled_cinnabar", color: "#932c26", shapes: [] },
  { id: "sulfur", color: "#d9c637", shapes: FULL_SHAPES },
  { id: "polished_sulfur", color: "#e0d044", shapes: FULL_SHAPES },
  { id: "sulfur_bricks", color: "#cbb92f", shapes: FULL_SHAPES },
  { id: "chiseled_sulfur", color: "#c2b12c", shapes: [] }
];

function stoneBlocks(): Def[] {
  const out: Def[] = [];
  for (const stone of STONES) {
    out.push(block(stone.id, titleCase(stone.id), stone.color));
    for (const shape of stone.shapes) {
      // "stone_bricks" + "slab" reads as "stone_brick_slab" in Minecraft.
      const base = stone.id.endsWith("bricks") ? stone.id.replace(/bricks$/, "brick") : stone.id;
      const path = `${base}_${shape}`;
      out.push(block(path, titleCase(path), shade(stone.color, shape === "slab" ? 3 : -3)));
    }
  }
  return out;
}

/* ============================== ores =============================== */

const ORES: Array<{ id: string; color: string; deepslate?: boolean; storage?: string }> = [
  { id: "coal", color: "#343434", deepslate: true, storage: "#111111" },
  { id: "iron", color: "#d8af93", deepslate: true, storage: "#d8d8d8" },
  { id: "copper", color: "#c17b52", deepslate: true, storage: "#c1663b" },
  { id: "gold", color: "#fcee4b", deepslate: true, storage: "#f9ec4e" },
  { id: "redstone", color: "#aa0f01", deepslate: true, storage: "#a10000" },
  { id: "emerald", color: "#17dd62", deepslate: true, storage: "#17dd62" },
  { id: "lapis", color: "#1d47a5", deepslate: true, storage: "#1f5cc4" },
  { id: "diamond", color: "#5decf5", deepslate: true, storage: "#5decf5" }
];

function oreBlocks(): Def[] {
  const out: Def[] = [];
  for (const ore of ORES) {
    const oreId = ore.id === "lapis" ? "lapis_ore" : `${ore.id}_ore`;
    out.push(block(oreId, titleCase(oreId), ore.color));
    if (ore.deepslate) {
      const deep = `deepslate_${oreId}`;
      out.push(block(deep, titleCase(deep), shade(ore.color, -12)));
    }
    if (ore.storage) {
      const storage = ore.id === "lapis" ? "lapis_block" : `${ore.id}_block`;
      out.push(block(storage, titleCase(storage), ore.storage));
    }
  }
  out.push(block("raw_iron_block", "Raw Iron Block", "#b1785a"));
  out.push(block("raw_copper_block", "Raw Copper Block", "#9b5f3d"));
  out.push(block("raw_gold_block", "Raw Gold Block", "#e0a028"));
  out.push(block("ancient_debris", "Ancient Debris", "#5b4136"));
  out.push(block("netherite_block", "Netherite Block", "#443a3b"));
  out.push(block("nether_gold_ore", "Nether Gold Ore", "#7a3f28"));
  out.push(block("nether_quartz_ore", "Nether Quartz Ore", "#7a4340"));
  return out;
}

/* =========================== copper family ========================== */

function copperBlocks(): Def[] {
  const stages: Array<{ prefix: string; color: string }> = [
    { prefix: "", color: "#c1663b" },
    { prefix: "exposed_", color: "#a3785f" },
    { prefix: "weathered_", color: "#6f9070" },
    { prefix: "oxidized_", color: "#53a486" }
  ];
  const shapes = ["copper_block", "cut_copper", "cut_copper_slab", "cut_copper_stairs", "chiseled_copper", "copper_grate", "copper_door", "copper_trapdoor", "copper_bulb"];
  const out: Def[] = [];
  for (const stage of stages) {
    for (const shape of shapes) {
      for (const waxed of [false, true]) {
        const path = `${waxed ? "waxed_" : ""}${stage.prefix}${shape}`;
        out.push(block(path, titleCase(path), shade(stage.color, waxed ? 4 : 0)));
      }
    }
  }
  return out;
}

/* ============================ terrain ============================== */

const TERRAIN: Def[] = [
  block("air", "Air", "#000000", { transparent: true, opacity: 0 }),
  block("cave_air", "Cave Air", "#000000", { transparent: true, opacity: 0 }),
  block("void_air", "Void Air", "#000000", { transparent: true, opacity: 0 }),
  block("grass_block", "Grass Block", "#5da545"),
  block("dirt", "Dirt", "#79553a"),
  block("coarse_dirt", "Coarse Dirt", "#77553c"),
  block("rooted_dirt", "Rooted Dirt", "#916d51"),
  block("podzol", "Podzol", "#5a3d20"),
  block("mycelium", "Mycelium", "#6f6265"),
  block("farmland", "Farmland", "#5b3a20"),
  block("dirt_path", "Dirt Path", "#96794a"),
  block("mud", "Mud", "#3c3a3f"),
  block("muddy_mangrove_roots", "Muddy Mangrove Roots", "#43362e"),
  block("clay", "Clay", "#a0a6b4"),
  block("gravel", "Gravel", "#847e7c"),
  block("sand", "Sand", "#dbd3a0"),
  block("red_sand", "Red Sand", "#bf6f36"),
  block("suspicious_sand", "Suspicious Sand", "#d6cd9c"),
  block("suspicious_gravel", "Suspicious Gravel", "#807a78"),
  block("snow", "Snow", "#f0fafa"),
  block("snow_block", "Snow Block", "#f0fafa"),
  block("powder_snow", "Powder Snow", "#f5fdfd"),
  block("ice", "Ice", "#7cabf7", { transparent: true, opacity: 0.7 }),
  block("packed_ice", "Packed Ice", "#7cabf7"),
  block("blue_ice", "Blue Ice", "#6aa4f4"),
  block("frosted_ice", "Frosted Ice", "#87b6f8", { transparent: true, opacity: 0.7 }),
  block("water", "Water", "#3b62c9", { transparent: true, opacity: 0.55 }),
  block("lava", "Lava", "#d45b12"),
  block("bedrock", "Bedrock", "#565656"),
  block("obsidian", "Obsidian", "#0f0a1a"),
  block("crying_obsidian", "Crying Obsidian", "#20114a"),
  block("magma_block", "Magma Block", "#8e3c1a"),
  block("netherrack", "Netherrack", "#6f3634"),
  block("soul_sand", "Soul Sand", "#523b2e"),
  block("soul_soil", "Soul Soil", "#4b3332"),
  block("glowstone", "Glowstone", "#f5c96a"),
  block("shroomlight", "Shroomlight", "#f08a3d"),
  block("warped_nylium", "Warped Nylium", "#2c6d6a"),
  block("crimson_nylium", "Crimson Nylium", "#7a2020"),
  block("moss_block", "Moss Block", "#5a7a35"),
  block("moss_carpet", "Moss Carpet", "#5f8038"),
  block("pale_moss_block", "Pale Moss Block", "#7f8b73"),
  block("sculk", "Sculk", "#0e1c22"),
  block("sculk_catalyst", "Sculk Catalyst", "#123039"),
  block("sculk_shrieker", "Sculk Shrieker", "#1a3b45"),
  block("sculk_sensor", "Sculk Sensor", "#134451"),
  block("sculk_vein", "Sculk Vein", "#11242b", { transparent: true, opacity: 0.6 }),
  block("glass", "Glass", "#c8f0f7", { transparent: true, opacity: 0.35 }),
  block("glass_pane", "Glass Pane", "#c8f0f7", { transparent: true, opacity: 0.3 }),
  block("tinted_glass", "Tinted Glass", "#3a3238", { transparent: true, opacity: 0.6 }),
  block("cobweb", "Cobweb", "#dcdcdc", { transparent: true, opacity: 0.4 }),
  block("slime_block", "Slime Block", "#7ec55d", { transparent: true, opacity: 0.7 }),
  block("honey_block", "Honey Block", "#f9a824", { transparent: true, opacity: 0.75 }),
  block("sponge", "Sponge", "#c7c743"),
  block("wet_sponge", "Wet Sponge", "#a5a83c"),
  block("bone_block", "Bone Block", "#e2ddc8"),
  block("amethyst_block", "Amethyst Block", "#8964c4"),
  block("budding_amethyst", "Budding Amethyst", "#8461c0"),
  block("amethyst_cluster", "Amethyst Cluster", "#a17bd8", { transparent: true, opacity: 0.8 }),
  // 26.2 sulfur caves.
  block("potent_sulfur", "Potent Sulfur", "#efe14a"),
  block("sulfur_spike", "Sulfur Spike", "#d5c033", { transparent: true, opacity: 0.75 })
];

/* ========================== plants & crops ========================== */

const PLANTS: Def[] = [
  block("short_grass", "Short Grass", "#68a34a", { transparent: true, opacity: 0.5 }),
  block("tall_grass", "Tall Grass", "#65a047", { transparent: true, opacity: 0.5 }),
  block("fern", "Fern", "#5f9a44", { transparent: true, opacity: 0.5 }),
  block("large_fern", "Large Fern", "#5c9742", { transparent: true, opacity: 0.5 }),
  block("dead_bush", "Dead Bush", "#946428", { transparent: true, opacity: 0.5 }),
  block("seagrass", "Seagrass", "#37853b", { transparent: true, opacity: 0.5 }),
  block("kelp", "Kelp", "#3c7a2e", { transparent: true, opacity: 0.6 }),
  block("sugar_cane", "Sugar Cane", "#94c069", { transparent: true, opacity: 0.7 }),
  block("bamboo", "Bamboo", "#7f9142", { transparent: true, opacity: 0.7 }),
  block("cactus", "Cactus", "#0f6b1e"),
  block("vine", "Vine", "#3f7a2c", { transparent: true, opacity: 0.6 }),
  block("glow_lichen", "Glow Lichen", "#6f8a72", { transparent: true, opacity: 0.5 }),
  block("lily_pad", "Lily Pad", "#3a7f34", { transparent: true, opacity: 0.8 }),
  block("wheat", "Wheat", "#c5b04a", { transparent: true, opacity: 0.6 }),
  block("carrots", "Carrots", "#e07b1a", { transparent: true, opacity: 0.6 }),
  block("potatoes", "Potatoes", "#c8b45a", { transparent: true, opacity: 0.6 }),
  block("beetroots", "Beetroots", "#8c2f2f", { transparent: true, opacity: 0.6 }),
  block("melon", "Melon", "#6f9a2a"),
  block("pumpkin", "Pumpkin", "#c07316"),
  block("carved_pumpkin", "Carved Pumpkin", "#c07316"),
  block("jack_o_lantern", "Jack o'Lantern", "#d08a24"),
  block("hay_block", "Hay Block", "#c7a01c"),
  block("brown_mushroom", "Brown Mushroom", "#9a7051", { transparent: true, opacity: 0.6 }),
  block("red_mushroom", "Red Mushroom", "#c53c33", { transparent: true, opacity: 0.6 }),
  block("brown_mushroom_block", "Brown Mushroom Block", "#8a6647"),
  block("red_mushroom_block", "Red Mushroom Block", "#c33a30"),
  block("mushroom_stem", "Mushroom Stem", "#cec4b4"),
  block("nether_wart", "Nether Wart", "#7a1a1e", { transparent: true, opacity: 0.6 }),
  block("nether_wart_block", "Nether Wart Block", "#7a1a1e"),
  block("warped_wart_block", "Warped Wart Block", "#16867a"),
  block("chorus_plant", "Chorus Plant", "#69476b", { transparent: true, opacity: 0.8 }),
  block("chorus_flower", "Chorus Flower", "#a08fa0", { transparent: true, opacity: 0.8 }),
  block("sweet_berry_bush", "Sweet Berry Bush", "#3f6a35", { transparent: true, opacity: 0.6 }),
  block("cave_vines", "Cave Vines", "#5f7a33", { transparent: true, opacity: 0.6 }),
  block("spore_blossom", "Spore Blossom", "#c874a8", { transparent: true, opacity: 0.7 }),
  block("big_dripleaf", "Big Dripleaf", "#4d8a3a", { transparent: true, opacity: 0.8 }),
  block("small_dripleaf", "Small Dripleaf", "#4f8c3c", { transparent: true, opacity: 0.7 }),
  block("hanging_roots", "Hanging Roots", "#9a6f52", { transparent: true, opacity: 0.5 }),
  block("pitcher_plant", "Pitcher Plant", "#6a4a8a", { transparent: true, opacity: 0.7 }),
  block("torchflower", "Torchflower", "#e07a2a", { transparent: true, opacity: 0.6 })
];

const FLOWERS = [
  ["dandelion", "#f5e33a"],
  ["poppy", "#c93a2c"],
  ["blue_orchid", "#2ec0e0"],
  ["allium", "#b57ad6"],
  ["azure_bluet", "#d6dbe0"],
  ["red_tulip", "#c3372c"],
  ["orange_tulip", "#e08a2a"],
  ["white_tulip", "#e6e6e6"],
  ["pink_tulip", "#e8a8c8"],
  ["oxeye_daisy", "#e8e8d8"],
  ["cornflower", "#4a6fd0"],
  ["lily_of_the_valley", "#e4e8e0"],
  ["wither_rose", "#20201a"],
  ["sunflower", "#f2c22a"],
  ["lilac", "#b58ac8"],
  ["rose_bush", "#9c2a2a"],
  ["peony", "#d0a8d0"],
  ["pink_petals", "#f0a8c8"],
  ["closed_eyeblossom", "#c8b8a0"],
  ["open_eyeblossom", "#d8c8b0"]
] as const;

function flowerBlocks(): Def[] {
  return FLOWERS.map(([id, color]) =>
    block(id, titleCase(id), color, { transparent: true, opacity: 0.6 })
  );
}

/* ======================= utility & redstone ======================== */

const UTILITY: Def[] = [
  block("crafting_table", "Crafting Table", "#8a6136"),
  block("furnace", "Furnace", "#606060"),
  block("blast_furnace", "Blast Furnace", "#585858"),
  block("smoker", "Smoker", "#5a4a3a"),
  block("chest", "Chest", "#8a6a34"),
  block("trapped_chest", "Trapped Chest", "#8a6a34"),
  block("ender_chest", "Ender Chest", "#123b3b"),
  block("barrel", "Barrel", "#7a5a30"),
  block("anvil", "Anvil", "#48484a"),
  block("chipped_anvil", "Chipped Anvil", "#454547"),
  block("damaged_anvil", "Damaged Anvil", "#424244"),
  block("grindstone", "Grindstone", "#8a8a8a"),
  block("smithing_table", "Smithing Table", "#3d3a40"),
  block("stonecutter", "Stonecutter", "#7a7a7a"),
  block("loom", "Loom", "#a0855a"),
  block("cartography_table", "Cartography Table", "#6a5a45"),
  block("fletching_table", "Fletching Table", "#c0a878"),
  block("brewing_stand", "Brewing Stand", "#7a6a52"),
  block("cauldron", "Cauldron", "#3a3a3c"),
  block("composter", "Composter", "#7a5a34"),
  block("beacon", "Beacon", "#6ee0d8"),
  block("conduit", "Conduit", "#8a7a58"),
  block("lodestone", "Lodestone", "#8a8a8e"),
  block("respawn_anchor", "Respawn Anchor", "#3a1a5a"),
  block("enchanting_table", "Enchanting Table", "#8a2a2a"),
  block("bookshelf", "Bookshelf", "#a07a4a"),
  block("chiseled_bookshelf", "Chiseled Bookshelf", "#a37d4d"),
  block("lectern", "Lectern", "#9a7a48"),
  block("jukebox", "Jukebox", "#5a4030"),
  block("note_block", "Note Block", "#6a4a32"),
  block("bell", "Bell", "#d8a828"),
  block("campfire", "Campfire", "#8a5a2a"),
  block("soul_campfire", "Soul Campfire", "#2a7a8a"),
  block("torch", "Torch", "#f0c060", { transparent: true, opacity: 0.5 }),
  block("soul_torch", "Soul Torch", "#40c0d0", { transparent: true, opacity: 0.5 }),
  block("redstone_torch", "Redstone Torch", "#d02020", { transparent: true, opacity: 0.5 }),
  block("lantern", "Lantern", "#d8a848", { transparent: true, opacity: 0.8 }),
  block("soul_lantern", "Soul Lantern", "#48c0d0", { transparent: true, opacity: 0.8 }),
  block("end_rod", "End Rod", "#e8e0d8", { transparent: true, opacity: 0.7 }),
  block("sea_lantern", "Sea Lantern", "#b0d0c8"),
  block("redstone_lamp", "Redstone Lamp", "#5a3a20"),
  block("ladder", "Ladder", "#a07a48", { transparent: true, opacity: 0.6 }),
  block("scaffolding", "Scaffolding", "#c8a860", { transparent: true, opacity: 0.6 }),
  block("iron_bars", "Iron Bars", "#8a8a8e", { transparent: true, opacity: 0.4 }),
  block("chain", "Chain", "#4a4a52", { transparent: true, opacity: 0.4 }),
  block("iron_door", "Iron Door", "#c0c0c4"),
  block("iron_trapdoor", "Iron Trapdoor", "#bcbcc0"),
  block("tnt", "TNT", "#c03028"),
  block("target", "Target", "#d8c8b0"),
  block("hopper", "Hopper", "#3a3a3c"),
  block("dispenser", "Dispenser", "#6a6a6a"),
  block("dropper", "Dropper", "#6a6a6a"),
  block("observer", "Observer", "#5a5a5c"),
  block("piston", "Piston", "#8a7a5a"),
  block("sticky_piston", "Sticky Piston", "#6a8a4a"),
  block("redstone_block", "Block of Redstone", "#a01010"),
  block("repeater", "Repeater", "#a0a0a0", { transparent: true, opacity: 0.6 }),
  block("comparator", "Comparator", "#a4a4a4", { transparent: true, opacity: 0.6 }),
  block("lever", "Lever", "#7a6a4a", { transparent: true, opacity: 0.5 }),
  block("tripwire_hook", "Tripwire Hook", "#8a7a5a", { transparent: true, opacity: 0.5 }),
  block("daylight_detector", "Daylight Detector", "#8a7a5a"),
  block("rail", "Rail", "#8a7a5a", { transparent: true, opacity: 0.5 }),
  block("powered_rail", "Powered Rail", "#c0a028", { transparent: true, opacity: 0.5 }),
  block("detector_rail", "Detector Rail", "#a08a3a", { transparent: true, opacity: 0.5 }),
  block("activator_rail", "Activator Rail", "#8a5a3a", { transparent: true, opacity: 0.5 }),
  block("spawner", "Monster Spawner", "#25353d", { transparent: true, opacity: 0.7 }),
  block("trial_spawner", "Trial Spawner", "#2a3a45"),
  block("vault", "Vault", "#33414a"),
  block("crafter", "Crafter", "#6a5a48"),
  block("decorated_pot", "Decorated Pot", "#a06a4a"),
  block("flower_pot", "Flower Pot", "#8a5540", { transparent: true, opacity: 0.7 }),
  block("armor_stand", "Armor Stand", "#c8c0a8", { transparent: true, opacity: 0.7 }),
  block("end_portal_frame", "End Portal Frame", "#3a5a4a"),
  block("nether_portal", "Nether Portal", "#7a2ac0", { transparent: true, opacity: 0.6 }),
  block("dragon_egg", "Dragon Egg", "#0d0d13"),
  block("infested_stone", "Infested Stone", "#7a7a7a"),
  block("reinforced_deepslate", "Reinforced Deepslate", "#484a48"),
  block("heavy_core", "Heavy Core", "#3a4048")
];

/** The whole vanilla catalogue, namespaced into "minecraft". */
export function createVanillaBlockCatalogue(): BlockDefinition[] {
  const groups: Def[][] = [
    TERRAIN,
    stoneBlocks(),
    oreBlocks(),
    copperBlocks(),
    woodBlocks(),
    dyedBlocks(),
    PLANTS,
    flowerBlocks(),
    UTILITY
  ];
  const seen = new Set<string>();
  const out: BlockDefinition[] = [];
  for (const group of groups) {
    for (const definition of group) {
      const id = `minecraft:${definition.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ ...definition, id });
    }
  }
  return out;
}

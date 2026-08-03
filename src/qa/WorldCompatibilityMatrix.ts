export interface WorldCompatibilityEntry { family: string; dataVersionRange: string; status: "supported" | "partial" | "unsupported"; notes: string[]; }
export const WORLD_COMPATIBILITY_MATRIX: WorldCompatibilityEntry[] = [
  { family: "Java flattened Anvil", dataVersionRange: "1.13–1.17", status: "partial", notes: ["Continuous and padded block-state storage handled; biome formats vary."] },
  { family: "Java modern Anvil", dataVersionRange: "1.18–current tested fixtures", status: "supported", notes: ["Negative sections, modern palettes, biomes and heightmaps."] },
  { family: "Java custom dimensions", dataVersionRange: "modern", status: "supported", notes: ["Discovered from dimensions/*/region folders."] },
  { family: "Pre-flattening numeric blocks", dataVersionRange: "1.12 and earlier", status: "unsupported", notes: ["Complete numeric ID/meta mapping is intentionally not claimed."] },
  { family: "Bedrock worlds", dataVersionRange: "all", status: "unsupported", notes: ["LevelDB/Bedrock format is outside the Java Anvil importer."] },
  { family: "Modded arbitrary renderers", dataVersionRange: "all", status: "partial", notes: ["Unknown blocks use a visible fallback; arbitrary model/shader code is not executed."] }
];

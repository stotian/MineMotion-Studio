import type {
  BlockbenchAnimation,
  BlockbenchAnimationKeyframe,
  BlockbenchElement,
  BlockbenchGroup,
  BlockbenchModelJson,
  BlockbenchTexture,
  ParsedBlockbenchModel
} from "./BlockbenchTypes";

export const BLOCKBENCH_IMPORT_LIMITS = Object.freeze({
  jsonCharacters: 16_000_000,
  elements: 4_096,
  groups: 1_024,
  groupDepth: 32,
  textures: 256,
  animations: 256,
  animatorsPerAnimation: 128,
  keyframesPerAnimation: 8_192,
  dataPointsPerKeyframe: 2,
  textLength: 256
});

export class BbmodelParser {
  static parse(raw: string): ParsedBlockbenchModel {
    if (raw.length > BLOCKBENCH_IMPORT_LIMITS.jsonCharacters) {
      throw new Error(
        "BLOCKBENCH_FILE_TOO_LARGE: .bbmodel JSON exceeds the import limit."
      );
    }
    let parsed: BlockbenchModelJson;
    try {
      parsed = JSON.parse(raw) as BlockbenchModelJson;
    } catch {
      throw new Error("Blockbench .bbmodel file is not valid JSON.");
    }

    return BbmodelParser.fromJson(parsed);
  }

  static fromJson(parsed: BlockbenchModelJson): ParsedBlockbenchModel {
    const warnings: string[] = [];
    const sourceElements = Array.isArray(parsed.elements)
      ? parsed.elements
      : [];
    const elements = sourceElements
      .filter(isElement)
      .slice(0, BLOCKBENCH_IMPORT_LIMITS.elements);
    if (!Array.isArray(parsed.elements)) {
      warnings.push(
        "BLOCKBENCH_ELEMENTS_MISSING: Imported model contains no element array."
      );
    }
    if (elements.length !== sourceElements.length) {
      warnings.push(
        "BLOCKBENCH_ELEMENTS_SKIPPED: Invalid or excessive cube elements were skipped."
      );
    }
    const sourceGroups = Array.isArray(parsed.outliner)
      ? parsed.outliner.filter(isGroup)
      : Array.isArray(parsed.groups)
        ? parsed.groups.filter(isGroup)
        : [];
    const groupResult = sanitizeGroups(sourceGroups);
    warnings.push(...groupResult.warnings);
    const sourceTextures = Array.isArray(parsed.textures)
      ? parsed.textures
      : [];
    const textures = sourceTextures
      .filter(isTexture)
      .slice(0, BLOCKBENCH_IMPORT_LIMITS.textures);
    if (textures.length !== sourceTextures.length) {
      warnings.push(
        "BLOCKBENCH_TEXTURES_SKIPPED: Invalid or excessive textures were skipped."
      );
    }
    const sourceAnimations = Array.isArray(parsed.animations)
      ? parsed.animations
      : [];
    const animationResult = sanitizeAnimations(sourceAnimations);
    const animations = animationResult.animations;
    warnings.push(...animationResult.warnings);
    if (animations.length !== sourceAnimations.length &&
      !animationResult.warnings.some((warning) =>
        warning.startsWith("BLOCKBENCH_ANIMATIONS_SKIPPED"))) {
      warnings.push(
        "BLOCKBENCH_ANIMATIONS_SKIPPED: Invalid or excessive animations were skipped."
      );
    }
    const rotatedElementCount = elements.filter(hasElementRotation).length;
    const rotatedGroupCount = countRotatedGroups(groupResult.groups);
    const unsupportedFeatures: string[] = [];
    if (textures.length > 0) {
      unsupportedFeatures.push("texture-material-preview");
      warnings.push(
        "BLOCKBENCH_TEXTURE_PREVIEW_UNSUPPORTED: Texture metadata is preserved, but static OBJ preview uses the MineMotion material."
      );
    }
    if (animations.length > 0) {
      unsupportedFeatures.push("animation-mapping-required");
      warnings.push(
        "BLOCKBENCH_ANIMATION_MAPPING_REQUIRED: Animation clips are reported but require rig mapping before import."
      );
    }

    return {
      name: safeText(parsed.name, "Blockbench Model"),
      formatVersion: safeText(parsed.meta?.format_version, "unknown"),
      modelFormat: safeText(parsed.meta?.model_format, "unknown"),
      elements,
      groups: groupResult.groups,
      textures,
      animations,
      report: {
        supportedFeatures: [
          "cube-geometry",
          "nested-groups",
          "element-pivots",
          "group-pivots",
          "static-rotation-bake",
          "texture-metadata",
          "animation-metadata"
        ],
        unsupportedFeatures,
        rotatedElementCount,
        rotatedGroupCount,
        animationNames: animations.map((animation, index) =>
          safeText(animation.name, `Animation ${index + 1}`)
        )
      },
      warnings: [...new Set(warnings)]
    };
  }
}

function isElement(element: BlockbenchElement): element is BlockbenchElement {
  return Boolean(element) &&
    (element.type === undefined || element.type === "cube") &&
    isVector(element.from) &&
    isVector(element.to) &&
    (element.origin === undefined || isVector(element.origin)) &&
    validElementRotation(element.rotation) &&
    (element.inflate === undefined ||
      (Number.isFinite(element.inflate) && Math.abs(element.inflate) <= 1_000));
}

function isVector(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((item) =>
      typeof item === "number" &&
      Number.isFinite(item) &&
      Math.abs(item) <= 1_000_000
    )
  );
}

function validElementRotation(
  value: BlockbenchElement["rotation"]
): boolean {
  if (value === undefined) return true;
  if (isVector(value)) return true;
  return Boolean(value) &&
    (value.axis === undefined ||
      value.axis === "x" ||
      value.axis === "y" ||
      value.axis === "z") &&
    (value.angle === undefined ||
      (Number.isFinite(value.angle) && Math.abs(value.angle) <= 360_000)) &&
    (value.origin === undefined || isVector(value.origin));
}

function isGroup(value: unknown): value is BlockbenchGroup {
  return Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function sanitizeGroups(
  groups: BlockbenchGroup[]
): { groups: BlockbenchGroup[]; warnings: string[] } {
  let count = 0;
  let truncated = false;
  let invalid = false;
  const visit = (
    group: BlockbenchGroup,
    depth: number
  ): BlockbenchGroup | null => {
    if (depth > BLOCKBENCH_IMPORT_LIMITS.groupDepth ||
      count >= BLOCKBENCH_IMPORT_LIMITS.groups) {
      truncated = true;
      return null;
    }
    if ((group.origin !== undefined && !isVector(group.origin)) ||
      (group.rotation !== undefined && !isVector(group.rotation))) {
      invalid = true;
      return null;
    }
    count += 1;
    const children: Array<string | BlockbenchGroup> = [];
    for (const child of group.children ?? []) {
      if (typeof child === "string") {
        if (child.length <= BLOCKBENCH_IMPORT_LIMITS.textLength) {
          children.push(child);
        }
        continue;
      }
      if (!isGroup(child)) {
        invalid = true;
        continue;
      }
      const nested = visit(child, depth + 1);
      if (nested) children.push(nested);
    }
    return {
      ...(typeof group.uuid === "string"
        ? { uuid: safeText(group.uuid, "") }
        : {}),
      name: safeText(group.name, `Group ${count}`),
      ...(group.origin ? { origin: [...group.origin] as [number, number, number] } : {}),
      ...(group.rotation
        ? { rotation: [...group.rotation] as [number, number, number] }
        : {}),
      children
    };
  };
  const sanitized = groups.flatMap((group) => {
    const result = visit(group, 0);
    return result ? [result] : [];
  });
  return {
    groups: sanitized,
    warnings: [
      ...(truncated
        ? ["BLOCKBENCH_GROUPS_TRUNCATED: Group count or depth exceeded the import limit."]
        : []),
      ...(invalid
        ? ["BLOCKBENCH_GROUPS_SKIPPED: Invalid groups were skipped."]
        : [])
    ]
  };
}

function isTexture(value: unknown): value is BlockbenchTexture {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAnimation(value: unknown): value is BlockbenchAnimation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const animation = value as BlockbenchAnimation;
  return (animation.length === undefined ||
    (Number.isFinite(animation.length) &&
      animation.length >= 0 &&
      animation.length <= 86_400)) &&
    (animation.snapping === undefined ||
      (Number.isFinite(animation.snapping) &&
        animation.snapping > 0 &&
        animation.snapping <= 1_000));
}

function sanitizeAnimations(
  values: unknown[]
): { animations: BlockbenchAnimation[]; warnings: string[] } {
  let invalid = false;
  let truncated = values.length > BLOCKBENCH_IMPORT_LIMITS.animations;
  const animations = values
    .slice(0, BLOCKBENCH_IMPORT_LIMITS.animations)
    .flatMap((value) => {
      if (!isAnimation(value)) {
        invalid = true;
        return [];
      }
      const sourceAnimators = value.animators &&
        typeof value.animators === "object" &&
        !Array.isArray(value.animators)
        ? Object.entries(value.animators)
        : [];
      if (sourceAnimators.length >
        BLOCKBENCH_IMPORT_LIMITS.animatorsPerAnimation) {
        truncated = true;
      }
      let keyframeCount = 0;
      const animators: NonNullable<BlockbenchAnimation["animators"]> = {};
      for (const [animatorId, candidate] of sourceAnimators.slice(
        0,
        BLOCKBENCH_IMPORT_LIMITS.animatorsPerAnimation
      )) {
        if (!candidate || typeof candidate !== "object" ||
          Array.isArray(candidate)) {
          invalid = true;
          continue;
        }
        const source = candidate as Record<string, unknown>;
        const sourceKeyframes = Array.isArray(source.keyframes)
          ? source.keyframes
          : [];
        const remaining = Math.max(
          0,
          BLOCKBENCH_IMPORT_LIMITS.keyframesPerAnimation - keyframeCount
        );
        if (sourceKeyframes.length > remaining) truncated = true;
        const keyframes = sourceKeyframes
          .slice(0, remaining)
          .flatMap((keyframe) => {
            const sanitized = sanitizeAnimationKeyframe(keyframe);
            if (!sanitized) {
              invalid = true;
              return [];
            }
            return [sanitized];
          });
        keyframeCount += keyframes.length;
        const safeAnimatorId = safeText(
          animatorId,
          `animator_${Object.keys(animators).length}`
        );
        if (Object.hasOwn(animators, safeAnimatorId)) {
          invalid = true;
          continue;
        }
        animators[safeAnimatorId] = {
          ...(typeof source.name === "string"
            ? { name: safeText(source.name, "") }
            : {}),
          ...(typeof source.type === "string"
            ? { type: safeText(source.type, "") }
            : {}),
          keyframes
        };
        if (keyframeCount >= BLOCKBENCH_IMPORT_LIMITS.keyframesPerAnimation) {
          break;
        }
      }
      return [{
        ...(typeof value.uuid === "string"
          ? { uuid: safeText(value.uuid, "") }
          : {}),
        ...(typeof value.name === "string"
          ? { name: safeText(value.name, "") }
          : {}),
        ...(typeof value.loop === "string" || typeof value.loop === "boolean"
          ? { loop: value.loop }
          : {}),
        ...(value.length !== undefined ? { length: value.length } : {}),
        ...(value.snapping !== undefined ? { snapping: value.snapping } : {}),
        animators
      }];
    });
  return {
    animations,
    warnings: [
      ...(invalid
        ? ["BLOCKBENCH_ANIMATIONS_SKIPPED: Invalid animation data was skipped."]
        : []),
      ...(truncated
        ? ["BLOCKBENCH_ANIMATIONS_TRUNCATED: Animation data exceeded import limits."]
        : [])
    ]
  };
}

function sanitizeAnimationKeyframe(
  value: unknown
): BlockbenchAnimationKeyframe | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (typeof source.time !== "number" ||
    !Number.isFinite(source.time) ||
    source.time < 0 ||
    source.time > 86_400) {
    return null;
  }
  const dataPoints = Array.isArray(source.data_points)
    ? source.data_points
        .slice(0, BLOCKBENCH_IMPORT_LIMITS.dataPointsPerKeyframe)
        .filter((entry): entry is Record<string, unknown> =>
          Boolean(entry) &&
          typeof entry === "object" &&
          !Array.isArray(entry)
        )
        .map((entry) => ({ x: entry.x, y: entry.y, z: entry.z }))
    : [];
  return {
    ...(typeof source.uuid === "string"
      ? { uuid: safeText(source.uuid, "") }
      : {}),
    ...(typeof source.channel === "string"
      ? { channel: safeText(source.channel, "") }
      : {}),
    time: source.time,
    ...(typeof source.interpolation === "string"
      ? { interpolation: safeText(source.interpolation, "") }
      : {}),
    data_points: dataPoints
  };
}

function hasElementRotation(element: BlockbenchElement): boolean {
  if (Array.isArray(element.rotation)) {
    return element.rotation.some((value) => value !== 0);
  }
  return Boolean(element.rotation?.angle);
}

function countRotatedGroups(groups: readonly BlockbenchGroup[]): number {
  return groups.reduce((count, group) =>
    count +
    (group.rotation?.some((value) => value !== 0) ? 1 : 0) +
    countRotatedGroups(
      (group.children ?? []).filter(isGroup)
    ), 0);
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0
    ? value.slice(0, BLOCKBENCH_IMPORT_LIMITS.textLength)
    : fallback;
}

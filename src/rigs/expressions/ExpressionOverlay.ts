import type {
  CharacterExpressionOverlay,
  CharacterExpressionPreset
} from "../RigTypes";

export const CHARACTER_EXPRESSION_PRESETS = Object.freeze([
  "blink",
  "anger",
  "sadness",
  "confidence",
  "surprise",
  "fear"
] as const satisfies readonly CharacterExpressionPreset[]);

export const EXPRESSION_OVERLAY_LIMITS = Object.freeze({
  minimumIntensity: 0,
  maximumIntensity: 1,
  maximumDescriptors: 5
});

export type ExpressionOverlayTone = "dark" | "light" | "mouth";

export interface ExpressionOverlayDescriptor {
  id: string;
  position: readonly [number, number];
  size: readonly [number, number];
  rotationDegrees: number;
  tone: ExpressionOverlayTone;
}

export function sanitizeCharacterExpression(
  value: unknown
): CharacterExpressionOverlay | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const source = value as Partial<CharacterExpressionOverlay>;
  if (source.enabled !== true) return undefined;
  if (!CHARACTER_EXPRESSION_PRESETS.includes(
    source.preset as CharacterExpressionPreset
  ) ||
    typeof source.intensity !== "number" ||
    !Number.isFinite(source.intensity)) {
    return undefined;
  }
  const preset = source.preset as CharacterExpressionPreset;
  const intensity = Math.min(1, Math.max(0, source.intensity));
  return { enabled: true, preset, intensity };
}

export function resolveExpressionOverlay(
  value: unknown
): readonly ExpressionOverlayDescriptor[] {
  const expression = sanitizeCharacterExpression(value);
  if (!expression || expression.intensity <= 0) return Object.freeze([]);
  const amount = expression.intensity;
  const descriptors = expressionDescriptors(expression.preset, amount)
    .slice(0, EXPRESSION_OVERLAY_LIMITS.maximumDescriptors)
    .map((descriptor) => Object.freeze({
      ...descriptor,
      position: Object.freeze([
        descriptor.position[0],
        descriptor.position[1]
      ]) as readonly [number, number],
      size: Object.freeze([
        descriptor.size[0],
        descriptor.size[1]
      ]) as readonly [number, number]
    }));
  return Object.freeze(descriptors);
}

function expressionDescriptors(
  preset: CharacterExpressionPreset,
  amount: number
): ExpressionOverlayDescriptor[] {
  if (preset === "blink") {
    return [
      bar("left-eye", -0.19, 0.08, 0.18, 0.025 + amount * 0.025, 0, "dark"),
      bar("right-eye", 0.19, 0.08, 0.18, 0.025 + amount * 0.025, 0, "dark")
    ];
  }
  if (preset === "anger") {
    return [
      bar("left-brow", -0.19, 0.2, 0.2, 0.035, -22 * amount, "dark"),
      bar("right-brow", 0.19, 0.2, 0.2, 0.035, 22 * amount, "dark"),
      bar("mouth", 0, -0.2, 0.25, 0.035 + 0.02 * amount, 0, "mouth")
    ];
  }
  if (preset === "sadness") {
    return [
      bar("left-brow", -0.19, 0.21, 0.2, 0.035, 20 * amount, "dark"),
      bar("right-brow", 0.19, 0.21, 0.2, 0.035, -20 * amount, "dark"),
      bar("mouth-left", -0.07, -0.19, 0.14, 0.035, -16 * amount, "mouth"),
      bar("mouth-right", 0.07, -0.19, 0.14, 0.035, 16 * amount, "mouth")
    ];
  }
  if (preset === "confidence") {
    return [
      bar("left-brow", -0.19, 0.2, 0.2, 0.035, -8 * amount, "dark"),
      bar("right-brow", 0.19, 0.23, 0.2, 0.035, 14 * amount, "dark"),
      bar("smile-left", -0.07, -0.18, 0.14, 0.035, 12 * amount, "mouth"),
      bar("smile-right", 0.07, -0.18, 0.14, 0.035, -12 * amount, "mouth")
    ];
  }
  if (preset === "surprise") {
    return [
      bar("left-brow", -0.19, 0.25, 0.2, 0.035, 0, "dark"),
      bar("right-brow", 0.19, 0.25, 0.2, 0.035, 0, "dark"),
      bar("left-eye", -0.19, 0.08, 0.1, 0.1, 0, "light"),
      bar("right-eye", 0.19, 0.08, 0.1, 0.1, 0, "light"),
      bar("mouth", 0, -0.2, 0.11 + 0.05 * amount, 0.12 + 0.06 * amount, 0, "mouth")
    ];
  }
  return [
    bar("left-brow", -0.19, 0.23, 0.2, 0.035, 18 * amount, "dark"),
    bar("right-brow", 0.19, 0.23, 0.2, 0.035, -18 * amount, "dark"),
    bar("left-eye", -0.19, 0.07, 0.12, 0.09, 0, "light"),
    bar("right-eye", 0.19, 0.07, 0.12, 0.09, 0, "light"),
    bar("mouth", 0, -0.2, 0.1 + 0.04 * amount, 0.11 + 0.05 * amount, 0, "mouth")
  ];
}

function bar(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotationDegrees: number,
  tone: ExpressionOverlayTone
): ExpressionOverlayDescriptor {
  return {
    id,
    position: [x, y],
    size: [width, height],
    rotationDegrees,
    tone
  };
}

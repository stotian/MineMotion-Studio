export interface UltraAnimationKey { frame: number; value: number; interpolation: "constant" | "linear" | "bezier"; }
export interface UltraAnimationChannel { id: string; keys: UltraAnimationKey[]; muted: boolean; }
export interface UltraNlaStrip { id: string; startFrame: number; endFrame: number; sourceStart: number; sourceEnd: number; weight: number; additive: boolean; }
export interface UltraConstraintInput { id: string; kind: "copy" | "limit" | "look-at" | "ik"; weight: number; value: number; minimum?: number; maximum?: number; }

export function listDopeSheetKeys(channels: readonly UltraAnimationChannel[], startFrame: number, endFrame: number): Array<{ channelId: string; key: UltraAnimationKey }> {
  return channels.filter((channel) => !channel.muted).flatMap((channel) => channel.keys
    .filter((key) => key.frame >= startFrame && key.frame <= endFrame)
    .map((key) => ({ channelId: channel.id, key: { ...key } })))
    .sort((a, b) => a.key.frame - b.key.frame || a.channelId.localeCompare(b.channelId));
}

export function sampleAnimationCurve(keys: readonly UltraAnimationKey[], frame: number): number {
  if (keys.length === 0) return 0;
  const sorted = [...keys].sort((a, b) => a.frame - b.frame);
  if (frame <= sorted[0].frame) return sorted[0].value;
  if (frame >= sorted.at(-1)!.frame) return sorted.at(-1)!.value;
  const rightIndex = sorted.findIndex((key) => key.frame >= frame);
  const left = sorted[rightIndex - 1]; const right = sorted[rightIndex];
  if (left.interpolation === "constant") return left.value;
  const t = (frame - left.frame) / Math.max(1e-9, right.frame - left.frame);
  const eased = left.interpolation === "bezier" ? t * t * (3 - 2 * t) : t;
  return left.value + (right.value - left.value) * eased;
}

export function sampleNlaStrips(strips: readonly UltraNlaStrip[], frame: number, sourceSampler: (sourceFrame: number, stripId: string) => number): number {
  let result = 0; let totalOverrideWeight = 0;
  for (const strip of strips.filter((item) => frame >= item.startFrame && frame <= item.endFrame).sort((a, b) => a.id.localeCompare(b.id))) {
    const t = (frame - strip.startFrame) / Math.max(1, strip.endFrame - strip.startFrame);
    const sourceFrame = strip.sourceStart + (strip.sourceEnd - strip.sourceStart) * t;
    const value = sourceSampler(sourceFrame, strip.id);
    const weight = clamp(strip.weight, 0, 1);
    if (strip.additive) result += value * weight;
    else { result += value * weight; totalOverrideWeight += weight; }
  }
  return totalOverrideWeight > 1 ? result / totalOverrideWeight : result;
}

export function evaluateConstraintStack(baseValue: number, constraints: readonly UltraConstraintInput[]): number {
  return constraints.reduce((value, constraint) => {
    const weight = clamp(constraint.weight, 0, 1);
    const target = constraint.kind === "limit"
      ? clamp(value, constraint.minimum ?? -Infinity, constraint.maximum ?? Infinity)
      : constraint.value;
    return value + (target - value) * weight;
  }, baseValue);
}

export function evaluateSafeDriver(expression: string, variables: Readonly<Record<string, number>>): number {
  const tokens = expression.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/]/g) ?? [];
  if (tokens.join("") !== expression.replace(/\s+/g, "")) throw new Error("DRIVER_TOKEN_INVALID");
  const output: Array<number | string> = []; const operators: string[] = [];
  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  for (const token of tokens) {
    if (/^\d/.test(token)) output.push(Number(token));
    else if (/^[A-Za-z_]/.test(token)) {
      if (!(token in variables) || !Number.isFinite(variables[token])) throw new Error(`DRIVER_VARIABLE_INVALID:${token}`);
      output.push(variables[token]);
    } else if (token === "(") operators.push(token);
    else if (token === ")") {
      while (operators.at(-1) !== "(") { const operator = operators.pop(); if (!operator) throw new Error("DRIVER_PAREN_INVALID"); output.push(operator); }
      operators.pop();
    } else {
      while (operators.length && operators.at(-1) !== "(" && precedence[operators.at(-1)!] >= precedence[token]) output.push(operators.pop()!);
      operators.push(token);
    }
  }
  while (operators.length) { const operator = operators.pop()!; if (operator === "(") throw new Error("DRIVER_PAREN_INVALID"); output.push(operator); }
  const stack: number[] = [];
  for (const token of output) {
    if (typeof token === "number") stack.push(token);
    else { const right = stack.pop(); const left = stack.pop(); if (left === undefined || right === undefined) throw new Error("DRIVER_STACK_INVALID"); stack.push(applyOperator(token, left, right)); }
  }
  if (stack.length !== 1 || !Number.isFinite(stack[0])) throw new Error("DRIVER_RESULT_INVALID");
  return stack[0];
}

export function switchIkFk(ikPose: readonly number[], fkPose: readonly number[], weight: number): number[] {
  const size = Math.max(ikPose.length, fkPose.length); const t = clamp(weight, 0, 1);
  return Array.from({ length: size }, (_, index) => (fkPose[index] ?? 0) + ((ikPose[index] ?? 0) - (fkPose[index] ?? 0)) * t);
}

export function applyPoseAsset(basePose: Readonly<Record<string, number>>, asset: Readonly<Record<string, number>>, weight: number, mask: ReadonlySet<string> = new Set()): Record<string, number> {
  const result = { ...basePose }; const t = clamp(weight, 0, 1);
  for (const [channel, value] of Object.entries(asset)) {
    if (mask.size > 0 && !mask.has(channel)) continue;
    result[channel] = (result[channel] ?? 0) + (value - (result[channel] ?? 0)) * t;
  }
  return result;
}

export function evaluateMorphChannels(channels: Readonly<Record<string, number>>, limits: Readonly<Record<string, readonly [number, number]>>): Record<string, number> {
  return Object.fromEntries(Object.entries(channels).sort(([a], [b]) => a.localeCompare(b)).map(([id, value]) => [id, clamp(value, limits[id]?.[0] ?? 0, limits[id]?.[1] ?? 1)]));
}

export function retimeAnimationKeys(keys: readonly UltraAnimationKey[], sourceRange: readonly [number, number], targetRange: readonly [number, number]): UltraAnimationKey[] {
  const sourceDuration = Math.max(1e-9, sourceRange[1] - sourceRange[0]);
  return keys.map((key) => ({ ...key, frame: targetRange[0] + (key.frame - sourceRange[0]) / sourceDuration * (targetRange[1] - targetRange[0]) })).sort((a, b) => a.frame - b.frame);
}

export function cleanAnimationCurve(keys: readonly UltraAnimationKey[], tolerance: number): UltraAnimationKey[] {
  if (keys.length <= 2) return keys.map((key) => ({ ...key }));
  const sorted = [...keys].sort((a, b) => a.frame - b.frame); const result = [sorted[0]];
  for (let index = 1; index < sorted.length - 1; index += 1) {
    const previous = result.at(-1)!; const current = sorted[index]; const next = sorted[index + 1];
    const expected = previous.value + (next.value - previous.value) * ((current.frame - previous.frame) / Math.max(1e-9, next.frame - previous.frame));
    if (Math.abs(current.value - expected) > Math.max(0, tolerance)) result.push(current);
  }
  result.push(sorted.at(-1)!); return result.map((key) => ({ ...key }));
}

function applyOperator(operator: string, left: number, right: number): number {
  if (operator === "+") return left + right; if (operator === "-") return left - right; if (operator === "*") return left * right;
  if (operator === "/") { if (Math.abs(right) < 1e-12) throw new Error("DRIVER_DIVIDE_BY_ZERO"); return left / right; }
  throw new Error(`DRIVER_OPERATOR_INVALID:${operator}`);
}
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum)); }

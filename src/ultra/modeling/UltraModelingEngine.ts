export type UltraModelOperationKind = "translate" | "scale" | "mirror" | "array" | "boolean" | "palette-replace";
export interface UltraModelPoint { id: string; position: readonly [number, number, number]; material: string; selected: boolean; }
export interface UltraModelOperation { id: string; kind: UltraModelOperationKind; values: readonly number[]; enabled: boolean; }
export interface UltraGeometryNode { id: string; kind: "input" | "transform" | "scatter" | "filter" | "output"; inputIds: string[]; parameters: Record<string, number>; }

export function evaluateModelingStack(points: readonly UltraModelPoint[], operations: readonly UltraModelOperation[]): UltraModelPoint[] {
  return operations.filter((operation) => operation.enabled).reduce((current, operation) => applyOperation(current, operation), points.map(copyPoint));
}

export function snapModelPoint(point: UltraModelPoint, increment = 1): UltraModelPoint {
  const step = Math.max(1 / 1024, Math.abs(increment));
  return { ...point, position: point.position.map((value) => Math.round(value / step) * step) as unknown as readonly [number, number, number] };
}

export function validateModifierGraph(operations: readonly UltraModelOperation[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const operation of operations) {
    if (!operation.id) errors.push("MODIFIER_ID_MISSING");
    if (ids.has(operation.id)) errors.push("MODIFIER_ID_DUPLICATE");
    ids.add(operation.id);
    if (operation.values.some((value) => !Number.isFinite(value))) errors.push("MODIFIER_VALUE_INVALID");
  }
  return [...new Set(errors)];
}

export function evaluateGeometryNodes(nodes: readonly UltraGeometryNode[], sourceCount: number, seed: number): { count: number; orderedNodeIds: string[]; checksum: number } {
  const ordered = topologicalOrder(nodes);
  let count = Math.max(0, Math.round(sourceCount));
  let checksum = seed >>> 0;
  for (const node of ordered) {
    if (node.kind === "scatter") count = Math.min(1_000_000, count * Math.max(1, Math.round(node.parameters.density ?? 1)));
    if (node.kind === "filter") count = Math.round(count * clamp(node.parameters.ratio ?? 1, 0, 1));
    checksum = mix(checksum, hash(node.id) ^ count);
  }
  return { count, orderedNodeIds: ordered.map((node) => node.id), checksum };
}

export function instantiateNodeGroup(nodes: readonly UltraGeometryNode[], prefix: string): UltraGeometryNode[] {
  const mapping = new Map(nodes.map((node) => [node.id, `${prefix}:${node.id}`]));
  return nodes.map((node) => ({ ...node, id: mapping.get(node.id)!, inputIds: node.inputIds.map((id) => mapping.get(id) ?? id), parameters: { ...node.parameters } }));
}

export function scatterDeterministic(count: number, bounds: readonly [number, number, number], seed: number): Array<readonly [number, number, number]> {
  return Array.from({ length: Math.max(0, Math.min(100_000, Math.round(count))) }, (_, index) => [
    random01(seed, index, 0) * bounds[0], random01(seed, index, 1) * bounds[1], random01(seed, index, 2) * bounds[2]
  ] as const);
}

export function updateSelectionSet(points: readonly UltraModelPoint[], ids: ReadonlySet<string>, mode: "replace" | "add" | "subtract"): UltraModelPoint[] {
  return points.map((point) => ({
    ...point,
    selected: mode === "replace" ? ids.has(point.id) : mode === "add" ? point.selected || ids.has(point.id) : point.selected && !ids.has(point.id)
  }));
}

export function assignMaterial(points: readonly UltraModelPoint[], selectedOnly: boolean, material: string): UltraModelPoint[] {
  return points.map((point) => selectedOnly && !point.selected ? copyPoint(point) : { ...copyPoint(point), material });
}

export function diagnoseTopology(points: readonly UltraModelPoint[]): { duplicateIds: string[]; nonFiniteIds: string[]; offGridIds: string[] } {
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();
  const nonFiniteIds: string[] = [];
  const offGridIds: string[] = [];
  for (const point of points) {
    if (seen.has(point.id)) duplicateIds.add(point.id); else seen.add(point.id);
    if (point.position.some((value) => !Number.isFinite(value))) nonFiniteIds.push(point.id);
    if (point.position.some((value) => Math.abs(value - Math.round(value)) > 1e-8)) offGridIds.push(point.id);
  }
  return { duplicateIds: [...duplicateIds], nonFiniteIds, offGridIds };
}

export function createLodPlan(sourceCount: number, distances: readonly number[]): Array<{ distance: number; targetCount: number }> {
  const base = Math.max(1, Math.round(sourceCount));
  return [...new Set(distances.map((distance) => Math.max(0, distance)))].sort((a, b) => a - b).map((distance, index) => ({
    distance,
    targetCount: Math.max(1, Math.round(base / Math.pow(2, index)))
  }));
}

function applyOperation(points: readonly UltraModelPoint[], operation: UltraModelOperation): UltraModelPoint[] {
  const values = operation.values;
  if (operation.kind === "translate") return points.map((point) => ({ ...copyPoint(point), position: point.position.map((value, axis) => value + (values[axis] ?? 0)) as unknown as readonly [number, number, number] }));
  if (operation.kind === "scale") return points.map((point) => ({ ...copyPoint(point), position: point.position.map((value, axis) => value * (values[axis] ?? 1)) as unknown as readonly [number, number, number] }));
  if (operation.kind === "mirror") return points.map((point) => ({ ...copyPoint(point), position: point.position.map((value, axis) => axis === Math.round(values[0] ?? 0) ? -value : value) as unknown as readonly [number, number, number] }));
  if (operation.kind === "array") {
    const copies = Math.max(1, Math.min(128, Math.round(values[0] ?? 1)));
    return Array.from({ length: copies }, (_, copy) => points.map((point) => ({ ...copyPoint(point), id: `${point.id}:${copy}`, position: [point.position[0] + copy * (values[1] ?? 1), point.position[1], point.position[2]] as const }))).flat();
  }
  if (operation.kind === "palette-replace") return points.map(copyPoint);
  return points.map(copyPoint);
}

function topologicalOrder(nodes: readonly UltraGeometryNode[]): UltraGeometryNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ordered: UltraGeometryNode[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error("GEOMETRY_GRAPH_CYCLE");
    const node = byId.get(id); if (!node) throw new Error(`GEOMETRY_NODE_MISSING:${id}`);
    visiting.add(id); node.inputIds.forEach(visit); visiting.delete(id); visited.add(id); ordered.push(node);
  };
  nodes.forEach((node) => visit(node.id)); return ordered;
}
function copyPoint(point: UltraModelPoint): UltraModelPoint { return { ...point, position: [...point.position] as unknown as readonly [number, number, number] }; }
function random01(seed: number, index: number, axis: number): number { return mix(seed, Math.imul(index + 1, 31) ^ axis) / 0xffffffff; }
function hash(value: string): number { let result = 2166136261; for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619); return result >>> 0; }
function mix(a: number, b: number): number { let value = (a ^ b) >>> 0; value = Math.imul(value ^ value >>> 16, 0x7feb352d); value = Math.imul(value ^ value >>> 15, 0x846ca68b); return (value ^ value >>> 16) >>> 0; }
function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum)); }

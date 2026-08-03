export interface UltraProductionAsset { id: string; name: string; kind: string; tags: string[]; version: number; dependencies: string[]; sizeBytes: number; }
export interface UltraWorkspaceTemplate { id: string; name: string; editors: string[]; shortcuts: Record<string, string>; minimumWidth: number; }
export interface UltraReviewVersion { id: string; shotId: string; revision: number; fingerprint: string; approved: boolean; }
export interface UltraBatchOperation { id: string; targetIds: string[]; operator: string; parameters: Record<string, string | number | boolean>; }
export interface UltraRenderWorker { id: string; enabled: boolean; capacity: number; platform: string; }

export function indexProductionAssets(assets: readonly UltraProductionAsset[]): Map<string, string[]> {
  const index = new Map<string, Set<string>>();
  for (const asset of assets) {
    for (const token of [asset.name, asset.kind, ...asset.tags].join(" ").toLowerCase().split(/\W+/).filter(Boolean)) {
      const current = index.get(token) ?? new Set<string>(); current.add(asset.id); index.set(token, current);
    }
  }
  return new Map([...index.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([token, ids]) => [token, [...ids].sort()]));
}

export function searchProductionAssets(query: string, assets: readonly UltraProductionAsset[]): UltraProductionAsset[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return assets.filter((asset) => { const text = [asset.name, asset.kind, ...asset.tags].join(" ").toLowerCase(); return terms.every((term) => text.includes(term)); })
    .sort((a, b) => b.version - a.version || a.name.localeCompare(b.name));
}

export function buildDependencyOrder(assets: readonly UltraProductionAsset[], roots: readonly string[]): string[] {
  const byId = new Map(assets.map((asset) => [asset.id, asset])); const ordered: string[] = []; const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string) => { if (visited.has(id)) return; if (visiting.has(id)) throw new Error(`ASSET_DEPENDENCY_CYCLE:${id}`); const asset = byId.get(id); if (!asset) throw new Error(`ASSET_DEPENDENCY_MISSING:${id}`); visiting.add(id); [...asset.dependencies].sort().forEach(visit); visiting.delete(id); visited.add(id); ordered.push(id); };
  [...roots].sort().forEach(visit); return ordered;
}

export function resolveWorkspaceTemplate(template: UltraWorkspaceTemplate, viewportWidth: number): UltraWorkspaceTemplate {
  const width = Math.max(320, viewportWidth); const editors = width < template.minimumWidth ? template.editors.slice(0, Math.max(1, Math.ceil(template.editors.length / 2))) : [...template.editors];
  return { ...template, editors, shortcuts: { ...template.shortcuts } };
}

export function searchCommandPalette(query: string, commands: readonly { id: string; label: string; keywords: string[]; enabled: boolean }[]): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return commands.filter((command) => command.enabled).map((command) => ({ id: command.id, text: [command.label, ...command.keywords].join(" ").toLowerCase() }))
    .filter((command) => terms.every((term) => command.text.includes(term))).sort((a, b) => a.id.localeCompare(b.id)).map((command) => command.id);
}

export function compareReviewVersions(a: UltraReviewVersion, b: UltraReviewVersion): { sameShot: boolean; changed: boolean; revisionDelta: number } {
  return { sameShot: a.shotId === b.shotId, changed: a.fingerprint !== b.fingerprint, revisionDelta: b.revision - a.revision };
}

export function packageCollaborationAssets(assets: readonly UltraProductionAsset[], selectedIds: readonly string[]): { orderedIds: string[]; totalBytes: number; manifestFingerprint: string } {
  const orderedIds = buildDependencyOrder(assets, selectedIds); const byId = new Map(assets.map((asset) => [asset.id, asset])); const totalBytes = orderedIds.reduce((sum, id) => sum + Math.max(0, byId.get(id)?.sizeBytes ?? 0), 0);
  return { orderedIds, totalBytes, manifestFingerprint: fingerprint(orderedIds.map((id) => [id, byId.get(id)?.version ?? 0])) };
}

export function validateBatchOperations(operations: readonly UltraBatchOperation[]): string[] {
  const errors: string[] = []; const ids = new Set<string>();
  for (const operation of operations) { if (!operation.id || ids.has(operation.id)) errors.push("BATCH_OPERATION_ID_INVALID"); ids.add(operation.id); if (!operation.operator || operation.targetIds.length === 0) errors.push(`BATCH_OPERATION_EMPTY:${operation.id}`); if (new Set(operation.targetIds).size !== operation.targetIds.length) errors.push(`BATCH_TARGET_DUPLICATE:${operation.id}`); }
  return [...new Set(errors)];
}

export function assignRenderFarmJobs(jobIds: readonly string[], workers: readonly UltraRenderWorker[]): Record<string, string[]> {
  const active = workers.filter((worker) => worker.enabled && worker.capacity > 0).sort((a, b) => b.capacity - a.capacity || a.id.localeCompare(b.id));
  if (active.length === 0 && jobIds.length > 0) throw new Error("RENDER_FARM_NO_WORKER");
  const result = Object.fromEntries(active.map((worker) => [worker.id, [] as string[]]));
  let cursor = 0; for (const jobId of [...jobIds].sort()) { const worker = active[cursor % active.length]; result[worker.id].push(jobId); cursor += 1; }
  return result;
}

export function calculateProductionDashboard(input: { totalShots: number; approvedShots: number; blockedShots: number; queuedRenders: number; missingAssets: number }): { completion: number; risk: "low" | "medium" | "high"; nextAction: string } {
  const total = Math.max(0, Math.round(input.totalShots)); const approved = clampInt(input.approvedShots, 0, total); const completion = total === 0 ? 0 : approved / total;
  const riskScore = Math.max(0, input.blockedShots) * 3 + Math.max(0, input.missingAssets) * 4 + Math.max(0, input.queuedRenders > total ? 1 : 0);
  const risk = riskScore >= 8 ? "high" : riskScore >= 3 ? "medium" : "low";
  const nextAction = input.missingAssets > 0 ? "relink-assets" : input.blockedShots > 0 ? "resolve-blockers" : input.queuedRenders > 0 ? "monitor-renders" : completion < 1 ? "review-shots" : "validate-delivery";
  return { completion, risk, nextAction };
}

export function validateReleaseHandoff(input: { projectFingerprint: string; manifestFingerprint: string; checksums: string[]; unresolvedNotes: number; missingAssets: number; evidenceComplete: boolean }): string[] {
  const errors: string[] = [];
  if (!/^[0-9a-f]{8,128}$/i.test(input.projectFingerprint)) errors.push("HANDOFF_PROJECT_FINGERPRINT_INVALID");
  if (!/^[0-9a-f]{8,128}$/i.test(input.manifestFingerprint)) errors.push("HANDOFF_MANIFEST_FINGERPRINT_INVALID");
  if (input.checksums.length === 0 || input.checksums.some((checksum) => !/^[0-9a-f]{8,128}$/i.test(checksum))) errors.push("HANDOFF_CHECKSUM_INVALID");
  if (input.unresolvedNotes > 0) errors.push("HANDOFF_NOTES_UNRESOLVED"); if (input.missingAssets > 0) errors.push("HANDOFF_ASSETS_MISSING"); if (!input.evidenceComplete) errors.push("HANDOFF_EVIDENCE_INCOMPLETE");
  return errors;
}

function fingerprint(value: unknown): string { const text = JSON.stringify(value); let hash = 2166136261; for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619); return (hash >>> 0).toString(16).padStart(8, "0"); }
function clampInt(value: number, minimum: number, maximum: number): number { return Math.round(Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum))); }

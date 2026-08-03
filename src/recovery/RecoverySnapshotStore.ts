import type { MineMotionProject } from "../project/ProjectFile";
import { ProjectSerializer } from "../project/ProjectSerializer";

export const RECOVERY_HISTORY_KEY = "minemotion.recovery.history.v1";
const MAX_SNAPSHOTS = 5;
const MAX_SNAPSHOT_BYTES = 4 * 1024 * 1024;
const MAX_HISTORY_BYTES = 12 * 1024 * 1024;

export interface RecoverySnapshotRecord { id: string; projectName: string; createdAt: string; updatedAt: string; serialized: string; bytes: number; }
export interface RecoverySnapshotIssue { id: string; message: string; }
export interface RecoveryHistoryResult { valid: RecoverySnapshotRecord[]; issues: RecoverySnapshotIssue[]; }

export function appendRecoverySnapshot(storage: Pick<Storage, "getItem" | "setItem">, project: MineMotionProject): RecoverySnapshotRecord | null {
  const serialized = ProjectSerializer.serialize(project);
  const bytes = new TextEncoder().encode(serialized).byteLength;
  if (bytes > MAX_SNAPSHOT_BYTES) return null;
  const now = new Date().toISOString();
  const record: RecoverySnapshotRecord = { id: `recovery_${Date.now()}`, projectName: project.projectName.slice(0, 200), createdAt: now, updatedAt: project.metadata.updatedAt, serialized, bytes };
  const existing = readRecoveryHistory(storage).valid;
  let next = [record, ...existing.filter((item) => item.serialized !== serialized)].slice(0, MAX_SNAPSHOTS);
  while (new TextEncoder().encode(JSON.stringify(next)).byteLength > MAX_HISTORY_BYTES && next.length > 1) next = next.slice(0, -1);
  storage.setItem(RECOVERY_HISTORY_KEY, JSON.stringify(next));
  return record;
}

export function readRecoveryHistory(storage: Pick<Storage, "getItem">): RecoveryHistoryResult {
  const raw = storage.getItem(RECOVERY_HISTORY_KEY);
  if (!raw) return { valid: [], issues: [] };
  if (raw.length > MAX_HISTORY_BYTES) return { valid: [], issues: [{ id: "history", message: "Recovery history exceeds its safety limit." }] };
  try {
    const records = JSON.parse(raw) as unknown;
    if (!Array.isArray(records)) return { valid: [], issues: [{ id: "history", message: "Recovery history is not an array." }] };
    const valid: RecoverySnapshotRecord[] = []; const issues: RecoverySnapshotIssue[] = [];
    records.slice(0, MAX_SNAPSHOTS).forEach((value, index) => {
      if (!value || typeof value !== "object") { issues.push({ id: `entry_${index}`, message: "Recovery entry is invalid." }); return; }
      const source = value as Partial<RecoverySnapshotRecord>;
      if (typeof source.serialized !== "string" || source.serialized.length > MAX_SNAPSHOT_BYTES) { issues.push({ id: String(source.id ?? index), message: "Recovery entry is missing or too large." }); return; }
      try {
        const project = ProjectSerializer.parse(source.serialized);
        valid.push({ id: typeof source.id === "string" ? source.id : `recovery_${index}`, projectName: project.projectName, createdAt: typeof source.createdAt === "string" ? source.createdAt : "", updatedAt: project.metadata.updatedAt, serialized: source.serialized, bytes: new TextEncoder().encode(source.serialized).byteLength });
      } catch (error) { issues.push({ id: String(source.id ?? index), message: error instanceof Error ? error.message : "Recovery entry is corrupt." }); }
    });
    return { valid, issues };
  } catch { return { valid: [], issues: [{ id: "history", message: "Recovery history JSON is corrupt." }] }; }
}

export function restoreRecoverySnapshot(record: RecoverySnapshotRecord): MineMotionProject { return ProjectSerializer.parse(record.serialized); }
export function clearRecoveryHistory(storage: Pick<Storage, "removeItem">): void { storage.removeItem(RECOVERY_HISTORY_KEY); }

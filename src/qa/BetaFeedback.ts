export interface BetaFeedbackEntry { id: string; createdAt: string; category: "bug" | "usability" | "performance" | "documentation"; summary: string; steps: string[]; diagnosticsIncluded: boolean; }
export interface BetaFeedbackStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
const KEY = "minemotion.beta-feedback.v1";
export class BetaFeedbackStore {
  constructor(private readonly storage: BetaFeedbackStorage) {}
  list(): BetaFeedbackEntry[] { try { const source = JSON.parse(this.storage.getItem(KEY) ?? "[]"); return Array.isArray(source) ? source.slice(-100) : []; } catch { return []; } }
  add(input: Omit<BetaFeedbackEntry, "id" | "createdAt">): BetaFeedbackEntry {
    const entry: BetaFeedbackEntry = { ...input, id: `feedback_${Date.now().toString(36)}`, createdAt: new Date().toISOString(), summary: input.summary.trim().slice(0, 1000), steps: input.steps.map((step) => step.trim().slice(0, 1000)).filter(Boolean).slice(0, 30) };
    this.storage.setItem(KEY, JSON.stringify([...this.list(), entry].slice(-100)));
    return entry;
  }
  export(): string { return JSON.stringify({ schemaVersion: 1, privacy: "Local opt-in feedback; no automatic upload.", entries: this.list() }, null, 2); }
}

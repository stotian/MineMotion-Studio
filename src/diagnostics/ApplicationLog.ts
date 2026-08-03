import { createId } from "../core/ids/Id";

export type DiagnosticCategory = "application" | "import" | "export" | "vfx" | "plugin" | "renderer" | "recovery";
export type DiagnosticLevel = "info" | "warning" | "error";
export interface ApplicationLogEntry { id: string; category: DiagnosticCategory; level: DiagnosticLevel; message: string; code?: string; createdAt: string; details?: Record<string, string | number | boolean | null>; }

const MAX_LOG_ENTRIES = 1000;
export class ApplicationLog {
  private entries: ApplicationLogEntry[] = [];
  write(category: DiagnosticCategory, level: DiagnosticLevel, message: string, options: { code?: string; details?: ApplicationLogEntry["details"] } = {}): ApplicationLogEntry {
    const entry = { id: createId("diagnostic"), category, level, message: redact(message), code: options.code, createdAt: new Date().toISOString(), details: sanitizeDetails(options.details) } satisfies ApplicationLogEntry;
    this.entries = [...this.entries, entry].slice(-MAX_LOG_ENTRIES);
    return entry;
  }
  list(): ApplicationLogEntry[] { return this.entries.map((entry) => ({ ...entry, details: entry.details ? { ...entry.details } : undefined })); }
  clear(): void { this.entries = []; }
}
export const applicationLog = new ApplicationLog();

function redact(value: string): string {
  return value
    .replace(/(?:[A-Za-z]:\\|\/home\/|\/Users\/)[^\s"']+/g, "[local-path]")
    .replace(/((?:token|api[_-]?key|secret)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]")
    .slice(0, 4000);
}
function sanitizeDetails(details: ApplicationLogEntry["details"]): ApplicationLogEntry["details"] {
  if (!details) return undefined;
  return Object.fromEntries(Object.entries(details).slice(0, 50).map(([key, value]) => [key.slice(0, 80), typeof value === "string" ? redact(value) : value]));
}

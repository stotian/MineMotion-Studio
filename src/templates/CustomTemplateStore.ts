import type { ProjectTemplate } from "./TemplateTypes";
import { importCustomTemplate } from "./TemplatePackage";

export interface TemplateStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
const INDEX_KEY = "minemotion.custom-templates.v1";

export class CustomTemplateStore {
  constructor(private readonly storage: TemplateStorage) {}
  list(): ProjectTemplate[] {
    const ids = this.readIndex();
    return ids.flatMap((id) => {
      const raw = this.storage.getItem(`${INDEX_KEY}.${id}`);
      if (!raw) return [];
      try { return [importCustomTemplate(raw).template]; } catch { return []; }
    });
  }
  save(raw: string): ProjectTemplate {
    const imported = importCustomTemplate(raw);
    this.storage.setItem(`${INDEX_KEY}.${imported.template.id}`, raw);
    this.storage.setItem(INDEX_KEY, JSON.stringify([...new Set([...this.readIndex(), imported.template.id])].sort()));
    return imported.template;
  }
  remove(id: string): void {
    this.storage.removeItem(`${INDEX_KEY}.${id}`);
    this.storage.setItem(INDEX_KEY, JSON.stringify(this.readIndex().filter((entry) => entry !== id)));
  }
  private readIndex(): string[] {
    try { const value = JSON.parse(this.storage.getItem(INDEX_KEY) ?? "[]"); return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []; } catch { return []; }
  }
}

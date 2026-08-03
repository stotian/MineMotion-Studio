import { describe, expect, it } from "vitest";
import { templateRegistry } from "./TemplateRegistry";
import { BENCHMARK_TEMPLATE_IDS, FIRST_PARTY_CONTENT_PACKS, TUTORIAL_PROJECTS, validateShippedTemplate } from "./SampleCatalog";
import { createCustomTemplateMetadata, exportCustomTemplate, importCustomTemplate } from "./TemplatePackage";

describe("Phase 31 templates", () => {
  it("ships every required production template with legal metadata", () => {
    const required = ["empty-scene","dialogue-scene","fight-scene","horror-scene","chase-scene","boss-battle","trailer-scene","thumbnail-scene","vertical-short"];
    for (const id of required) {
      const template = templateRegistry.get(id);
      expect(template).toBeDefined();
      expect(validateShippedTemplate(template!)).toEqual([]);
      expect(template!.create().production.shots.length).toBeGreaterThanOrEqual(id === "empty-scene" ? 0 : 1);
    }
  });
  it("round-trips custom templates", () => {
    const project = templateRegistry.createProject("dialogue-scene");
    const raw = exportCustomTemplate(createCustomTemplateMetadata("my-dialogue", "My Dialogue", "Reusable dialogue setup"), project);
    expect(importCustomTemplate(raw).project.projectName).toBe("Dialogue Scene");
  });
  it("ships data-only packs, tutorials and benchmarks", () => {
    expect(FIRST_PARTY_CONTENT_PACKS.every((pack) => pack.dataOnly)).toBe(true);
    expect(TUTORIAL_PROJECTS.length).toBeGreaterThanOrEqual(3);
    expect(BENCHMARK_TEMPLATE_IDS.length).toBe(3);
  });
});

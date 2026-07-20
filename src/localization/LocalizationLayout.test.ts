import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EN_TRANSLATIONS } from "./catalogs/en";
import { FR_TRANSLATIONS } from "./catalogs/fr";
import { pseudolocalize } from "./Pseudolocalization";

const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");

describe("localized layout safeguards", () => {
  it("keeps every supported and pseudo-localized message bounded", () => {
    for (const catalog of [EN_TRANSLATIONS, FR_TRANSLATIONS]) {
      for (const value of Object.values(catalog)) {
        expect(value.length).toBeLessThanOrEqual(260);
        expect(pseudolocalize(value).length).toBeLessThanOrEqual(340);
      }
    }
  });

  it("wraps long labels and collapses production modals on small windows", () => {
    expect(styles).toMatch(/\.modal-panel button,[\s\S]*overflow-wrap:\s*anywhere/);
    expect(styles).toMatch(/@media \(max-width:\s*900px\)[\s\S]*\.world-import-layout,[\s\S]*\.rig-studio-layout,[\s\S]*\.vfx-workspace-layout[\s\S]*grid-template-columns:\s*1fr/);
  });
});

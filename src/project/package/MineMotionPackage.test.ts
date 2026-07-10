import { describe, expect, it } from "vitest";
import { createInitialProject } from "../ProjectStore";
import { createMineMotionPackageData } from "./MineMotionPackage";
import { validatePackageData } from "./PackageValidator";

describe("MineMotion package", () => {
  it("creates a valid .minemotion package payload", () => {
    const project = createInitialProject();
    const data = createMineMotionPackageData(project);
    const validation = validatePackageData(data);

    expect(data.packageFormat).toBe("minemotion-package-json");
    expect(data.project.schemaVersion).toBe(7);
    expect(data.manifest.formatName).toBe("MineMotion Studio Package");
    expect(validation.valid).toBe(true);
  });
});

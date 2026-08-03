import { describe, expect, it } from "vitest";
import { createInitialProject } from "../ProjectStore";
import { DEFAULT_APP_SETTINGS } from "../../settings/DefaultSettings";
import { PackageWriter } from "./PackageWriter";
import { PackageReader } from "./PackageReader";
import { createMineMotionPackageData } from "./MineMotionPackage";
import { createStoredZip } from "../../export/ZipWriter";
import { MINEMOTION_ZIP_FORMAT, MINEMOTION_ZIP_SCHEMA_VERSION } from "./ZipPackageFormat";

describe(".minemotion ZIP migration", () => {
  it("opens the new ZIP package", async () => {
    const project = createInitialProject(DEFAULT_APP_SETTINGS);
    const reopened = PackageReader.parseBytes(new Uint8Array(await PackageWriter.write(project).arrayBuffer()));
    expect(reopened.projectName).toBe(project.projectName);
  });
  it("still opens historical JSON packages", () => {
    const project = createInitialProject(DEFAULT_APP_SETTINGS);
    expect(PackageReader.parse(JSON.stringify(createMineMotionPackageData(project))).projectName).toBe(project.projectName);
  });
  it("rejects an asset index whose category does not match its archive path", () => {
    const project = createInitialProject(DEFAULT_APP_SETTINGS);
    const data = createMineMotionPackageData(project);
    const encoder = new TextEncoder();
    const archive = createStoredZip([
      {
        filename: "package-index.json",
        data: encoder.encode(JSON.stringify({
          format: MINEMOTION_ZIP_FORMAT,
          schemaVersion: MINEMOTION_ZIP_SCHEMA_VERSION,
          projectEntry: "project.json",
          manifestEntry: "manifest.json",
          metadataEntry: "assets/metadata.json",
          assets: [{ category: "skins", path: "assets/models/mismatched.png" }]
        }))
      },
      { filename: "project.json", data: encoder.encode(JSON.stringify(data.project)) },
      { filename: "manifest.json", data: encoder.encode(JSON.stringify(data.manifest)) },
      { filename: "assets/metadata.json", data: encoder.encode(JSON.stringify(data.assets.metadata)) },
      { filename: "assets/models/mismatched.png", data: encoder.encode("data:image/png;base64,A") }
    ]);
    return expect(archive.arrayBuffer().then((buffer) => PackageReader.parseBytes(new Uint8Array(buffer))))
      .rejects.toThrow(/does not match skins/i);
  });

});

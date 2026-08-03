import { describe, expect, it } from "vitest";
import { parseAndValidateContentPack } from "./ContentPackValidator";
import { ExtensionManager } from "./ExtensionManager";

describe("secure extension manager", () => {
  it("installs safe data without code execution", () => {
    const result = parseAndValidateContentPack(JSON.stringify({ kind: "content-pack", id: "example.camera-pack", name: "Camera pack", version: "1.0.0", apiVersion: "1.0", minMineMotionVersion: "0.8.2", author: "Example", description: "", license: { id: "MIT" }, dependencies: [], capabilities: ["presets.camera"], data: { cameraPresets: [] } }));
    expect(result.valid).toBe(true);
    const manager = new ExtensionManager();
    const installed = manager.install(result.pack!);
    expect(installed.kind).toBe("content-pack");
    expect(installed.enabled).toBe(true);
  });

  it("keeps untrusted logic plugins disabled and safe mode isolated", () => {
    const manager = new ExtensionManager();
    const installed = manager.install({ id: "example.logic", name: "Logic", version: "1.0.0", minMineMotionVersion: "0.8.2", description: "", author: "Example", permissions: ["registerTools"], entry: "index.js", enabled: false, kind: "logic-plugin", apiVersion: "1.0", capabilities: [], dependencies: [], license: { id: "MIT" } });
    expect(installed.enabled).toBe(false);
    expect(() => manager.setEnabled(installed.id, true)).toThrow(/trust/i);
    manager.setSafeMode(true);
    expect(manager.snapshot().safeMode).toBe(true);
  });

  it("rejects malicious paths and executable content-pack fields", () => {
    const result = parseAndValidateContentPack(JSON.stringify({ kind: "content-pack", id: "bad.pack", name: "Bad", version: "1.0.0", apiVersion: "1.0", minMineMotionVersion: "0.8.2", entry: "../../evil.js", data: { textures: [{ path: "../secret", mimeType: "image/png", dataUrl: "data:image/png;base64,A" }] } }));
    expect(result.valid).toBe(false);
  });
  it("enforces duplicate ids, versions and dependencies", () => {
    const manager = new ExtensionManager();
    const base = { id: "example.base", name: "Base", version: "1.0.0", minMineMotionVersion: "0.8.2", description: "", author: "Example", permissions: [], enabled: false, kind: "logic-plugin" as const, apiVersion: "1.0" as const, capabilities: [], dependencies: [], license: { id: "MIT" }, entry: "worker.js" };
    manager.install(base, { trusted: true });
    expect(() => manager.install(base, { trusted: true })).toThrow(/already installed/i);
    const dependent = manager.install({ ...base, id: "example.dependent", dependencies: [{ id: "missing.extension", version: "1.0.0" }] }, { trusted: true });
    expect(dependent.validationErrors.some((error) => error.includes("Missing dependency"))).toBe(true);
  });

  it("isolates crashes and supports safe development reload", () => {
    const manager = new ExtensionManager();
    const manifest = { id: "example.reload", name: "Reload", version: "1.0.0", minMineMotionVersion: "0.8.2", description: "", author: "Example", permissions: [], entry: "worker.js", enabled: false, kind: "logic-plugin" as const, apiVersion: "1.0" as const, capabilities: [], dependencies: [], license: { id: "MIT" } };
    manager.install(manifest, { trusted: true });
    manager.setEnabled(manifest.id, true);
    expect(manager.reload(manifest.id).enabled).toBe(true);
    manager.recordFailure(manifest.id, new Error("worker crashed"));
    expect(manager.snapshot().extensions.find((entry) => entry.id === manifest.id)?.enabled).toBe(false);
    expect(manager.snapshot().logs.some((entry) => entry.message.includes("worker crashed"))).toBe(true);
  });

});

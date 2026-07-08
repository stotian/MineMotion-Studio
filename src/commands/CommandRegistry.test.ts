import { describe, expect, it, vi } from "vitest";
import { CommandRegistry } from "./CommandRegistry";

describe("CommandRegistry", () => {
  it("registers and runs commands", () => {
    const registry = new CommandRegistry();
    const run = vi.fn();

    registry.register({
      id: "test.command",
      title: "Test Command",
      group: "Project",
      run
    });

    expect(registry.run("test.command")).toBe(true);
    expect(run).toHaveBeenCalledOnce();
    expect(registry.run("missing.command")).toBe(false);
  });
});


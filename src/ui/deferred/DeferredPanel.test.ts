import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DEFERRED_WORKFLOW_IDS } from "../../workflows/DeferredWorkflowModules";
import { DEFERRED_PANEL_IDS } from "./DeferredPanelRegistry";
import { createDeferredPanel } from "./DeferredPanel";

describe("deferred panel contract", () => {
  it("does not invoke a panel loader while the panel is closed", () => {
    const loader = vi.fn(async () => ({
      default: (_props: { open: boolean; onClose: () => void }) =>
        createElement("div", { "data-loaded": "true" })
    }));
    const DeferredPanel = createDeferredPanel(loader);

    expect(
      renderToString(
        createElement(DeferredPanel, {
          open: false,
          onClose: () => undefined
        })
      )
    ).toBe("");
    expect(loader).not.toHaveBeenCalled();

    renderToString(
      createElement(DeferredPanel, {
        open: true,
        onClose: () => undefined
      })
    );
    expect(loader).toHaveBeenCalledOnce();
  });

  it("keeps deferred surfaces and workflows explicit and bounded", () => {
    expect(DEFERRED_PANEL_IDS).toEqual([
      "settings",
      "templates",
      "plugins",
      "commands",
      "export",
      "rig-studio",
      "lighting-studio",
      "vfx-studio",
      "world-import",
      "help"
    ]);
    expect(DEFERRED_WORKFLOW_IDS).toEqual([
      "blockbench-import",
      "production-render",
      "png-sequence",
      "webm-recording",
      "wav-mixdown",
      "resource-pack-import"
    ]);
  });
});

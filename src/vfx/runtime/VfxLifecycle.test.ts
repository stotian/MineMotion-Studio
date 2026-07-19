import { describe, expect, it } from "vitest";
import { createEffectInstance } from "../../effects/EffectRegistry";
import { applyEffectTimelineCommand } from "../../effects/EffectTimelineController";
import { ProjectSerializer } from "../../project/ProjectSerializer";
import { createInitialProject } from "../../project/ProjectStore";
import { prepareProjectVfxFrame } from "./VfxProjectFrame";

describe("native VFX project lifecycle", () => {
  it("does not retain effects across repeated add, reopen, and remove cycles", () => {
    let project = createInitialProject();

    for (let cycle = 0; cycle < 20; cycle += 1) {
      const effect = createEffectInstance("shockwave", {
        id: `effect_lifecycle_${cycle}`,
        startFrame: 0,
        parameters: { radius: cycle + 1 }
      });
      const inserted = applyEffectTimelineCommand(project, {
        type: "insert",
        effect
      });
      expect(inserted.ok).toBe(true);
      if (!inserted.ok) return;

      project = ProjectSerializer.parse(
        ProjectSerializer.serialize(inserted.value.project)
      );
      const prepared = prepareProjectVfxFrame(project, {
        frame: 0,
        includeVfx: true,
        quality: "preview"
      });
      expect(prepared.ok).toBe(true);
      if (!prepared.ok) return;
      expect(prepared.value.effects).toHaveLength(1);
      expect(project.effects.instances[0].nativeVfx).toMatchObject({
        serializationVersion: 1,
        id: effect.id,
        definitionId: "shockwave"
      });

      const removed = applyEffectTimelineCommand(project, {
        type: "delete",
        effectId: effect.id
      });
      expect(removed.ok).toBe(true);
      if (!removed.ok) return;
      project = ProjectSerializer.parse(
        ProjectSerializer.serialize(removed.value.project)
      );
      expect(project.effects.instances).toEqual([]);
      expect(
        prepareProjectVfxFrame(project, {
          frame: 0,
          includeVfx: true,
          quality: "preview"
        })
      ).toMatchObject({ ok: true, value: { effects: [] } });
    }
  });
});

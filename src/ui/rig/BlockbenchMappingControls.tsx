import { useEffect, useMemo, useState } from "react";
import type { CharacterEntity } from "../../project/ProjectFile";
import { getRigDefinition } from "../../rigs/MinecraftRigPresets";
import type { BlockbenchModelAsset } from "../../rigs/RigTypes";
import {
  inspectBlockbenchMapping
} from "../../rigs/blockbench/BlockbenchMappingController";
import type {
  BlockbenchMappingWorkspace
} from "../../rigs/blockbench/useBlockbenchMappingWorkspace";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";
import type { BlockbenchMappingMethod } from "../../rigs/blockbench/BlockbenchMapping";

interface BlockbenchMappingControlsProps {
  model: BlockbenchModelAsset;
  character: CharacterEntity | null;
  workspace: BlockbenchMappingWorkspace;
}

export function BlockbenchMappingControls({
  model,
  character,
  workspace
}: BlockbenchMappingControlsProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const view = useMemo(
    () => character
      ? inspectBlockbenchMapping(model, character.rigPreset)
      : null,
    [character, model]
  );
  const [animationId, setAnimationId] = useState("");
  const firstAnimationId = view?.animations[0]?.id ?? "";
  useEffect(() => {
    if (!view?.animations.some((entry) => entry.id === animationId)) {
      setAnimationId(firstAnimationId);
    }
  }, [animationId, firstAnimationId, view?.animations]);

  if (!character) {
    return (
      <small className="empty-note">
        {t("rig.blockbench.selectCharacter")}
      </small>
    );
  }
  if (!view?.report) {
    return (
      <small className="warning-text">
        {view?.error ?? t("rig.blockbench.mappingUnavailable")}
      </small>
    );
  }
  const definition = getRigDefinition(character.rigPreset);
  return (
    <div className="blockbench-mapping-controls">
      <small>
        {t("rig.blockbench.mappingSummary", {
          mapped: view.report.mappedCount,
          total: view.report.entries.length,
          manual: view.report.manualCount
        })}
      </small>
      <div className="blockbench-mapping-list">
        {view.report.entries.map((entry) => (
          <div className="blockbench-mapping-row" key={entry.sourceGroupId}>
            <label title={entry.sourcePath}>
              <span>{entry.sourceName}</span>
              <select
                value={entry.targetBoneId ?? ""}
                onChange={(event) => workspace.setMapping(
                  model.id,
                  character.rigPreset,
                  entry.sourceGroupId,
                  event.target.value || null
                )}
              >
                <option value="">
                  {t("rig.blockbench.unmapped")}
                </option>
                {definition.bones.map((bone) => (
                  <option value={bone.id} key={bone.id}>
                    {bone.label}
                  </option>
                ))}
              </select>
            </label>
            <small>{t(mappingMethodKey(entry.method))}</small>
            {entry.method === "manual" && (
              <button
                type="button"
                className="compact-button"
                onClick={() => workspace.setMapping(
                  model.id,
                  character.rigPreset,
                  entry.sourceGroupId,
                  undefined
                )}
              >
                {t("rig.blockbench.useAutomatic")}
              </button>
            )}
          </div>
        ))}
      </div>
      {view.report.warnings.map((warning) => (
        <small className="warning-text" key={warning}>{warning}</small>
      ))}
      {view.animations.length > 0 && (
        <div className="blockbench-animation-controls">
          <label>
            <span>{t("rig.blockbench.animation")}</span>
            <select
              value={animationId}
              onChange={(event) => setAnimationId(event.target.value)}
            >
              {view.animations.map((animation) => (
                <option value={animation.id} key={animation.id}>
                  {animation.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!animationId}
            onClick={() => workspace.applyAnimation(
              model.id,
              character.id,
              animationId
            )}
          >
            {t("rig.blockbench.applyAnimation")}
          </button>
        </div>
      )}
    </div>
  );
}

function mappingMethodKey(
  method: BlockbenchMappingMethod
): TranslationKey {
  if (method === "manual") return "rig.blockbench.mappingMethod.manual";
  if (method === "exact") return "rig.blockbench.mappingMethod.exact";
  if (method === "alias") return "rig.blockbench.mappingMethod.alias";
  if (method === "conflict") return "rig.blockbench.mappingMethod.conflict";
  return "rig.blockbench.mappingMethod.unmapped";
}

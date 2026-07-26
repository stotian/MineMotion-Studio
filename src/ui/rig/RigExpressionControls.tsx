import { useEffect, useState } from "react";
import type { CharacterEntity } from "../../project/ProjectFile";
import {
  CHARACTER_EXPRESSION_PRESETS
} from "../../rigs/expressions/ExpressionOverlay";
import type {
  RigExpressionWorkspace
} from "../../rigs/expressions/useRigExpressionWorkspace";
import type {
  CharacterExpressionPreset
} from "../../rigs/RigTypes";
import { useLocalization } from "../../localization/LocalizationContext";
import type { TranslationKey } from "../../localization/LocalizationTypes";

interface RigExpressionControlsProps {
  character: CharacterEntity;
  workspace: RigExpressionWorkspace;
}

export function RigExpressionControls({
  character,
  workspace
}: RigExpressionControlsProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [preset, setPreset] = useState<CharacterExpressionPreset>(
    character.expression?.preset ?? "blink"
  );
  const [intensity, setIntensity] = useState(
    character.expression?.intensity ?? 1
  );
  useEffect(() => {
    setPreset(character.expression?.preset ?? "blink");
    setIntensity(character.expression?.intensity ?? 1);
  }, [character.expression]);
  const enabled = Boolean(character.expression);

  return (
    <fieldset className="rig-expression-controls">
      <legend>{t("rig.expression.title")}</legend>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => workspace.setExpression(
            character.id,
            event.target.checked
              ? { enabled: true, preset, intensity }
              : undefined
          )}
        />
        {t("rig.expression.enabled")}
      </label>
      <label>
        <span>{t("rig.expression.preset")}</span>
        <select
          value={preset}
          disabled={!enabled}
          onChange={(event) =>
            setPreset(event.target.value as CharacterExpressionPreset)
          }
        >
          {CHARACTER_EXPRESSION_PRESETS.map((entry) => (
            <option value={entry} key={entry}>
              {t(expressionPresetKey(entry))}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>
          {t("rig.expression.intensity")}:{" "}
          {localization.formatNumber(intensity)}
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={intensity}
          disabled={!enabled}
          onChange={(event) => setIntensity(event.target.valueAsNumber)}
        />
      </label>
      <button
        type="button"
        disabled={!enabled}
        onClick={() => workspace.setExpression(character.id, {
          enabled: true,
          preset,
          intensity
        })}
      >
        {t("rig.expression.apply")}
      </button>
      <small className="empty-note">{t("rig.expression.note")}</small>
    </fieldset>
  );
}

function expressionPresetKey(
  preset: CharacterExpressionPreset
): TranslationKey {
  if (preset === "anger") return "rig.expression.preset.anger";
  if (preset === "sadness") return "rig.expression.preset.sadness";
  if (preset === "confidence") return "rig.expression.preset.confidence";
  if (preset === "surprise") return "rig.expression.preset.surprise";
  if (preset === "fear") return "rig.expression.preset.fear";
  return "rig.expression.preset.blink";
}

import { useState } from "react";
import { useLocalization } from "../../localization/LocalizationContext";
import type { RigPoseWorkspace } from "../../rigs/RigWorkspaceController";

interface RigPoseControlsProps {
  characterId: string;
  workspace: RigPoseWorkspace;
}

export function RigPoseControls({
  characterId,
  workspace
}: RigPoseControlsProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const [blendInfluence, setBlendInfluence] = useState(0.5);

  return (
    <div className="rig-pose-controls">
      <div className="inspector-actions">
        <button
          type="button"
          onClick={() => workspace.saveCurrentPose(characterId)}
        >
          {t("rig.savePose")}
        </button>
        <button type="button" onClick={() => workspace.copyPose(characterId)}>
          {t("rig.copyPose")}
        </button>
        <button
          type="button"
          disabled={!workspace.hasClipboard}
          onClick={() => workspace.pastePose(characterId)}
        >
          {t("rig.pastePose")}
        </button>
        <button type="button" onClick={() => workspace.mirrorPose(characterId)}>
          {t("rig.mirrorPose")}
        </button>
        <button type="button" onClick={() => workspace.resetPose(characterId)}>
          {t("rig.resetPose")}
        </button>
      </div>
      <label className="compact-control">
        <span>
          {t("rig.blendInfluence")}: {Math.round(blendInfluence * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={blendInfluence}
          disabled={!workspace.hasClipboard}
          onChange={(event) => setBlendInfluence(event.target.valueAsNumber)}
        />
      </label>
      <button
        type="button"
        disabled={!workspace.hasClipboard || blendInfluence <= 0}
        onClick={() => workspace.blendPose(characterId, blendInfluence)}
      >
        {t("rig.blendPose")}
      </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocalization } from "../../localization/LocalizationContext";
import type {
  CharacterEntity,
  ImportedObjAsset
} from "../../project/ProjectFile";
import { getRigDefinition } from "../../rigs/MinecraftRigPresets";
import type { CharacterAttachmentPointId } from "../../rigs/RigTypes";
import type { RigAttachmentWorkspace } from "../../rigs/attachments/useRigAttachmentWorkspace";

interface RigAttachmentControlsProps {
  character: CharacterEntity;
  objAssets: readonly ImportedObjAsset[];
  workspace: RigAttachmentWorkspace;
}

export function RigAttachmentControls({
  character,
  objAssets,
  workspace
}: RigAttachmentControlsProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const definition = getRigDefinition(character.rigPreset);
  const points = definition.attachmentPoints;
  const [assetId, setAssetId] = useState(objAssets[0]?.id ?? "");
  const [pointId, setPointId] = useState<CharacterAttachmentPointId>(
    points[0]?.id ?? "rightHand"
  );
  useEffect(() => {
    if (!objAssets.some((asset) => asset.id === assetId)) {
      setAssetId(objAssets[0]?.id ?? "");
    }
  }, [assetId, objAssets]);

  const issues = workspace.issues.filter(
    (issue) => issue.characterId === character.id
  );

  return (
    <>
      <h3>{t("rig.attachments.title")}</h3>
      <p className="empty-note">{t("rig.attachments.timelineNote")}</p>
      <div className="rig-attachment-list">
        {(character.attachments ?? []).map((attachment) => {
          const attachmentIssues = issues.filter(
            (issue) => issue.attachmentId === attachment.id
          );
          return (
            <div className="rig-attachment-row" key={attachment.id}>
              <div className="asset-row">
                <strong>{attachment.name}</strong>
                <small>{attachment.kind}</small>
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={attachment.visible}
                  onChange={(event) =>
                    workspace.updateAttachment(
                      character.id,
                      attachment.id,
                      { visible: event.target.checked }
                    )
                  }
                />
                <span>{t("rig.attachments.visible")}</span>
              </label>
              <label>
                <span>{t("rig.attachments.point")}</span>
                <select
                  value={attachment.pointId}
                  onChange={(event) =>
                    workspace.updateAttachment(
                      character.id,
                      attachment.id,
                      {
                        pointId: event.target.value as
                          CharacterAttachmentPointId
                      }
                    )
                  }
                >
                  {points.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.label}
                    </option>
                  ))}
                </select>
              </label>
              {attachmentIssues.map((issue) => (
                <small className="validation-error" key={issue.code}>
                  {issue.code}
                </small>
              ))}
              <button
                type="button"
                onClick={() =>
                  workspace.removeAttachment(character.id, attachment.id)
                }
              >
                {t("rig.attachments.remove")}
              </button>
            </div>
          );
        })}
        {(character.attachments ?? []).length === 0 && (
          <p className="empty-note">{t("rig.attachments.empty")}</p>
        )}
      </div>
      <div className="rig-attachment-add">
        <label>
          <span>{t("rig.attachments.objAsset")}</span>
          <select
            value={assetId}
            disabled={objAssets.length === 0}
            onChange={(event) => setAssetId(event.target.value)}
          >
            {objAssets.length === 0 ? (
              <option value="">{t("rig.attachments.noObjAsset")}</option>
            ) : objAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("rig.attachments.point")}</span>
          <select
            value={pointId}
            onChange={(event) =>
              setPointId(event.target.value as CharacterAttachmentPointId)
            }
          >
            {points.map((point) => (
              <option key={point.id} value={point.id}>
                {point.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!assetId}
          onClick={() =>
            workspace.addObjAttachment(character.id, assetId, pointId)
          }
        >
          {t("rig.attachments.addObj")}
        </button>
      </div>
    </>
  );
}

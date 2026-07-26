import { useLocalization } from "../../localization/LocalizationContext";
import type { BlockbenchModelAsset } from "../../rigs/RigTypes";
import type { CharacterEntity } from "../../project/ProjectFile";
import type {
  BlockbenchMappingWorkspace
} from "../../rigs/blockbench/useBlockbenchMappingWorkspace";
import { BlockbenchMappingControls } from "./BlockbenchMappingControls";

interface BlockbenchImportReportCardProps {
  model: BlockbenchModelAsset;
  character: CharacterEntity | null;
  mappingWorkspace: BlockbenchMappingWorkspace;
}

export function BlockbenchImportReportCard({
  model,
  character,
  mappingWorkspace
}: BlockbenchImportReportCardProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  const animationNames = model.animationNames ?? [];
  const unsupported = model.unsupportedFeatures ?? [];

  return (
    <div className="blockbench-report-card">
      <div className="asset-row">
        <strong>{model.name}</strong>
        <small>
          {model.modelFormat ?? "unknown"} / {model.formatVersion}
        </small>
      </div>
      <small>
        {t("rig.modelCounts", {
          cubes: model.elementCount,
          groups: model.groupCount,
          textures: model.textureCount
        })}
      </small>
      <small>
        {t("rig.blockbench.animationCount", {
          count: model.animationCount ?? 0
        })}
      </small>
      {animationNames.length > 0 && (
        <small title={animationNames.join(", ")}>
          {t("rig.blockbench.animationNames", {
            names: animationNames.join(", ")
          })}
        </small>
      )}
      {unsupported.length > 0 && (
        <small className="warning-text">
          {t("rig.blockbench.unsupported", {
            features: unsupported.join(", ")
          })}
        </small>
      )}
      {(model.warnings ?? []).map((warning) => (
        <small className="warning-text" key={warning}>
          {warning}
        </small>
      ))}
      <BlockbenchMappingControls
        model={model}
        character={character}
        workspace={mappingWorkspace}
      />
    </div>
  );
}

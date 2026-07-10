import { Bone, Box, Film, RefreshCw, Upload, X } from "lucide-react";
import type { AnimationPreset } from "../../presets/AnimationPresets";
import type { RigPosePreset } from "../../presets/RigPosePresets";
import type { CharacterEntity, MineMotionProject } from "../../project/ProjectFile";
import { getSelectedCharacterId } from "../../rigs/RigSelection";

interface RigStudioPanelProps {
  open: boolean;
  project: MineMotionProject;
  selectedObjectId: string | null;
  posePresets: RigPosePreset[];
  animationPresets: AnimationPreset[];
  onClose: () => void;
  onImportSkin: (characterId: string) => void;
  onResetSkin: (characterId: string) => void;
  onApplyPose: (poseId: string) => void;
  onSavePose: (characterId: string) => void;
  onMirrorPose: (characterId: string) => void;
  onResetPose: (characterId: string) => void;
  onApplyAnimation: (presetId: string) => void;
  onImportBlockbench: () => void;
}

export function RigStudioPanel({
  open,
  project,
  selectedObjectId,
  posePresets,
  animationPresets,
  onClose,
  onImportSkin,
  onResetSkin,
  onApplyPose,
  onSavePose,
  onMirrorPose,
  onResetPose,
  onApplyAnimation,
  onImportBlockbench
}: RigStudioPanelProps) {
  if (!open) return null;

  const selectedCharacterId = getSelectedCharacterId(selectedObjectId);
  const character =
    project.scene.characters.find((item) => item.id === selectedCharacterId) ??
    project.scene.characters[0] ??
    null;
  const rigAnimations = animationPresets.filter((preset) =>
    preset.targetTypes.includes("character")
  );

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel rig-studio-panel" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>
            <Bone size={18} />
            Rig Studio
          </h2>
          <button type="button" onClick={onClose} aria-label="Close rig studio">
            <X size={16} />
          </button>
        </div>
        <div className="rig-studio-layout">
          <section>
            <h3>Selected Character</h3>
            {character ? (
              <CharacterSummary
                character={character}
                onImportSkin={() => onImportSkin(character.id)}
                onResetSkin={() => onResetSkin(character.id)}
                onSavePose={() => onSavePose(character.id)}
                onMirrorPose={() => onMirrorPose(character.id)}
                onResetPose={() => onResetPose(character.id)}
              />
            ) : (
              <p className="empty-note">Add or select a character first.</p>
            )}
          </section>
          <section>
            <h3>Pose Library</h3>
            <div className="preset-actions">
              {posePresets.map((pose) => (
                <button
                  key={pose.id}
                  type="button"
                  disabled={!character}
                  title={pose.description}
                  onClick={() => onApplyPose(pose.id)}
                >
                  {pose.name}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>
              <Film size={15} />
              Animation Presets
            </h3>
            <div className="preset-actions">
              {rigAnimations.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={!character}
                  title={preset.description}
                  onClick={() => onApplyAnimation(preset.id)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>
              <Box size={15} />
              Blockbench
            </h3>
            <button type="button" onClick={onImportBlockbench}>
              <Upload size={15} />
              Import Blockbench Model
            </button>
            <div className="asset-list">
              {project.rigs.blockbenchModels.length === 0 ? (
                <p className="empty-note">No .bbmodel imported yet.</p>
              ) : (
                project.rigs.blockbenchModels.map((model) => (
                  <div key={model.id} className="asset-row">
                    <strong>{model.name}</strong>
                    <small>
                      {model.elementCount} cubes / {model.groupCount} groups /{" "}
                      {model.textureCount} textures
                    </small>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CharacterSummary({
  character,
  onImportSkin,
  onResetSkin,
  onSavePose,
  onMirrorPose,
  onResetPose
}: {
  character: CharacterEntity;
  onImportSkin: () => void;
  onResetSkin: () => void;
  onSavePose: () => void;
  onMirrorPose: () => void;
  onResetPose: () => void;
}) {
  const skin = character.skin;
  return (
    <>
      <div className="asset-row">
        <strong>{character.name}</strong>
        <small>{character.rigPreset}</small>
      </div>
      <div className="info-row">
        <span>Skin</span>
        <strong>{skin ? skin.name : "fallback colors"}</strong>
      </div>
      {skin && (
        <>
          <div className="info-row">
            <span>Resolution</span>
            <strong>
              {skin.metadata.width}x{skin.metadata.height}
            </strong>
          </div>
          <div className="info-row">
            <span>Model</span>
            <strong>{skin.metadata.modelType}</strong>
          </div>
          <div className="info-row">
            <span>Status</span>
            <strong>{skin.metadata.valid ? "valid" : "invalid"}</strong>
          </div>
        </>
      )}
      <div className="inspector-actions">
        <button type="button" onClick={onImportSkin}>
          <Upload size={15} />
          Import Skin
        </button>
        <button type="button" onClick={onResetSkin}>
          <RefreshCw size={15} />
          Reset Skin
        </button>
        <button type="button" onClick={onSavePose}>
          Save Current Pose
        </button>
        <button type="button" onClick={onMirrorPose}>
          Mirror Pose
        </button>
        <button type="button" onClick={onResetPose}>
          Reset Pose
        </button>
      </div>
    </>
  );
}

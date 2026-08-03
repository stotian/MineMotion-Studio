import { INTERACTION_AND_UI_FOUNDATIONS_PROGRAM as PROGRAM_1 } from "./InteractionAndUiFoundationsEngine";
import { WORKSPACES_AND_LAYOUT_PROGRAM as PROGRAM_2 } from "./WorkspacesAndLayoutEngine";
import { SELECTION_SEARCH_AND_NAVIGATION_PROGRAM as PROGRAM_3 } from "./SelectionSearchAndNavigationEngine";
import { SCENE_ORGANIZATION_AND_OUTLINER_PROGRAM as PROGRAM_4 } from "./SceneOrganizationAndOutlinerEngine";
import { ASSET_LIBRARY_AND_CATALOGS_PROGRAM as PROGRAM_5 } from "./AssetLibraryAndCatalogsEngine";
import { PROJECT_AND_DEPENDENCY_MANAGEMENT_PROGRAM as PROGRAM_6 } from "./ProjectAndDependencyManagementEngine";
import { MODELING_AND_BLOCK_AUTHORING_PROGRAM as PROGRAM_7 } from "./ModelingAndBlockAuthoringEngine";
import { PROCEDURAL_GEOMETRY_AND_NODES_PROGRAM as PROGRAM_8 } from "./ProceduralGeometryAndNodesEngine";
import { MATERIALS_AND_TEXTURE_AUTHORING_PROGRAM as PROGRAM_9 } from "./MaterialsAndTextureAuthoringEngine";
import { LIGHTING_AND_LOOK_DEVELOPMENT_PROGRAM as PROGRAM_10 } from "./LightingAndLookDevelopmentEngine";
import { CAMERA_AND_VIRTUAL_PRODUCTION_PROGRAM as PROGRAM_11 } from "./CameraAndVirtualProductionEngine";
import { RIGGING_AND_SKINNING_PROGRAM as PROGRAM_12 } from "./RiggingAndSkinningEngine";
import { ANIMATION_EDITING_PROGRAM as PROGRAM_13 } from "./AnimationEditingEngine";
import { ACTING_AND_MOTION_CAPTURE_PROGRAM as PROGRAM_14 } from "./ActingAndMotionCaptureEngine";
import { MINECRAFT_WORLDS_AND_BIOMES_PROGRAM as PROGRAM_15 } from "./MinecraftWorldsAndBiomesEngine";
import { ENTITIES_ITEMS_AND_GAMEPLAY_PROGRAM as PROGRAM_16 } from "./EntitiesItemsAndGameplayEngine";
import { PHYSICS_AND_SIMULATION_PROGRAM as PROGRAM_17 } from "./PhysicsAndSimulationEngine";
import { VFX_AND_PARTICLES_PROGRAM as PROGRAM_18 } from "./VfxAndParticlesEngine";
import { AUDIO_AND_DIALOGUE_PROGRAM as PROGRAM_19 } from "./AudioAndDialogueEngine";
import { EDITORIAL_AND_SEQUENCING_PROGRAM as PROGRAM_20 } from "./EditorialAndSequencingEngine";
import { COMPOSITING_AND_COLOR_PROGRAM as PROGRAM_21 } from "./CompositingAndColorEngine";
import { RENDERING_AND_SCALABILITY_PROGRAM as PROGRAM_22 } from "./RenderingAndScalabilityEngine";
import { EXPORT_AND_INTERCHANGE_PROGRAM as PROGRAM_23 } from "./ExportAndInterchangeEngine";
import { COLLABORATION_AND_REVIEW_PROGRAM as PROGRAM_24 } from "./CollaborationAndReviewEngine";
import { AUTOMATION_AND_SCRIPTING_PROGRAM as PROGRAM_25 } from "./AutomationAndScriptingEngine";
import { PLUGINS_AND_ECOSYSTEM_PROGRAM as PROGRAM_26 } from "./PluginsAndEcosystemEngine";
import { PERFORMANCE_AND_PROFILING_PROGRAM as PROGRAM_27 } from "./PerformanceAndProfilingEngine";
import { RELIABILITY_AND_RECOVERY_PROGRAM as PROGRAM_28 } from "./ReliabilityAndRecoveryEngine";
import { ACCESSIBILITY_AND_LOCALIZATION_PROGRAM as PROGRAM_29 } from "./AccessibilityAndLocalizationEngine";
import { LEARNING_AND_ASSISTANCE_PROGRAM as PROGRAM_30 } from "./LearningAndAssistanceEngine";
import { SECURITY_QA_AND_RELEASE_PROGRAM as PROGRAM_31 } from "./SecurityQaAndReleaseEngine";
import { runUltraProgramDescriptorPhaseTest, validateUltraProgramDescriptor, type UltraProgramDescriptor, type UltraProgramPhaseTestResult } from "./UltraProgramRuntimeEngine";
import type { UltraPhaseNumber } from "../UltraPhaseRegistry";

export const ULTRA_PROGRAM_DESCRIPTORS: readonly UltraProgramDescriptor[] = Object.freeze([
  PROGRAM_1,
  PROGRAM_2,
  PROGRAM_3,
  PROGRAM_4,
  PROGRAM_5,
  PROGRAM_6,
  PROGRAM_7,
  PROGRAM_8,
  PROGRAM_9,
  PROGRAM_10,
  PROGRAM_11,
  PROGRAM_12,
  PROGRAM_13,
  PROGRAM_14,
  PROGRAM_15,
  PROGRAM_16,
  PROGRAM_17,
  PROGRAM_18,
  PROGRAM_19,
  PROGRAM_20,
  PROGRAM_21,
  PROGRAM_22,
  PROGRAM_23,
  PROGRAM_24,
  PROGRAM_25,
  PROGRAM_26,
  PROGRAM_27,
  PROGRAM_28,
  PROGRAM_29,
  PROGRAM_30,
  PROGRAM_31
]);

const ULTRA_PROGRAM_BY_PHASE = new Map<UltraPhaseNumber, UltraProgramDescriptor>();
for (const descriptor of ULTRA_PROGRAM_DESCRIPTORS) {
  const errors = validateUltraProgramDescriptor(descriptor);
  if (errors.length > 0) throw new Error(`Ultra program ${descriptor.id} is invalid: ${errors.join(", ")}`);
  for (const phase of descriptor.phases) {
    if (ULTRA_PROGRAM_BY_PHASE.has(phase.phase)) throw new Error(`Ultra program phase ${phase.phase} has multiple owners.`);
    ULTRA_PROGRAM_BY_PHASE.set(phase.phase, descriptor);
  }
}
if (ULTRA_PROGRAM_BY_PHASE.size !== 465) throw new Error(`Ultra program registry owns ${ULTRA_PROGRAM_BY_PHASE.size} phases, expected 465.`);

export function getUltraProgramDescriptor(phase: UltraPhaseNumber): UltraProgramDescriptor {
  const descriptor = ULTRA_PROGRAM_BY_PHASE.get(phase);
  if (!descriptor) throw new Error(`No Ultra program owns phase ${phase}.`);
  return descriptor;
}

export function runUltraProgramPhaseTest(phase: UltraPhaseNumber): UltraProgramPhaseTestResult {
  return runUltraProgramDescriptorPhaseTest(getUltraProgramDescriptor(phase), phase);
}

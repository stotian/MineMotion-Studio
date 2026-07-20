import type { LocalizationService } from "./LocalizationService";
import type { TranslationKey, TranslationValues } from "./LocalizationTypes";

export type LocalizationDiagnosticCode =
  | "PROJECT_LOAD_FAILED"
  | "PROJECT_SCHEMA9_VFX_UNSUPPORTED"
  | "AUTOSAVE_RECOVERY_FAILED"
  | "AUTOSAVE_SAVE_FAILED"
  | "WORLD_SCAN_FAILED"
  | "WORLD_IMPORT_FAILED"
  | "OBJ_IMPORT_FAILED"
  | "SKIN_IMPORT_FAILED"
  | "BLOCKBENCH_IMPORT_FAILED"
  | "VFX_ADD_FAILED"
  | "EFFECT_ADD_FAILED"
  | "EFFECT_EDIT_FAILED"
  | "EXPORT_SETTINGS_INVALID"
  | "EXPORT_PNG_FAILED"
  | "EXPORT_SEQUENCE_FAILED"
  | "EXPORT_WEBM_FAILED"
  | "EXPORT_WAV_FAILED"
  | "EXPORT_RUNTIME_FAILED"
  | "AUDIO_IMPORT_FAILED"
  | "RESOURCE_PACK_ZIP_FAILED"
  | "RESOURCE_PACK_FOLDER_FAILED"
  | "VFX_PACKAGE_EXPORT_FAILED"
  | "VFX_PACKAGE_INSPECT_FAILED"
  | "VFX_PACKAGE_INSTALL_FAILED"
  | "VFX_AUTHORING_INVALID"
  | "VFX_DERIVE_FAILED"
  | "VFX_PACKAGE_STATE_FAILED"
  | "VFX_PACKAGE_UNINSTALL_FAILED"
  | "VFX_PACKAGE_COMPILE_FAILED"
  | "VFX_PACKAGE_REGISTRY_WARNING";

export function formatLocalizedDiagnostic(
  localization: LocalizationService,
  code: LocalizationDiagnosticCode,
  key: TranslationKey,
  values: TranslationValues = {}
): string {
  return `[${code}] ${localization.t(key, values)}`;
}

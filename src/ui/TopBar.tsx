import {
  Box,
  Camera,
  Clapperboard,
  Command,
  Download,
  FolderOpen,
  HelpCircle,
  LayoutTemplate,
  Play,
  Plug,
  Save,
  Settings,
  Sparkles,
  Sun,
  Square,
  UserPlus,
  Video,
  Wand2
} from "lucide-react";
import { useLocalization } from "../localization/LocalizationContext";

interface TopBarProps {
  projectName: string;
  isPlaying: boolean;
  isDirty: boolean;
  renderPreviewEnabled: boolean;
  onNewProject: () => void;
  onNewProjectFromTemplate: () => void;
  onOpenWorld: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onAddCharacter: () => void;
  onAddCamera: () => void;
  onImportObj: () => void;
  onTogglePlayback: () => void;
  onOpenSettings: () => void;
  onOpenPlugins: () => void;
  onOpenCommands: () => void;
  onOpenExport: () => void;
  onOpenRigStudio: () => void;
  onOpenLightingStudio: () => void;
  onOpenVfxWorkspace: () => void;
  onOpenHelp: () => void;
  onToggleRenderPreview: () => void;
}

export function TopBar({
  projectName,
  isPlaying,
  isDirty,
  renderPreviewEnabled,
  onNewProject,
  onNewProjectFromTemplate,
  onOpenWorld,
  onSaveProject,
  onLoadProject,
  onAddCharacter,
  onAddCamera,
  onImportObj,
  onTogglePlayback,
  onOpenSettings,
  onOpenPlugins,
  onOpenCommands,
  onOpenExport,
  onOpenRigStudio,
  onOpenLightingStudio,
  onOpenVfxWorkspace,
  onOpenHelp,
  onToggleRenderPreview
}: TopBarProps) {
  const localization = useLocalization();
  const t = localization.t.bind(localization);
  return (
    <header className="top-bar">
      <div className="brand">
        <Clapperboard size={22} />
        <div>
          <strong>MineMotion Studio</strong>
          <span>
            {projectName}
            {isDirty ? " *" : ""}
          </span>
        </div>
      </div>
      <nav className="top-actions" aria-label={t("topbar.mainActions")}>
        <button type="button" onClick={onNewProject}>
          <Wand2 size={16} />
          {t("topbar.newProject")}
        </button>
        <button type="button" onClick={onNewProjectFromTemplate}>
          <LayoutTemplate size={16} />
          {t("topbar.templates")}
        </button>
        <button type="button" onClick={onOpenWorld}>
          <FolderOpen size={16} />
          {t("topbar.openWorld")}
        </button>
        <button type="button" onClick={onSaveProject}>
          <Save size={16} />
          {t("topbar.saveProject")}
        </button>
        <button type="button" onClick={onLoadProject}>
          <FolderOpen size={16} />
          {t("topbar.loadProject")}
        </button>
        <button type="button" onClick={onAddCharacter}>
          <UserPlus size={16} />
          {t("topbar.addCharacter")}
        </button>
        <button type="button" onClick={onAddCamera}>
          <Camera size={16} />
          {t("topbar.addCamera")}
        </button>
        <button type="button" onClick={onImportObj}>
          <Box size={16} />
          {t("topbar.importObj")}
        </button>
        <button type="button" className="primary-action" onClick={onTogglePlayback}>
          {isPlaying ? <Square size={16} /> : <Play size={16} />}
          {isPlaying ? t("topbar.pause") : t("topbar.play")}
        </button>
        <button type="button" onClick={onOpenSettings}>
          <Settings size={16} />
          {t("topbar.settings")}
        </button>
        <button type="button" onClick={onOpenPlugins}>
          <Plug size={16} />
          {t("topbar.plugins")}
        </button>
        <button type="button" onClick={onOpenCommands}>
          <Command size={16} />
          {t("topbar.commands")}
        </button>
        <button type="button" onClick={onOpenExport}>
          <Download size={16} />
          {t("topbar.export")}
        </button>
        <button type="button" onClick={onOpenRigStudio}>
          <UserPlus size={16} />
          {t("topbar.rigStudio")}
        </button>
        <button type="button" onClick={onOpenLightingStudio}>
          <Sun size={16} />
          {t("topbar.lighting")}
        </button>
        <button type="button" onClick={onOpenVfxWorkspace}>
          <Sparkles size={16} />
          {t("topbar.vfxStudio")}
        </button>
        <button type="button" onClick={onOpenHelp}>
          <HelpCircle size={16} />
          {t("topbar.help")}
        </button>
        <button type="button" onClick={onToggleRenderPreview}>
          <Video size={16} />
          {renderPreviewEnabled ? t("topbar.viewport") : t("topbar.renderPreview")}
        </button>
      </nav>
    </header>
  );
}

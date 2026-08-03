import {
  Box,
  Camera,
  Clapperboard,
  Command,
  Download,
  FolderOpen,
  HelpCircle,
  LayoutTemplate,
  Library,
  Music2,
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
import type { WorkspaceId } from "../settings/WorkspaceSettings";
import { WorkspaceStatusIndicators } from "./workspaces/WorkspaceStatusIndicators";
import { WorkspaceSwitcher } from "./workspaces/WorkspaceSwitcher";

interface TopBarProps {
  projectName: string;
  isPlaying: boolean;
  isDirty: boolean;
  autosaveEnabled: boolean;
  exporting: boolean;
  capabilityWarnings: number;
  renderPreviewEnabled: boolean;
  workspaceId: WorkspaceId;
  onWorkspaceChange: (workspace: WorkspaceId) => void;
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
  onOpenAssets: () => void;
  onOpenAudio: () => void;
  onOpenPlugins: () => void;
  onOpenCommands: () => void;
  onOpenExport: () => void;
  onOpenRigStudio: () => void;
  onOpenLightingStudio: () => void;
  onOpenVfxWorkspace: () => void;
  onOpenProduction: () => void;
  onOpenHelp: () => void;
  onToggleRenderPreview: () => void;
}

export function TopBar({
  projectName,
  isPlaying,
  isDirty,
  autosaveEnabled,
  exporting,
  capabilityWarnings,
  renderPreviewEnabled,
  workspaceId,
  onWorkspaceChange,
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
  onOpenAssets,
  onOpenAudio,
  onOpenPlugins,
  onOpenCommands,
  onOpenExport,
  onOpenRigStudio,
  onOpenLightingStudio,
  onOpenVfxWorkspace,
  onOpenProduction,
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
          <span>{projectName}{isDirty ? " *" : ""}</span>
        </div>
      </div>
      <WorkspaceSwitcher value={workspaceId} onChange={onWorkspaceChange} />
      <nav className="top-actions" aria-label={t("topbar.mainActions")}>
        <ToolbarMenu label={t("topbar.menu.project")}>
          <MenuButton icon={<Wand2 size={16} />} label={t("topbar.newProject")} onClick={onNewProject} />
          <MenuButton icon={<LayoutTemplate size={16} />} label={t("topbar.templates")} onClick={onNewProjectFromTemplate} />
          <MenuButton icon={<FolderOpen size={16} />} label={t("topbar.loadProject")} onClick={onLoadProject} />
          <MenuButton icon={<Save size={16} />} label={t("topbar.saveProject")} onClick={onSaveProject} />
          <MenuButton icon={<Download size={16} />} label={t("topbar.export")} onClick={onOpenExport} />
        </ToolbarMenu>
        <ToolbarMenu label={t("topbar.menu.scene")}>
          <MenuButton icon={<FolderOpen size={16} />} label={t("topbar.openWorld")} onClick={onOpenWorld} />
          <MenuButton icon={<UserPlus size={16} />} label={t("topbar.addCharacter")} onClick={onAddCharacter} />
          <MenuButton icon={<Camera size={16} />} label={t("topbar.addCamera")} onClick={onAddCamera} />
          <MenuButton icon={<Box size={16} />} label={t("topbar.importObj")} onClick={onImportObj} />
        </ToolbarMenu>
        <ToolbarMenu label={t("topbar.menu.studios")}>
          <MenuButton icon={<UserPlus size={16} />} label={t("topbar.rigStudio")} onClick={onOpenRigStudio} />
          <MenuButton icon={<Sun size={16} />} label={t("topbar.lighting")} onClick={onOpenLightingStudio} />
          <MenuButton icon={<Sparkles size={16} />} label={t("topbar.vfxStudio")} onClick={onOpenVfxWorkspace} />
          <MenuButton icon={<Clapperboard size={16} />} label={t("topbar.production")} onClick={onOpenProduction} />
          <MenuButton icon={<Library size={16} />} label={t("topbar.assets")} onClick={onOpenAssets} />
          <MenuButton icon={<Music2 size={16} />} label={t("topbar.audio")} onClick={onOpenAudio} />
          <MenuButton icon={<Plug size={16} />} label={t("topbar.plugins")} onClick={onOpenPlugins} />
        </ToolbarMenu>
        <button type="button" className="primary-action" onClick={onTogglePlayback}>
          {isPlaying ? <Square size={16} /> : <Play size={16} />}
          {isPlaying ? t("topbar.pause") : t("topbar.play")}
        </button>
        <button type="button" onClick={onToggleRenderPreview} title={t("topbar.renderPreview")}>
          <Video size={16} />
          <span className="toolbar-label-wide">
            {renderPreviewEnabled ? t("topbar.viewport") : t("topbar.renderPreview")}
          </span>
        </button>
        <button type="button" onClick={onOpenCommands} title={t("topbar.commands")}>
          <Command size={16} /><span className="toolbar-label-wide">{t("topbar.commands")}</span>
        </button>
        <button type="button" onClick={onOpenSettings} title={t("topbar.settings")}>
          <Settings size={16} />
        </button>
        <button type="button" onClick={onOpenHelp} title={t("topbar.help")}>
          <HelpCircle size={16} />
        </button>
      </nav>
      <WorkspaceStatusIndicators
        dirty={isDirty}
        autosaveEnabled={autosaveEnabled}
        exporting={exporting}
        capabilityWarnings={capabilityWarnings}
      />
    </header>
  );
}

function ToolbarMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="toolbar-menu">
      <summary>{label}</summary>
      <div className="toolbar-menu-popover">{children}</div>
    </details>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick}>{icon}{label}</button>;
}

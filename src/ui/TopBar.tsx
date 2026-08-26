import {
  Box,
  Camera,
  Clapperboard,
  Command,
  Download,
  FolderOpen,
  Globe2,
  HelpCircle,
  LayoutTemplate,
  Library,
  Music2,
  Plug,
  Save,
  Settings,
  Sparkles,
  Sun,
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
  onGenerateWorld: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onAddCharacter: () => void;
  onAddCamera: () => void;
  onImportObj: () => void;
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
  onGenerateWorld,
  onSaveProject,
  onLoadProject,
  onAddCharacter,
  onAddCamera,
  onImportObj,
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
      {/*
        Blender's top bar is a single strip: app icon, menus, workspace tabs,
        then scene selectors at the right. It carries no branded title block —
        the application name lives in the window title, not the UI.
      */}
      <div className="brand" title="BlockMotion Studio (BMS)">
        <Clapperboard size={16} />
        <span className="sr-only">BlockMotion Studio BMS</span>
      </div>
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
          <MenuButton icon={<Globe2 size={16} />} label={t("topbar.generateWorld")} onClick={onGenerateWorld} />
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
        {/*
          Blender's top bar carries no coloured action and no transport: play
          lives in the timeline, so a second Play here was both a duplicate and
          the only accent in the strip. The rest go icon-only, as Blender's do.
        */}
        <button
          type="button"
          className="topbar-icon"
          onClick={onToggleRenderPreview}
          title={renderPreviewEnabled ? t("topbar.viewport") : t("topbar.renderPreview")}
          aria-label={renderPreviewEnabled ? t("topbar.viewport") : t("topbar.renderPreview")}
        >
          <Video size={15} />
        </button>
        <button
          type="button"
          className="topbar-icon"
          onClick={onOpenCommands}
          title={t("topbar.commands")}
          aria-label={t("topbar.commands")}
        >
          <Command size={15} />
        </button>
        <button
          type="button"
          className="topbar-icon"
          onClick={onOpenSettings}
          title={t("topbar.settings")}
          aria-label={t("topbar.settings")}
        >
          <Settings size={15} />
        </button>
        <button
          type="button"
          className="topbar-icon"
          onClick={onOpenHelp}
          title={t("topbar.help")}
          aria-label={t("topbar.help")}
        >
          <HelpCircle size={15} />
        </button>
      </nav>
      <WorkspaceSwitcher value={workspaceId} onChange={onWorkspaceChange} />
      {/* Blender puts scene/view-layer selectors here; ours shows the project. */}
      <div className="topbar-scene" title={projectName}>
        <span className="topbar-scene-name">{projectName}</span>
        {isDirty ? <span className="topbar-dirty" aria-hidden="true">*</span> : null}
      </div>
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

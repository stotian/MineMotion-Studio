import {
  Box,
  Camera,
  Clapperboard,
  Command,
  FolderOpen,
  HelpCircle,
  LayoutTemplate,
  Play,
  Plug,
  Save,
  Settings,
  Square,
  UserPlus,
  Video,
  Wand2
} from "lucide-react";

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
  onOpenHelp,
  onToggleRenderPreview
}: TopBarProps) {
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
      <nav className="top-actions" aria-label="Main actions">
        <button type="button" onClick={onNewProject}>
          <Wand2 size={16} />
          New Project
        </button>
        <button type="button" onClick={onNewProjectFromTemplate}>
          <LayoutTemplate size={16} />
          Templates
        </button>
        <button type="button" onClick={onOpenWorld}>
          <FolderOpen size={16} />
          Open World
        </button>
        <button type="button" onClick={onSaveProject}>
          <Save size={16} />
          Save Project
        </button>
        <button type="button" onClick={onLoadProject}>
          <FolderOpen size={16} />
          Load Project
        </button>
        <button type="button" onClick={onAddCharacter}>
          <UserPlus size={16} />
          Add Character
        </button>
        <button type="button" onClick={onAddCamera}>
          <Camera size={16} />
          Add Camera
        </button>
        <button type="button" onClick={onImportObj}>
          <Box size={16} />
          Import OBJ
        </button>
        <button type="button" className="primary-action" onClick={onTogglePlayback}>
          {isPlaying ? <Square size={16} /> : <Play size={16} />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={onOpenSettings}>
          <Settings size={16} />
          Settings
        </button>
        <button type="button" onClick={onOpenPlugins}>
          <Plug size={16} />
          Plugins
        </button>
        <button type="button" onClick={onOpenCommands}>
          <Command size={16} />
          Commands
        </button>
        <button type="button" onClick={onOpenHelp}>
          <HelpCircle size={16} />
          Help
        </button>
        <button type="button" onClick={onToggleRenderPreview}>
          <Video size={16} />
          {renderPreviewEnabled ? "Viewport" : "Render Preview"}
        </button>
      </nav>
    </header>
  );
}

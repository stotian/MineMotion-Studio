import {
  Box,
  Camera,
  Clapperboard,
  FolderOpen,
  Play,
  Save,
  Square,
  UserPlus,
  Video,
  Wand2
} from "lucide-react";

interface TopBarProps {
  projectName: string;
  isPlaying: boolean;
  onNewProject: () => void;
  onOpenWorld: () => void;
  onSaveProject: () => void;
  onLoadProject: () => void;
  onAddCharacter: () => void;
  onAddCamera: () => void;
  onImportObj: () => void;
  onTogglePlayback: () => void;
}

export function TopBar({
  projectName,
  isPlaying,
  onNewProject,
  onOpenWorld,
  onSaveProject,
  onLoadProject,
  onAddCharacter,
  onAddCamera,
  onImportObj,
  onTogglePlayback
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="brand">
        <Clapperboard size={22} />
        <div>
          <strong>MineMotion Studio</strong>
          <span>{projectName}</span>
        </div>
      </div>
      <nav className="top-actions" aria-label="Main actions">
        <button type="button" onClick={onNewProject}>
          <Wand2 size={16} />
          New Project
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
        <Video size={18} className="toolbar-status-icon" aria-hidden="true" />
      </nav>
    </header>
  );
}


export interface Command {
  id: string;
  title: string;
  group:
    | "Project"
    | "Scene"
    | "Timeline"
    | "View"
    | "Settings"
    | "Plugins"
    | "Effects"
    | "Render"
    | "Post";
  shortcut?: string;
  run: () => void;
}

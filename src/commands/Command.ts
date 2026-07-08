export interface Command {
  id: string;
  title: string;
  group: "Project" | "Scene" | "Timeline" | "View" | "Settings" | "Plugins";
  shortcut?: string;
  run: () => void;
}


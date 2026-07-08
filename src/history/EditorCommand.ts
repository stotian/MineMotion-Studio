export interface EditorCommand {
  id: string;
  label: string;
  run: () => void;
}


export interface ShortcutReferenceEntry { id: string; keys: string[]; descriptionKey: string; customizable: false; scope: "global" | "viewport" | "timeline"; }
export const SHORTCUT_REFERENCE: ShortcutReferenceEntry[] = [
  { id: "command-palette", keys: ["Ctrl", "K"], descriptionKey: "help.shortcut.commands", customizable: false, scope: "global" },
  { id: "save", keys: ["Ctrl", "S"], descriptionKey: "help.shortcut.save", customizable: false, scope: "global" },
  { id: "undo", keys: ["Ctrl", "Z"], descriptionKey: "help.shortcut.undo", customizable: false, scope: "global" },
  { id: "redo", keys: ["Ctrl", "Shift", "Z"], descriptionKey: "help.shortcut.redo", customizable: false, scope: "global" },
  { id: "play", keys: ["Space"], descriptionKey: "help.shortcut.play", customizable: false, scope: "timeline" },
  { id: "delete", keys: ["Delete"], descriptionKey: "help.shortcut.delete", customizable: false, scope: "global" }
];
export const SHORTCUT_CUSTOMIZATION_STATUS = "documented-mvp" as const;

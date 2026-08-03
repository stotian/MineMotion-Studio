import type { Command } from "../../commands/Command";

export interface ShortcutConflict {
  shortcut: string;
  commandIds: string[];
}

export function findShortcutConflicts(commands: readonly Command[]): ShortcutConflict[] {
  const byShortcut = new Map<string, string[]>();
  for (const command of commands) {
    const shortcut = command.shortcut?.trim().toLowerCase();
    if (!shortcut) continue;
    const ids = byShortcut.get(shortcut) ?? [];
    ids.push(command.id);
    byShortcut.set(shortcut, ids);
  }
  return [...byShortcut.entries()]
    .filter(([, commandIds]) => commandIds.length > 1)
    .map(([shortcut, commandIds]) => ({ shortcut, commandIds: [...commandIds].sort() }))
    .sort((left, right) => left.shortcut.localeCompare(right.shortcut));
}

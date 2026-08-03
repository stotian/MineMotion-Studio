export interface ContextualHelpEntry { id: string; titleKey: string; bodyKey: string; docPath: string; keywords: string[]; }
export const CONTEXTUAL_HELP: ContextualHelpEntry[] = [
  { id: "viewport", titleKey: "help.context.viewport.title", bodyKey: "help.context.viewport.body", docPath: "docs/QUICK_START.md#viewport", keywords: ["orbit","camera","select"] },
  { id: "timeline", titleKey: "help.context.timeline.title", bodyKey: "help.context.timeline.body", docPath: "docs/ANIMATION_GUIDE.md", keywords: ["keyframe","scrub","clip"] },
  { id: "vfx", titleKey: "help.context.vfx.title", bodyKey: "help.context.vfx.body", docPath: "docs/VFX_GUIDE.md", keywords: ["effect","preset","package"] },
  { id: "world", titleKey: "help.context.world.title", bodyKey: "help.context.world.body", docPath: "docs/WORLD_IMPORT_GUIDE.md", keywords: ["minecraft","chunk","resource pack"] },
  { id: "export", titleKey: "help.context.export.title", bodyKey: "help.context.export.body", docPath: "docs/EXPORT_GUIDE.md", keywords: ["render","ffmpeg","png","webm"] },
  { id: "recovery", titleKey: "help.context.recovery.title", bodyKey: "help.context.recovery.body", docPath: "docs/RECOVERY.md", keywords: ["autosave","crash","restore"] }
];
export function searchContextualHelp(query: string): ContextualHelpEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return CONTEXTUAL_HELP;
  return CONTEXTUAL_HELP.filter((entry) => [entry.id, ...entry.keywords].some((value) => value.includes(normalized)));
}

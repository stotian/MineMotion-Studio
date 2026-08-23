import { isTauriRuntimeAvailable } from "../core/capabilities/CapabilityRegistry";

export interface NativeOpenResult { path: string; name: string; data: Uint8Array; }
export interface NativeSaveOptions { suggestedName: string; extensions: string[]; data: Uint8Array; }

export async function openNativeProjectFile(extensions = ["minemotion", "mmsproj"]): Promise<NativeOpenResult | null> {
  if (!isTauriRuntimeAvailable()) return null;
  const [{ open }, { readFile }] = await Promise.all([import("@tauri-apps/plugin-dialog"), import("@tauri-apps/plugin-fs")]);
  const selected = await open({ multiple: false, directory: false, filters: [{ name: "BlockMotion Project", extensions }] });
  if (typeof selected !== "string") return null;
  return { path: selected, name: selected.split(/[\\/]/).pop() ?? "project.minemotion", data: await readFile(selected) };
}

export async function saveNativeFile(options: NativeSaveOptions): Promise<string | null> {
  if (!isTauriRuntimeAvailable()) return null;
  const [{ save }, { writeFile }] = await Promise.all([import("@tauri-apps/plugin-dialog"), import("@tauri-apps/plugin-fs")]);
  const selected = await save({ defaultPath: options.suggestedName, filters: [{ name: "MineMotion", extensions: options.extensions }] });
  if (!selected) return null;
  await writeFile(selected, options.data);
  return selected;
}

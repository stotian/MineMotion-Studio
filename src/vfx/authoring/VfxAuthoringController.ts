import {
  invalidResult,
  validResult,
  type ValidationIssue,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import type { VfxQuality } from "../core/VfxEvaluationContext";
import type { VfxTarget } from "../core/VfxInstance";
import { VFX_PRIMITIVE_VERSION, type VfxPrimitiveKind } from "../primitives/VfxPrimitiveTypes";
import { validateVfxAuthoringDocument } from "./VfxAuthoringDocument";
import {
  MAX_VFX_AUTHORING_STACK_ITEMS,
  type VfxAuthoringDocument,
  type VfxAuthoringModifier,
  type VfxAuthoringStackItem
} from "./VfxAuthoringTypes";

export type VfxAuthoringAddKind = VfxPrimitiveKind | VfxAuthoringModifier["kind"];

export interface VfxAuthoringSettingsPatch {
  displayName?: string;
  description?: string;
  durationFrames?: number;
  target?: VfxTarget | null;
  previewQuality?: VfxQuality;
  exportQuality?: VfxQuality;
}

export type VfxAuthoringCommand =
  | { type: "add"; item: VfxAuthoringStackItem; index?: number }
  | { type: "remove"; itemId: string }
  | { type: "reorder"; itemId: string; toIndex: number }
  | { type: "duplicate"; itemId: string; newItemId: string }
  | { type: "set-enabled"; itemId: string; enabled: boolean }
  | { type: "replace-item"; itemId: string; item: VfxAuthoringStackItem }
  | { type: "update-settings"; patch: VfxAuthoringSettingsPatch };

export interface VfxAuthoringMutation {
  document: VfxAuthoringDocument;
  changed: boolean;
  selectedItemId: string | null;
  historyLabel: string;
}

function issue(code: string, message: string, path: string): ValidationIssue {
  return { code, message, path, severity: "error" };
}

function fail(code: string, message: string, path: string): ValidationResult<VfxAuthoringMutation> {
  return invalidResult([issue(code, message, path)]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameData(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function commit(
  current: VfxAuthoringDocument,
  candidate: unknown,
  selectedItemId: string | null,
  historyLabel: string
): ValidationResult<VfxAuthoringMutation> {
  const validation = validateVfxAuthoringDocument(candidate);
  if (!validation.ok) return invalidResult(validation.errors, validation.warnings);
  if (sameData(current, validation.value)) {
    return validResult({ document: current, changed: false, selectedItemId, historyLabel }, validation.warnings);
  }
  return validResult({ document: validation.value, changed: true, selectedItemId, historyLabel }, validation.warnings);
}

function findItem(document: VfxAuthoringDocument, itemId: unknown): VfxAuthoringStackItem | null {
  return typeof itemId === "string" ? document.stack.find((item) => item.id === itemId) ?? null : null;
}

export function nextVfxAuthoringStackItemId(
  document: VfxAuthoringDocument,
  prefix: string
): string {
  const safePrefix = /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(prefix) ? prefix : "item";
  const ids = new Set(document.stack.map((item) => item.id));
  let index = 1;
  while (ids.has(`${safePrefix}:${index}`)) index += 1;
  return `${safePrefix}:${index}`;
}

export function createDefaultVfxAuthoringStackItem(
  kind: VfxAuthoringAddKind,
  id: string
): VfxAuthoringStackItem {
  const base = { id, label: kind, enabled: true };
  if (kind === "particle-emitter") {
    return { ...base, kind: "emitter", descriptor: { version: VFX_PRIMITIVE_VERSION, id, kind, color: "#ffffff", count: 24, shape: "sphere", radius: 1, speed: 1, lifetimeSeconds: 1, startSize: 0.12, endSize: 0.03, startOpacity: 1, endOpacity: 0 } };
  }
  if (kind === "beam") {
    return { ...base, kind: "primitive", descriptor: { version: VFX_PRIMITIVE_VERSION, id, kind, color: "#ffffff", start: [0, 0, 0], end: [0, 2, 0], subdivisions: 32, jitter: 0.08, width: 0.08, opacity: 1 } };
  }
  if (kind === "trail") {
    return { ...base, kind: "primitive", descriptor: { version: VFX_PRIMITIVE_VERSION, id, kind, color: "#ffffff", points: [[-1, 0, 0], [0, 1, 0], [1, 0, 0]], segments: 32, startWidth: 0.12, endWidth: 0.02, startOpacity: 1, endOpacity: 0 } };
  }
  if (kind === "expanding-ring") {
    return { ...base, kind: "primitive", descriptor: { version: VFX_PRIMITIVE_VERSION, id, kind, color: "#ffffff", center: [0, 0, 0], startRadius: 0.1, endRadius: 2, thickness: 0.08, segments: 48, startOpacity: 1, endOpacity: 0 } };
  }
  if (kind === "light-pulse") {
    return { ...base, kind: "primitive", descriptor: { version: VFX_PRIMITIVE_VERSION, id, kind, color: "#ffffff", center: [0, 0, 0], startRadius: 0.1, endRadius: 2, baseIntensity: 0, peakIntensity: 1 } };
  }
  const modifier: VfxAuthoringModifier = kind === "tint"
    ? { kind, color: "#ffffff" }
    : { kind, multiplier: kind === "opacity" ? 0.75 : 1.25 };
  return { ...base, kind: "modifier", modifier };
}

export function applyVfxAuthoringCommand(
  document: VfxAuthoringDocument | unknown,
  command: VfxAuthoringCommand | unknown
): ValidationResult<VfxAuthoringMutation> {
  const current = validateVfxAuthoringDocument(document);
  if (!current.ok) return invalidResult(current.errors, current.warnings);
  const value = current.value;
  if (!isRecord(command) || typeof command.type !== "string") return fail("VFX_AUTHORING_COMMAND_INVALID", "VFX authoring command is invalid.", "command");

  if (command.type === "add") {
    if (value.stack.length >= MAX_VFX_AUTHORING_STACK_ITEMS) return fail("VFX_AUTHORING_STACK_LIMIT_EXCEEDED", "VFX authoring stack is full.", "command.item");
    const index = command.index === undefined ? value.stack.length : command.index;
    if (!Number.isSafeInteger(index) || (index as number) < 0 || (index as number) > value.stack.length) return fail("VFX_AUTHORING_INDEX_INVALID", "Insert index is outside the stack.", "command.index");
    const stack = [...value.stack];
    stack.splice(index as number, 0, command.item as VfxAuthoringStackItem);
    return commit(value, { ...value, stack }, (command.item as VfxAuthoringStackItem)?.id ?? null, "Add VFX stack item");
  }
  if (command.type === "update-settings") {
    if (!isRecord(command.patch)) return fail("VFX_AUTHORING_PATCH_INVALID", "Settings patch is invalid.", "command.patch");
    const allowed = new Set(["displayName", "description", "durationFrames", "target", "previewQuality", "exportQuality"]);
    if (Object.keys(command.patch).some((key) => !allowed.has(key))) return fail("VFX_AUTHORING_PATCH_FIELD_UNSUPPORTED", "Settings patch contains an unsupported field.", "command.patch");
    return commit(value, { ...value, ...command.patch }, null, "Update VFX draft settings");
  }

  const item = findItem(value, command.itemId);
  if (!item) return fail("VFX_AUTHORING_ITEM_NOT_FOUND", "VFX stack item was not found.", "command.itemId");
  const index = value.stack.indexOf(item);
  if (command.type === "remove") {
    return commit(value, { ...value, stack: value.stack.filter((entry) => entry.id !== item.id) }, null, "Remove VFX stack item");
  }
  if (command.type === "set-enabled") {
    if (typeof command.enabled !== "boolean") return fail("VFX_AUTHORING_ENABLED_INVALID", "Enabled state must be boolean.", "command.enabled");
    const stack = value.stack.map((entry) => entry.id === item.id ? { ...entry, enabled: command.enabled as boolean } : entry);
    return commit(value, { ...value, stack }, item.id, "Toggle VFX stack item");
  }
  if (command.type === "reorder") {
    if (!Number.isSafeInteger(command.toIndex) || (command.toIndex as number) < 0 || (command.toIndex as number) >= value.stack.length) return fail("VFX_AUTHORING_INDEX_INVALID", "Destination index is outside the stack.", "command.toIndex");
    const stack = [...value.stack];
    stack.splice(index, 1);
    stack.splice(command.toIndex as number, 0, item);
    return commit(value, { ...value, stack }, item.id, "Reorder VFX stack item");
  }
  if (command.type === "duplicate") {
    if (typeof command.newItemId !== "string") return fail("VFX_AUTHORING_DUPLICATE_ID_INVALID", "Duplicate item ID is invalid.", "command.newItemId");
    const copy = structuredClone(item) as VfxAuthoringStackItem;
    copy.id = command.newItemId;
    copy.label = `${item.label} Copy`;
    if (copy.kind !== "modifier") copy.descriptor.id = command.newItemId;
    const stack = [...value.stack];
    stack.splice(index + 1, 0, copy);
    return commit(value, { ...value, stack }, copy.id, "Duplicate VFX stack item");
  }
  if (command.type === "replace-item") {
    if (!isRecord(command.item) || command.item.id !== item.id) return fail("VFX_AUTHORING_REPLACEMENT_INVALID", "Replacement must preserve the stack item ID.", "command.item");
    const stack = value.stack.map((entry) => entry.id === item.id ? command.item as VfxAuthoringStackItem : entry);
    return commit(value, { ...value, stack }, item.id, "Edit VFX stack item");
  }
  return fail("VFX_AUTHORING_COMMAND_UNSUPPORTED", `Unsupported VFX authoring command: ${command.type}.`, "command.type");
}

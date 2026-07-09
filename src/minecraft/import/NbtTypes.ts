export type NbtTagType =
  | "end"
  | "byte"
  | "short"
  | "int"
  | "long"
  | "float"
  | "double"
  | "byteArray"
  | "string"
  | "list"
  | "compound"
  | "intArray"
  | "longArray";

export interface NbtTag<T = unknown> {
  type: NbtTagType;
  name: string;
  value: T;
}

export type NbtCompound = Record<string, NbtTag>;

export function asCompound(tag: NbtTag | undefined): NbtCompound | null {
  return tag?.type === "compound" && isRecord(tag.value)
    ? (tag.value as NbtCompound)
    : null;
}

export function compoundValue(
  compound: NbtCompound,
  key: string
): NbtTag | undefined {
  return compound[key];
}

export function tagString(tag: NbtTag | undefined): string | undefined {
  return tag?.type === "string" ? String(tag.value) : undefined;
}

export function tagNumber(tag: NbtTag | undefined): number | undefined {
  return typeof tag?.value === "number" ? tag.value : undefined;
}

export function tagBigIntArray(tag: NbtTag | undefined): bigint[] | undefined {
  return tag?.type === "longArray" && Array.isArray(tag.value)
    ? (tag.value as bigint[])
    : undefined;
}

export function tagList<T = unknown>(tag: NbtTag | undefined): T[] | undefined {
  return tag?.type === "list" && Array.isArray(tag.value)
    ? (tag.value as T[])
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

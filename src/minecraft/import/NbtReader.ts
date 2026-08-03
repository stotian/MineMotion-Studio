import type { NbtTag, NbtTagType } from "./NbtTypes";

const TAG_NAMES: Record<number, NbtTagType> = {
  0: "end",
  1: "byte",
  2: "short",
  3: "int",
  4: "long",
  5: "float",
  6: "double",
  7: "byteArray",
  8: "string",
  9: "list",
  10: "compound",
  11: "intArray",
  12: "longArray"
};

export interface NbtReadLimits {
  readonly maxDepth: number;
  readonly maxCollectionLength: number;
  readonly maxStringBytes: number;
  readonly maxTags: number;
}

export const DEFAULT_NBT_READ_LIMITS: NbtReadLimits = Object.freeze({
  maxDepth: 64,
  maxCollectionLength: 1_048_576,
  maxStringBytes: 1_048_576,
  maxTags: 2_000_000
});

export class NbtReader {
  private offset = 0;
  private tagsRead = 0;

  constructor(
    private readonly view: DataView,
    private readonly limits: NbtReadLimits = DEFAULT_NBT_READ_LIMITS
  ) {}

  static parseUncompressed(
    buffer: ArrayBuffer | Uint8Array,
    limits: NbtReadLimits = DEFAULT_NBT_READ_LIMITS
  ): NbtTag {
    const view =
      buffer instanceof Uint8Array
        ? new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        : new DataView(buffer);
    return new NbtReader(view, limits).readNamedTag(0);
  }

  readNamedTag(depth = 0): NbtTag {
    this.ensureDepth(depth);
    this.tagsRead += 1;
    if (this.tagsRead > this.limits.maxTags) {
      throw new Error(`NBT tag count exceeds limit ${this.limits.maxTags}.`);
    }

    const tagId = this.readUnsignedByte();
    const type = TAG_NAMES[tagId];
    if (!type) {
      throw new Error(`Unsupported NBT tag id: ${tagId}.`);
    }
    if (type === "end") {
      return { type: "end", name: "", value: null };
    }

    const name = this.readString();
    return {
      type,
      name,
      value: this.readPayload(type, depth)
    };
  }

  private readPayload(type: NbtTagType, depth: number): unknown {
    switch (type) {
      case "byte":
        return this.readByte();
      case "short":
        return this.readShort();
      case "int":
        return this.readInt();
      case "long":
        return this.readLong();
      case "float":
        return this.readFloat();
      case "double":
        return this.readDouble();
      case "byteArray":
        return this.readByteArray();
      case "string":
        return this.readString();
      case "list":
        return this.readList(depth + 1);
      case "compound":
        return this.readCompound(depth + 1);
      case "intArray":
        return this.readIntArray();
      case "longArray":
        return this.readLongArray();
      case "end":
        return null;
    }
  }

  private readCompound(depth: number): Record<string, NbtTag> {
    this.ensureDepth(depth);
    const value: Record<string, NbtTag> = {};
    while (this.offset < this.view.byteLength) {
      const tag = this.readNamedTag(depth);
      if (tag.type === "end") break;
      value[tag.name] = tag;
    }
    return value;
  }

  private readList(depth: number): unknown[] {
    this.ensureDepth(depth);
    const tagId = this.readUnsignedByte();
    const type = TAG_NAMES[tagId];
    const length = this.readInt();
    if (!type) {
      throw new Error(`Unsupported NBT list tag id: ${tagId}.`);
    }
    this.ensureCollectionLength(length, "list");
    if (type === "end" && length > 0) {
      throw new Error("NBT end-tag lists must be empty.");
    }

    const items: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      items.push(this.readPayload(type, depth));
    }
    return items;
  }

  private readByteArray(): number[] {
    const length = this.readInt();
    this.ensureCollectionLength(length, "byte array");
    this.ensure(length);
    return Array.from({ length }, () => this.readByte());
  }

  private readIntArray(): number[] {
    const length = this.readInt();
    this.ensureCollectionLength(length, "int array");
    this.ensure(length * 4);
    return Array.from({ length }, () => this.readInt());
  }

  private readLongArray(): bigint[] {
    const length = this.readInt();
    this.ensureCollectionLength(length, "long array");
    this.ensure(length * 8);
    return Array.from({ length }, () => this.readLong());
  }

  private readString(): string {
    const length = this.readUnsignedShort();
    if (length > this.limits.maxStringBytes) {
      throw new Error(`NBT string length ${length} exceeds limit ${this.limits.maxStringBytes}.`);
    }
    this.ensure(length);
    const bytes = new Uint8Array(
      this.view.buffer,
      this.view.byteOffset + this.offset,
      length
    );
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  private readUnsignedByte(): number {
    this.ensure(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  private readByte(): number {
    this.ensure(1);
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  private readUnsignedShort(): number {
    this.ensure(2);
    const value = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return value;
  }

  private readShort(): number {
    this.ensure(2);
    const value = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return value;
  }

  private readInt(): number {
    this.ensure(4);
    const value = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return value;
  }

  private readLong(): bigint {
    this.ensure(8);
    const value = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return value;
  }

  private readFloat(): number {
    this.ensure(4);
    const value = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return value;
  }

  private readDouble(): number {
    this.ensure(8);
    const value = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return value;
  }

  private ensureCollectionLength(length: number, label: string): void {
    if (length < 0) throw new Error(`Invalid NBT ${label} length: ${length}.`);
    if (length > this.limits.maxCollectionLength) {
      throw new Error(
        `NBT ${label} length ${length} exceeds limit ${this.limits.maxCollectionLength}.`
      );
    }
  }

  private ensureDepth(depth: number): void {
    if (depth > this.limits.maxDepth) {
      throw new Error(`NBT nesting depth exceeds limit ${this.limits.maxDepth}.`);
    }
  }

  private ensure(byteLength: number): void {
    if (
      !Number.isSafeInteger(byteLength) ||
      byteLength < 0 ||
      this.offset + byteLength > this.view.byteLength
    ) {
      throw new Error("Unexpected end of NBT data.");
    }
  }
}

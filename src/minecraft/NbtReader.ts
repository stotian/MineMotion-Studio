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

export interface NbtTag {
  type: NbtTagType;
  name: string;
  value: unknown;
}

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

export class NbtReader {
  private offset = 0;

  constructor(private readonly view: DataView) {}

  static parseUncompressed(buffer: ArrayBuffer): NbtTag {
    return new NbtReader(new DataView(buffer)).readNamedTag();
  }

  readNamedTag(): NbtTag {
    const tagId = this.readUnsignedByte();
    const type = TAG_NAMES[tagId];
    if (!type || type === "end") {
      return { type: "end", name: "", value: null };
    }

    const name = this.readString();
    return {
      type,
      name,
      value: this.readPayload(type)
    };
  }

  private readPayload(type: NbtTagType): unknown {
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
        return this.readList();
      case "compound":
        return this.readCompound();
      case "intArray":
        return this.readIntArray();
      case "longArray":
        return this.readLongArray();
      case "end":
        return null;
    }
  }

  private readCompound(): Record<string, NbtTag> {
    const value: Record<string, NbtTag> = {};
    while (this.offset < this.view.byteLength) {
      const tag = this.readNamedTag();
      if (tag.type === "end") {
        break;
      }
      value[tag.name] = tag;
    }
    return value;
  }

  private readList(): unknown[] {
    const tagId = this.readUnsignedByte();
    const type = TAG_NAMES[tagId];
    const length = this.readInt();
    if (!type) {
      throw new Error(`Unsupported NBT list tag id: ${tagId}`);
    }

    const items: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      items.push(this.readPayload(type));
    }
    return items;
  }

  private readByteArray(): number[] {
    const length = this.readInt();
    return Array.from({ length }, () => this.readByte());
  }

  private readIntArray(): number[] {
    const length = this.readInt();
    return Array.from({ length }, () => this.readInt());
  }

  private readLongArray(): bigint[] {
    const length = this.readInt();
    return Array.from({ length }, () => this.readLong());
  }

  private readString(): string {
    const length = this.readUnsignedShort();
    const bytes = new Uint8Array(
      this.view.buffer,
      this.view.byteOffset + this.offset,
      length
    );
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  private readUnsignedByte(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  private readByte(): number {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  private readUnsignedShort(): number {
    const value = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return value;
  }

  private readShort(): number {
    const value = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return value;
  }

  private readInt(): number {
    const value = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return value;
  }

  private readLong(): bigint {
    const value = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return value;
  }

  private readFloat(): number {
    const value = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return value;
  }

  private readDouble(): number {
    const value = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return value;
  }
}


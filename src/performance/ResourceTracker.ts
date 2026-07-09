export interface ResourceSnapshot {
  geometries: number;
  materials: number;
  textures: number;
}

export class ResourceTracker {
  private geometries = new Set<unknown>();
  private materials = new Set<unknown>();
  private textures = new Set<unknown>();

  trackGeometry<T>(geometry: T): T {
    this.geometries.add(geometry);
    return geometry;
  }

  trackMaterial<T>(material: T): T {
    this.materials.add(material);
    return material;
  }

  trackTexture<T>(texture: T): T {
    this.textures.add(texture);
    return texture;
  }

  snapshot(): ResourceSnapshot {
    return {
      geometries: this.geometries.size,
      materials: this.materials.size,
      textures: this.textures.size
    };
  }

  clear(): void {
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
  }
}

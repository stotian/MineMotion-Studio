import {
  invalidResult,
  type ValidationResult
} from "../../core/serialization/ValidationResult";
import type { VfxDefinition } from "./VfxDefinition";
import type { VfxInstance } from "./VfxInstance";
import { validateVfxDefinition, validateVfxInstance } from "./VfxValidator";

function freezeDefinition(definition: VfxDefinition): VfxDefinition {
  const parameterSchema = definition.parameterSchema.map((parameter) =>
    Object.freeze(
      parameter.kind === "enum"
        ? { ...parameter, options: Object.freeze([...parameter.options]) }
        : { ...parameter }
    )
  );

  return Object.freeze({
    ...definition,
    parameterSchema: Object.freeze(parameterSchema),
    tags: Object.freeze([...definition.tags])
  });
}

export class VfxRegistry {
  private readonly definitions = new Map<string, VfxDefinition>();

  constructor(definitions: readonly VfxDefinition[] = []) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  register(definition: VfxDefinition): void {
    const validation = validateVfxDefinition(definition);
    if (!validation.ok) {
      throw new RangeError(
        `Invalid VFX definition ${definition.id || "<missing>"}: ${validation.errors
          .map((item) => item.message)
          .join(" ")}`
      );
    }
    if (this.definitions.has(definition.id)) {
      throw new RangeError(`VFX definition is already registered: ${definition.id}`);
    }
    this.definitions.set(definition.id, freezeDefinition(definition));
  }

  get(id: string): VfxDefinition | null {
    return this.definitions.get(id) ?? null;
  }

  list(): readonly VfxDefinition[] {
    return Array.from(this.definitions.values());
  }

  validateInstance(instance: VfxInstance): ValidationResult<VfxInstance> {
    const definition = this.get(instance.definitionId);
    if (!definition) {
      return invalidResult([
        {
          code: "VFX_DEFINITION_NOT_FOUND",
          message: `VFX definition was not found: ${instance.definitionId}`,
          path: "definitionId",
          severity: "error"
        }
      ]);
    }
    return validateVfxInstance(instance, definition);
  }
}

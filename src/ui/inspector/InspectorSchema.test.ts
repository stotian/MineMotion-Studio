import { describe, expect, it } from "vitest";
import { createTransform } from "../../project/ProjectFile";
import { TRANSFORM_VECTOR_SCHEMA, updateTransformVector, validateInspectorSchema } from "./InspectorSchema";

describe("inspector schema", () => {
  it("defines one valid field for each transform vector", () => {
    expect(validateInspectorSchema()).toEqual([]);
    expect(TRANSFORM_VECTOR_SCHEMA.map((field) => field.id)).toEqual(["position", "rotation", "scale"]);
  });

  it("updates only the selected transform vector", () => {
    const transform = createTransform();
    const next = updateTransformVector(transform, "position", [1, 2, 3]);
    expect(next.position).toEqual([1, 2, 3]);
    expect(next.rotation).toEqual(transform.rotation);
    expect(next.scale).toEqual(transform.scale);
  });
});

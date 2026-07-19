import { describe, expect, it } from "vitest";
import {
  MAX_VFX_PARAMETER_ID_LENGTH,
  MAX_VFX_PARAMETER_STRING_LENGTH
} from "../core/VfxParameter";
import type { VfxParameterSchema } from "../core/VfxParameterSchema";
import {
  buildVfxParameterControlModel,
  createVfxParameterPatch,
  parseVfxParameterControlDraft
} from "./VfxParameterControlModel";

const schema: VfxParameterSchema = [
  {
    id: "amount",
    displayName: "Amount",
    description: "A bounded amount.",
    category: "Timing",
    animatable: true,
    kind: "number",
    defaultValue: 0.5,
    min: 0,
    max: 1,
    step: 0.1,
    unit: "seconds"
  },
  {
    id: "count",
    displayName: "Count",
    animatable: true,
    kind: "integer",
    defaultValue: 2,
    min: 0,
    max: 8,
    step: 1
  },
  {
    id: "enabled",
    displayName: "Enabled",
    animatable: false,
    kind: "boolean",
    defaultValue: true
  },
  {
    id: "tint",
    displayName: "Tint",
    animatable: true,
    kind: "color",
    defaultValue: "#aabbcc"
  },
  {
    id: "mode",
    displayName: "Mode",
    animatable: false,
    kind: "enum",
    defaultValue: "forward",
    options: ["forward", "radial"]
  }
];

function requireModel(
  result: ReturnType<typeof buildVfxParameterControlModel>
) {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.errors.map((error) => error.code).join(", "));
  return result.value;
}

describe("VfxParameterControlModel", () => {
  it("projects every currently supported schema kind with exact metadata", () => {
    const model = requireModel(
      buildVfxParameterControlModel(
        schema,
        {
          amount: 0.75,
          count: 4,
          enabled: false,
          tint: "#123456",
          mode: "radial"
        },
        {
          runtimeSupportById: {
            amount: "live-preview",
            mode: "stored-only"
          }
        }
      )
    );

    expect(model.controls.map((control) => control.kind)).toEqual([
      "number",
      "integer",
      "boolean",
      "color",
      "enum"
    ]);
    expect(model.controls[0]).toMatchObject({
      id: "amount",
      value: 0.75,
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.1,
      unit: "seconds",
      category: "Timing",
      animatable: true,
      runtimeSupport: "live-preview",
      source: "instance"
    });
    expect(model.controls[4]).toMatchObject({
      id: "mode",
      value: "radial",
      options: ["forward", "radial"],
      runtimeSupport: "stored-only"
    });
    expect(model.unknownParameters).toEqual([]);
  });

  it("uses defaults without mutating missing values and retains unknown legacy values", () => {
    const parameters = JSON.parse(
      '{"legacyExtra":42,"__proto__":"preserved"}'
    ) as Record<string, string | number>;
    const before = structuredClone(parameters);
    const model = requireModel(buildVfxParameterControlModel(schema, parameters));

    expect(model.controls.map((control) => control.source)).toEqual([
      "default",
      "default",
      "default",
      "default",
      "default"
    ]);
    expect(model.controls.map((control) => control.value)).toEqual([
      0.5,
      2,
      true,
      "#aabbcc",
      "forward"
    ]);
    expect(model.unknownParameters).toEqual([
      { id: "__proto__", value: "preserved" },
      { id: "legacyExtra", value: 42 }
    ]);
    expect(parameters).toEqual(before);
  });

  it("marks legacy-invalid values repairable without silently normalizing them", () => {
    const model = requireModel(
      buildVfxParameterControlModel(schema, {
        amount: 7,
        count: 2.5,
        enabled: "yes",
        tint: "red",
        mode: "sideways"
      } as never)
    );

    expect(model.controls.map((control) => control.source)).toEqual([
      "invalid-legacy",
      "invalid-legacy",
      "invalid-legacy",
      "instance",
      "invalid-legacy"
    ]);
    expect(model.controls[0]).toMatchObject({ value: 7, storedValue: 7 });
    expect(model.controls[1]).toMatchObject({ value: 2.5, storedValue: 2.5 });
    expect(model.controls[2]).toMatchObject({ value: true, storedValue: "yes" });
    expect(model.controls[4]).toMatchObject({ value: "sideways", storedValue: "sideways" });
    expect(createVfxParameterPatch(model.controls[2], true)).toEqual({
      ok: true,
      value: { enabled: true },
      warnings: []
    });
    expect(createVfxParameterPatch(model.controls[4], "forward")).toEqual({
      ok: true,
      value: { mode: "forward" },
      warnings: []
    });
  });

  it("rejects hostile or sparse schema data without invoking getters", () => {
    const accessor = {} as Record<string, unknown>;
    Object.defineProperty(accessor, "id", {
      enumerable: true,
      get() {
        throw new Error("must not execute");
      }
    });
    Object.assign(accessor, {
      displayName: "Unsafe",
      animatable: true,
      kind: "number",
      defaultValue: 1
    });
    const sparseSchema = new Array(1) as unknown as VfxParameterSchema;
    const sparseOptions = ["forward", , "radial"] as unknown as string[];

    expect(() =>
      buildVfxParameterControlModel([accessor] as unknown as VfxParameterSchema, {})
    ).not.toThrow();
    expect(
      buildVfxParameterControlModel([accessor] as unknown as VfxParameterSchema, {}).ok
    ).toBe(false);
    expect(buildVfxParameterControlModel(sparseSchema, {}).ok).toBe(false);
    expect(
      buildVfxParameterControlModel(
        [{ ...schema[4], options: sparseOptions }],
        {}
      ).ok
    ).toBe(false);

    let oversizedEntryRead = false;
    const oversized = new Array(65).fill(schema[0]);
    Object.defineProperty(oversized, "0", {
      enumerable: true,
      get() {
        oversizedEntryRead = true;
        throw new Error("must not execute");
      }
    });
    expect(buildVfxParameterControlModel(oversized, {}).ok).toBe(false);
    expect(oversizedEntryRead).toBe(false);

    const revocable = Proxy.revocable(schema as VfxParameterSchema, {});
    revocable.revoke();
    expect(() =>
      buildVfxParameterControlModel(revocable.proxy, {})
    ).not.toThrow();
    expect(buildVfxParameterControlModel(revocable.proxy, {}).ok).toBe(false);

    let runtimeGetterInvoked = false;
    const runtimeSupport = {} as Record<string, unknown>;
    Object.defineProperty(runtimeSupport, "amount", {
      enumerable: true,
      get() {
        runtimeGetterInvoked = true;
        throw new Error("must not execute");
      }
    });
    expect(() =>
      buildVfxParameterControlModel(schema, {}, {
        runtimeSupportById: runtimeSupport as never
      })
    ).not.toThrow();
    expect(
      buildVfxParameterControlModel(schema, {}, {
        runtimeSupportById: runtimeSupport as never
      }).ok
    ).toBe(false);
    expect(runtimeGetterInvoked).toBe(false);
  });

  it("aligns schema IDs and committed text with controller bounds", () => {
    const acceptedId = `a${"b".repeat(MAX_VFX_PARAMETER_ID_LENGTH - 1)}`;
    const rejectedId = `${acceptedId}c`;
    expect(
      buildVfxParameterControlModel(
        [{ ...schema[0], id: acceptedId }],
        {}
      ).ok
    ).toBe(true);
    expect(
      buildVfxParameterControlModel(
        [{ ...schema[0], id: rejectedId }],
        {}
      ).ok
    ).toBe(false);

    const longestValue = "x".repeat(MAX_VFX_PARAMETER_STRING_LENGTH);
    const model = requireModel(
      buildVfxParameterControlModel(
        [
          {
            ...schema[4],
            defaultValue: longestValue,
            options: [longestValue]
          }
        ],
        {}
      )
    );
    const boundedEnum = model.controls[0];
    expect(
      parseVfxParameterControlDraft(
        boundedEnum,
        longestValue
      ).ok
    ).toBe(true);
    expect(
      parseVfxParameterControlDraft(
        boundedEnum,
        "x".repeat(MAX_VFX_PARAMETER_STRING_LENGTH + 1)
      ).ok
    ).toBe(false);
  });

  it("accepts safe color tokens and rejects CSS resource or function syntax", () => {
    const model = requireModel(buildVfxParameterControlModel(schema, {}));
    const color = model.controls[3];

    for (const value of [
      "red",
      "rebeccapurple",
      "#abc",
      "#abcd",
      "#aabbcc",
      "#aabbccdd"
    ]) {
      expect(parseVfxParameterControlDraft(color, value).ok).toBe(true);
    }
    for (const value of [
      "url(https://example.test/pixel)",
      "linear-gradient(red, blue)",
      "rgb(255, 0, 0)",
      "red; background: url(http://localhost/)"
    ]) {
      expect(parseVfxParameterControlDraft(color, value).ok).toBe(false);
    }
  });

  it("rejects malformed controls explicitly without throwing", () => {
    const model = requireModel(buildVfxParameterControlModel(schema, {}));
    const accessor = { ...model.controls[0] } as Record<string, unknown>;
    Object.defineProperty(accessor, "id", {
      enumerable: true,
      get() {
        throw new Error("must not execute");
      }
    });
    expect(() =>
      parseVfxParameterControlDraft(accessor as never, "0.5")
    ).not.toThrow();
    expect(parseVfxParameterControlDraft(accessor as never, "0.5").ok).toBe(
      false
    );

    const revocable = Proxy.revocable(model.controls[0] as object, {});
    revocable.revoke();
    expect(() =>
      createVfxParameterPatch(revocable.proxy as never, "0.5")
    ).not.toThrow();
    expect(
      createVfxParameterPatch(revocable.proxy as never, "0.5").ok
    ).toBe(false);
  });

  it("parses committed drafts and returns only one single-key patch", () => {
    const model = requireModel(buildVfxParameterControlModel(schema, {}));
    const amount = model.controls[0];
    const count = model.controls[1];
    const mode = model.controls[4];

    const valid = parseVfxParameterControlDraft(amount, "0.75");
    expect(valid).toEqual({ ok: true, value: 0.75, warnings: [] });
    if (!valid.ok) return;
    expect(createVfxParameterPatch(amount, valid.value)).toEqual({
      ok: true,
      value: { amount: 0.75 },
      warnings: []
    });

    expect(parseVfxParameterControlDraft(amount, "Infinity").ok).toBe(false);
    expect(parseVfxParameterControlDraft(amount, "2").ok).toBe(false);
    expect(parseVfxParameterControlDraft(count, "2.5").ok).toBe(false);
    expect(parseVfxParameterControlDraft(mode, "sideways").ok).toBe(false);
  });
});

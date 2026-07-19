# Phase 17.1 - VFX Authoring Architecture

## Requirements and boundaries

The authoring model must be structured-cloneable, deterministic, bounded to 16
stack items, reusable by preview/export, and unable to contain executable code.
It must preserve the existing effect collection, Primitive V1 runtime, recipe
registry, schema 10 persistence, and immutable built-in catalog. Package parsing,
local installation, a node graph, and unrestricted shaders are later milestones.

## Options considered

### A. Declarative stack over Primitive V1 - selected

```text
immutable built-in recipe -> evaluated descriptor clone -> authoring document
                                                       -> stack controller (17.2)
                                                       -> existing VFX runtime
```

Pros: reuses validated runtime data, remains JSON-safe, gives packages no code
execution surface, and supports incremental editing. Cons: modifiers need an
explicit compiler and cannot express arbitrary programs. Estimated foundation:
one milestone; editing/compiler: one additional milestone.

### B. Persist recipe callback implementations

Pros: preserves every built-in recipe's dynamic behavior. Cons: requires
serializing or executing JavaScript, breaks the package security boundary, and
is not portable. Estimated effort is low initially but unacceptable risk.

### C. Visual node graph and interpreter first

Pros: broad future expressiveness. Cons: much larger validation and UX surface,
unclear execution budgets, and duplicates stack needs before stack semantics are
stable. Estimated effort: multiple phases. Deferred by the completion pack.

## Components and failure handling

- `VfxAuthoringTypes` owns the versioned discriminated data contract.
- `VfxAuthoringDocument` validates, clones, freezes, and derives safe drafts.
- `VfxWorkspacePanel` owns transient workspace state; `App` only opens it.
- Existing primitive validation rejects malformed descriptors and over-budget
  fields. Authoring validation rejects unsupported versions, IDs, targets,
  qualities, modifiers, duplicate items, excess items, and executable values.
- Built-ins are evaluated then cloned. The source catalog is never edited.

## ADR - Use a declarative stack over existing Primitive V1

Status: Accepted in Phase 17.1.

Context: creators need portable custom VFX without arbitrary code or a parallel
effects architecture.

Decision: store authoring as a versioned immutable document containing source
metadata, existing VFX placement/quality settings, and discriminated primitive,
emitter, or restricted modifier items. Compile it into existing runtime
descriptors; do not serialize recipe callbacks or introduce a node graph.

Consequences: custom authoring is safe and incrementally testable, while some
advanced procedural behavior remains unavailable until deliberately modeled as
validated declarative operations.

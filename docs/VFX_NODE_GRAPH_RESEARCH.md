# Visual VFX Node Graph Research Decision

## Decision

Do not add a node-graph editor or runtime in Phase 17. The stable ordered stack
already covers the shipped authoring operations, compiles to the current
Primitive V1 contract, serializes safely, and has deterministic package/runtime
evidence. A graph would currently add two representations and migration risk
without enabling a supported primitive or renderer capability.

This is a deliberate deferment, not a rejection of visual graphs forever.

## Evidence from the stable stack

| Concern | Stable stack today | Graph cost today |
| --- | --- | --- |
| Data model | One bounded discriminated list, maximum 16 items | Nodes, ports, edges, ordering, cycle rules, layout, and graph migrations |
| Evaluation | Linear deterministic compilation to Primitive V1 | Topological evaluation plus deterministic tie-breaking and error propagation |
| Persistence | Authoring V1 and package manifest V1 are tested byte-stably | A second versioned format or a breaking document-version migration |
| Security | No callback/source field; closed modifier schemas | Every node and connection needs closed schemas and work accounting |
| Runtime | Existing recipe preflight, allocator, evaluator, preview/export | No supported runtime operation currently requires branching dataflow |
| UX | Add/reorder/duplicate/enable/edit is complete and explainable | Pan/zoom, selection, wires, keyboard access, validation, and repair UI |

The current modifiers intentionally affect enabled descriptors above them.
That ordering is visible, portable, and easy to budget. Recreating the same
behavior as nodes would be a cosmetic alternate editor, which violates the rule
against parallel architectures.

## Entry criteria for a future graph

A graph proposal may advance only when at least one accepted product capability
cannot be represented clearly by the ordered stack, such as typed multi-input
curves, reusable subgraphs, or branching event/envelope composition. Before UI
work starts, the proposal must provide:

1. a versioned, closed, structured-cloneable graph schema;
2. bounded node/edge/port counts, acyclic evaluation, and deterministic ordering;
3. exact per-node work accounting before primitive allocation;
4. a canonical graph-to-existing-stack/Primitive V1 compiler where possible;
5. migration and downgrade behavior with no built-in or schema 10 data loss;
6. package security rules that still exclude code and unrestricted shaders;
7. accessibility and repair behavior for disconnected/unknown nodes;
8. preview/export parity and adversarial round-trip tests before stable status.

The first future step should be a read-only graph projection or an isolated
schema/compiler prototype, not a second project collection and not a new runtime.
Until those entry criteria are met, the ordered stack remains the sole custom
authoring authority.

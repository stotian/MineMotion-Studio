# Phase 17.2 - VFX Stack Editing And Compilation

The dedicated VFX Studio now performs real immutable draft edits:

- add supported emitters, primitives, tint, opacity, and scale modifiers;
- reorder, duplicate, enable/disable, delete, relabel, and edit primary values;
- edit duration, entity/bone target, preview quality, and export quality;
- compile enabled stack items into validated Primitive V1 descriptors;
- render deterministic SVG previews through the shared descriptor renderer.

Modifiers apply in stack order to all enabled descriptors above them. Tint
replaces safe colors, opacity scales supported opacity fields, and scale adjusts
supported spatial scalar/vector fields. Disabled items do not compile. Every
candidate document and compiled descriptor is revalidated, deeply frozen, and
checked against primitive and global single-effect budgets.

No custom draft mutates its built-in source. The milestone adds no executable
content, shader source, node graph, or parallel effect/project collection.

# Phase 31 — Templates, samples, and creator content

MineMotion ships nine production-oriented starter templates: empty, dialogue, fight, horror, chase, boss, trailer, thumbnail, and vertical. Each template is versioned and carries preview, dependency, estimated-size, attribution, and license metadata.

All first-party sample content is generated from original MineMotion geometry, metadata, oscillator placeholders, and procedural effects. No Mojang or Microsoft texture, skin, model, audio, world, or other proprietary asset is bundled.

The creator packs are data-only. Custom templates use the bounded `minemotion-template` JSON envelope and pass through the normal project serializer on import. The template validator checks required IDs, legal metadata, and forbidden proprietary references.

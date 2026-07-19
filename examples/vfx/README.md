# Safe VFX Examples

These examples are complete `.minemotion-vfx` packages built only from the
declarative stack and Primitive V1 contracts accepted by MineMotion Studio.
They contain no JavaScript, shader source, executable plugin, or external asset.

| Package | Purpose | Source |
| --- | --- | --- |
| `minemotion.examples.ember-ring.minemotion-vfx` | Particles, expanding ring, light pulse, opacity modifier | `sources/ember-ring.effect.json` |
| `minemotion.examples.soul-portal.minemotion-vfx` | Ring, trail, particles, tint modifier | `sources/soul-portal.effect.json` |

Import a package with **VFX Studio → Inspect Package**. Review the generated
preview, license, permissions, dependencies, assets, and work budget before
choosing **Install Package Locally**. Enabled packages then appear under
**Effects → Custom**.

Rebuild and verify all archives from their source documents with:

```powershell
npm run generate:vfx-examples
```

The generator uses the production writer and bounded reader, compares exact
bytes, and updates `checksums.json`. Running it repeatedly must keep the same
archives and SHA-256 values. A changed checksum therefore requires an intentional
source or package-format review.

CI or reviewers can perform a read-only drift check with
`npm run verify:vfx-examples`.

The examples use CC0-1.0 metadata so their source data can be copied freely.
Minecraft-owned textures, sounds, models, and other proprietary assets are not
included.

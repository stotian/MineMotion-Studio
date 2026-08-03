# Plugin SDK 1.0

Use `packages/minemotion-plugin-sdk`. Data-only packages should call `defineContentPack`; worker extensions call `defineLogicPlugin`. Run `node scripts/validate-extension-package.mjs <manifest-or-pack.json>` before distribution. The host accepts only documented permissions and rejects traversal paths and direct system capabilities. Logic plugins remain disabled until trusted and run through message passing; they cannot access MineMotion internals directly.

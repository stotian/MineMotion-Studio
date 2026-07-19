import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["scripts/VfxExamplePackages.test.ts"]
  }
});

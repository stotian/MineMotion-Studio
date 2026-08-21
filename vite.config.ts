import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "three-runtime";
          if (id.includes("node_modules/lucide-react/")) return "ui-icons";
          if (id.includes("node_modules/react-dom/") || id.includes("node_modules/react/")) return "react-runtime";
        }
      }
    }
  },
  clearScreen: false,
  server: {
    strictPort: false,
    port: 5173
  }
});

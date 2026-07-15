import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function offlineAssetManifest(): Plugin {
  return {
    name: "offline-asset-manifest",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
        .map((file) => `/${file}`);
      this.emitFile({
        type: "asset",
        fileName: "asset-manifest.json",
        source: JSON.stringify(assets),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineAssetManifest()],
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});

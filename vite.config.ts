import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function offlineAssetManifest(): Plugin {
  let base = "/";

  return {
    name: "offline-asset-manifest",
    configResolved(config) {
      base = config.base;
    },
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
        .sort()
        .map((file) => `${base}${file}`);
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

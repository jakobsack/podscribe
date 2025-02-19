import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

// https://rsbuild.dev/guide/basic/configure-rsbuild
export default defineConfig({
  plugins: [pluginReact()],
  html: {
    favicon: "src/assets/favicon.ico",
    title: "Podscribe",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5150",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

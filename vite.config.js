// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  // Your Vite configuration
  server: {
    proxy: {
      // Proxy API requests to your Express server
      "/api": "http://localhost:8000",
    },
  },
  build: {
    outDir: "dist", // Specify the output directory for build files
  },
});

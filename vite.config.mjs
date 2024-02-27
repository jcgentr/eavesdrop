// vite.config.js
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";

export default defineConfig({
  // Your Vite configuration
  server: {
    proxy: {
      // Proxy /clients route to Express server
      "/clients": {
        target: "http://localhost:8000", // Your Express server
        changeOrigin: true,
        secure: false,
      },
      // Proxy /peerjs route to Express server
      "/peerjs": {
        target: "http://localhost:8000", // Your Express server
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:8000", // Your Express server
        ws: true, // Proxy websockets
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist", // Specify the output directory for build files
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),
  ],
});

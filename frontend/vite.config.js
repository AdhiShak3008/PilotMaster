import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173 
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-plotly": ["plotly.js", "react-plotly.js"],
          "vendor-charts": ["recharts"],
          "vendor-markdown": ["react-markdown", "rehype-raw", "remark-gfm"],
        },
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    // @solana/web3.js uses Node globals (Buffer, process, crypto) in the browser
    nodePolyfills({
      include: ["buffer", "crypto", "stream", "util"],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
});

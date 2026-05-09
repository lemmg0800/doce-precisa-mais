import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  vite: {
    server: {
      host: true,
      port: 3000,
      strictPort: false,
    },
  },
});

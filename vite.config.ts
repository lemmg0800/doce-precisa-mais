import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const STATIC_ROUTES = [
  "auth",
  "assinatura",
  "sucesso",
  "cancelado",
  "materias-primas",
  "produtos",
  "receitas",
  "kits",
  "configuracoes",
];

function prerenderStaticRoutes() {
  return {
    name: "prerender-static-routes",
    apply: "build" as const,
    closeBundle() {
      const distDir = resolve(process.cwd(), "dist");
      const indexPath = resolve(distDir, "index.html");
      let html: string;
      try {
        html = readFileSync(indexPath, "utf8");
      } catch {
        return;
      }
      for (const route of STATIC_ROUTES) {
        const dir = resolve(distDir, route);
        mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, "index.html"), html);
      }
      console.log(
        `[prerender] wrote ${STATIC_ROUTES.length} route HTML shells`,
      );
    },
  };
}

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    prerenderStaticRoutes(),
  ],
  server: {
    host: true,
    port: 3000,
    strictPort: false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-router"],
  },
});

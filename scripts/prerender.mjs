// Pós-build: para cada rota declarada em src/routes/, copia dist/index.html
// para dist/<rota>/index.html. Garante que a hospedagem estática sempre
// encontra um arquivo, mesmo sem fallback SPA configurado.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "dist");
const routesDir = join(root, "src", "routes");
const indexHtml = join(distDir, "index.html");

if (!existsSync(indexHtml)) {
  console.error("[prerender] dist/index.html não encontrado. Pulei.");
  process.exit(0);
}

const html = readFileSync(indexHtml, "utf8");

// Coleta nomes de rota a partir de arquivos como `auth.tsx`, `materias-primas.tsx`.
// Ignora `__root.tsx`, `index.tsx` e arquivos com `.` (segmentos) ou `$` (params).
const routeNames = readdirSync(routesDir)
  .filter((f) => /\.tsx?$/.test(f))
  .map((f) => f.replace(/\.tsx?$/, ""))
  .filter((name) => {
    if (name === "__root" || name === "index") return false;
    if (name.startsWith("_")) return false;
    if (name.includes(".")) return false;
    if (name.includes("$")) return false;
    return true;
  });

let count = 0;
for (const name of routeNames) {
  const dir = join(distDir, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  count++;
}

console.log(`[prerender] Gerou ${count} HTML(s) de rota:`, routeNames.join(", "));

export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Erro inesperado</title>
<style>
  :root { color-scheme: light dark; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: grid; place-items: center; padding: 2rem;
    background: #faf7f2; color: #2a1f15;
  }
  .card { max-width: 28rem; text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
  p { color: #6b5a48; margin: 0 0 1.5rem; }
  .actions { display: flex; gap: 0.75rem; justify-content: center; }
  button, a {
    display: inline-block; padding: 0.6rem 1rem; border-radius: 0.5rem;
    font-size: 0.9rem; font-weight: 500; cursor: pointer; text-decoration: none;
    border: 1px solid #d4c4b0; background: #fff; color: #2a1f15;
  }
  button.primary { background: #6b4423; color: #fff; border-color: #6b4423; }
</style>
</head>
<body>
  <div class="card">
    <h1>Algo deu errado</h1>
    <p>Ocorreu um erro inesperado ao carregar esta página. Tente novamente em alguns instantes.</p>
    <div class="actions">
      <button class="primary" onclick="window.location.reload()">Tentar novamente</button>
      <a href="/">Ir para início</a>
    </div>
  </div>
</body>
</html>`;
}

## Objetivo

Resolver os 3 itens que sobraram da revisão de SEO/acessibilidade e te guiar no único passo que precisa de você (Google Search Console).

## O que vou fazer (sem precisar de você)

### 1. Landmark `<main>` em todas as páginas
Páginas que ainda não têm `<main>`: `assinatura.tsx`, `sucesso.tsx`, `cancelado.tsx`. Trocar a `<div>` raiz por `<main>` em cada uma. Páginas que usam `AppShell` já estão cobertas.

### 2. `aria-label` em botões só com ícone
Adicionar nome acessível em todos os botões `size="icon"` que hoje só mostram um ícone (Pencil/Trash2/Copy/Check/X), nos arquivos:
- `src/routes/produtos.tsx` (Copiar, Excluir)
- `src/routes/receitas.tsx` (Copiar, Excluir)
- `src/routes/kits.tsx` (Copiar, Excluir)
- `src/routes/materias-primas.tsx` (Editar, Excluir)
- `src/routes/configuracoes.tsx` (Salvar, Cancelar, Editar, Excluir gasto fixo)
- `src/components/CategoriasManagerDialog.tsx` (Editar, Excluir, Salvar, Cancelar, mover ↑/↓)
- `src/components/KitFormDialog.tsx`, `ProdutoFormDialog.tsx`, `ReceitaFormDialog.tsx` (Remover item)

### 3. Marcar findings de a11y como corrigidos
Após as edições, marcar `lighthouse:lighthouse_accessibility` e `agent_content:content` como fixed na revisão de SEO.

## O que precisa de você

### Conectar o Google Search Console
É o último item de SEO restante e depende do seu login Google. Quando você disser para seguir, eu disparo o conector e ele vai te pedir para autorizar a conta. Depois disso, você só precisa:

1. Autorizar a conexão no popup que vai aparecer.
2. Verificar a propriedade do domínio `https://preciflow.lovable.app/` no Google Search Console (eu te passo o passo a passo).
3. Submeter o sitemap `https://preciflow.lovable.app/sitemap.xml` (eu também te oriento).

### Republicar o app
Os scans de SEO/Lighthouse rodam em cima da versão **publicada**, não da preview. Depois que eu terminar, você precisa clicar em **Publish → Update** no canto superior direito para que as correções entrem no ar e sumam da próxima varredura.

## Posso seguir?
Se aprovar, eu executo os passos 1–3 agora e depois te aviso para republicar e iniciar a conexão do Search Console.
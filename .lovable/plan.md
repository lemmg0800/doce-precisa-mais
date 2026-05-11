
# Landing Page do Preciflow

## Objetivo
Criar uma página pública, isolada do sistema autenticado, que apresente o Preciflow para pequenos produtores de alimentos artesanais e converta visitantes em contas de teste grátis.

## Público-alvo (ampliado)
A landing fala com qualquer pequeno empreendedor que produz e vende alimentos:
- confeiteiros e docerias
- hamburguerias artesanais
- cafeterias
- food trucks
- açaiterias
- pizzarias artesanais, marmitarias, padarias caseiras
- produtores caseiros em geral

A copy evita se restringir a "doces/confeitaria" e usa termos amplos: "produtos", "receitas", "ingredientes", "ficha técnica", "negócio de comida".

## Decisão de rota
Hoje `/` (`src/routes/index.tsx`) é o app autenticado (dashboard). Para isolar a landing:

- Criar **`/landing`** como rota pública (adicionada à lista `PUBLIC_PATHS` em `src/routes/__root.tsx`).
- Todos os CTAs apontam para `/auth` (cadastro/login).
- A rota não usa `AccessGate`, não exige sessão e não carrega o `AppShell`.

A landing fica acessível em `preciflow.lovable.app/landing` para divulgação externa. O fluxo dos usuários já cadastrados em `/` permanece intacto.

## Estrutura da página (`src/routes/landing.tsx`)

1. **Header fixo minimalista** — logo "Preciflow", links âncora (Funcionalidades, Planos, FAQ), botão "Entrar" e CTA "Começar grátis".
2. **Hero** — duas colunas:
   - Esquerda: headline ("Descubra o preço ideal dos seus produtos sem depender de planilhas"), subheadline mencionando confeitarias, hamburguerias, cafeterias, food trucks, açaiterias e produtores caseiros, CTA primário "Começar grátis" + secundário "Ver como funciona", badges (7 dias grátis, Sem planilhas, Funciona no celular, Dados na nuvem, Feito para pequenos negócios de comida).
   - Direita: mockup do dashboard com cards flutuantes animados (lucro, custo, preço sugerido, receita, kit/embalagem).
3. **Para quem é o Preciflow** — faixa horizontal com chips/ícones dos segmentos atendidos (confeitaria, doceria, hamburgueria, cafeteria, food truck, açaiteria, marmitaria, produção caseira) — deixa claro o alcance amplo logo no início.
4. **Dor / Identificação** — título "Você provavelmente já passou por isso..." + grid de 6 cards com dores universais: não saber o lucro real, esquecer ingredientes na conta, precificar no chute, planilhas difíceis, recalcular receita toda vez que um insumo sobe, ignorar embalagem e custos fixos.
5. **Solução** — grid focado em benefício, com linguagem genérica para qualquer produto:
   - "Saiba quanto cada receita realmente custa"
   - "Preço sugerido com a margem que você quiser"
   - "Controle de fichas técnicas e receitas"
   - "Embalagens e kits no cálculo"
   - "Lucro real produto a produto"
   - "Custo fixo distribuído automaticamente"
   - "Importe sua lista de ingredientes"
   - "Tudo organizado por categorias"
6. **Demonstração visual** — sequência de mockups (dashboard, cadastro de produtos, cálculo de preço) com legendas curtas. Frase de apoio: "Feito para quem quer simplicidade, não planilhas complicadas."
7. **Benefícios** — grid moderno: economize tempo, pare de precificar errado, descubra o lucro real, mais organização, menos prejuízo, simplifique a produção, tudo num lugar só.
8. **Autoridade / Autenticidade** — bloco humanizado: "Criado por quem vive a rotina de produzir e vender comida e entende as dificuldades reais de precificação, custos e organização."
9. **Planos** — três cards (Mensal R$ 9,90 | Semestral R$ 54 destacado "Mais escolhido" | Anual R$ 100). Cada CTA leva para `/auth` (signup) — depois do cadastro, o usuário cai no fluxo `/assinatura` existente.
10. **FAQ** — accordion (`@/components/ui/accordion`) com perguntas adaptadas ao público amplo:
    - Funciona no celular?
    - Preciso instalar?
    - Posso cancelar quando quiser?
    - Meus dados ficam salvos?
    - Preciso entender de Excel?
    - Funciona para qualquer tipo de produto (doces, lanches, bebidas, marmitas)?
    - O teste grátis exige cartão?
11. **CTA final** — banner full-width com headline "Comece agora a precificar seus produtos corretamente", subheadline e botão grande "Começar grátis" → `/auth`.
12. **Footer simples** — copyright, link para entrar, link para planos.

## Estilo visual
- Reaproveitar tokens já definidos em `src/styles.css` (paleta caramelo/cocoa + Fraunces/Inter) — alinhado com o produto e transmite autenticidade artesanal sem virar SaaS genérico.
- Gradientes sutis com `--primary`/`--accent`, sombras suaves, bastante respiro, cards `rounded-2xl`.
- Animações leves só com Tailwind + keyframes em `styles.css` (float dos cards do hero, fade-in nas seções) — sem nova dependência.
- Mockups feitos com SVG/divs estilizadas refletindo as telas reais, garantindo leveza.

## SEO
`head()` da rota com:
- `<title>`: "Preciflow — Precificação inteligente para pequenos negócios de comida"
- `meta description` (<160 chars) com palavras-chave amplas: precificação, confeitaria, hamburgueria, cafeteria, food truck, cálculo de custos, lucro, ficha técnica.
- `og:title`, `og:description`, `og:type=website`.
- JSON-LD `SoftwareApplication` com nome, descrição, oferta (R$ 9,90/mês).
- H1 único na hero, headings semânticos por seção, `aria-hidden` nos ícones decorativos.

## Responsividade
- Mobile-first: hero empilha (texto → mockup), grids viram 1 coluna < md, header colapsa mantendo CTA principal visível.
- Validar nos breakpoints sm/md/lg.

## Arquivos afetados
- **Novo:** `src/routes/landing.tsx` (página completa, dividida em subcomponentes locais por seção).
- **Editado:** `src/routes/__root.tsx` — adicionar `/landing` ao `PUBLIC_PATHS`.
- **Editado (opcional):** `src/styles.css` — keyframes `float`/`fade-in` para animações sutis.
- **Não tocar:** rotas existentes, lógica de auth, edge functions, `assinatura.tsx`.

## Fora de escopo
- Nenhuma mudança de backend, Stripe ou banco.
- Não alterar `/` (dashboard autenticado).
- Sem novas dependências npm.

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calculator,
  TrendingUp,
  Package,
  ChefHat,
  PieChart,
  Tag,
  Upload,
  Layers,
  Smartphone,
  Cloud,
  Clock,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  ArrowRight,
  Check,
  Coffee,
  Cake,
  Sandwich,
  IceCream,
  Truck,
  UtensilsCrossed,
  Cookie,
  Pizza,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Preciflow — Precificação inteligente para pequenos negócios de comida" },
      {
        name: "description",
        content:
          "Calcule o preço ideal dos seus produtos sem planilhas. Ideal para confeitarias, hamburguerias, cafeterias, food trucks, açaiterias e produtores caseiros. Teste grátis.",
      },
      {
        name: "keywords",
        content:
          "precificação, confeitaria, hamburgueria, cafeteria, food truck, açaiteria, marmitaria, ficha técnica, cálculo de custos, lucro, gestão de receitas",
      },
      { property: "og:title", content: "Preciflow — Precificação inteligente para pequenos negócios de comida" },
      {
        property: "og:description",
        content:
          "Descubra o preço ideal dos seus produtos e o lucro real de cada receita. Feito para pequenos empreendedores do mercado de alimentos.",
      },
      { property: "og:type", content: "website" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Preciflow",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Sistema de precificação e gestão para pequenos negócios de comida: confeitarias, hamburguerias, cafeterias, food trucks, açaiterias e produtores caseiros.",
          offers: {
            "@type": "Offer",
            price: "9.90",
            priceCurrency: "BRL",
          },
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <ParaQuem />
        <Dores />
        <Solucao />
        <Demonstracao />
        <Beneficios />
        <Autoridade />
        <Planos />
        <FAQ />
        <CTAFinal />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- Header ---------------- */
function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/landing" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold">Preciflow</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#funcionalidades" className="hover:text-foreground transition">Funcionalidades</a>
          <a href="#planos" className="hover:text-foreground transition">Planos</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground px-3 py-2">
            Entrar
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition shadow-sm"
          >
            Começar grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  const badges = [
    "7 dias grátis",
    "Sem planilhas",
    "Funciona no celular",
    "Dados na nuvem",
    "Feito para pequenos negócios de comida",
  ];
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/50 via-background to-background" />
      <div className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Precificação simples para quem produz e vende comida
          </span>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05]">
            Descubra o <span className="text-primary">preço ideal</span> dos seus produtos sem depender de planilhas
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            O Preciflow ajuda confeitarias, hamburguerias, cafeterias, food trucks, açaiterias e produtores caseiros a calcular custos,
            definir preços com lucro real e organizar receitas — tudo num só lugar, do celular ou do computador.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-base font-medium hover:bg-primary/90 transition shadow-md"
            >
              Começar grátis <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#funcionalidades"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-base font-medium hover:bg-secondary transition"
            >
              Ver como funciona
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {badges.map((b) => (
              <li key={b} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" /> {b}
              </li>
            ))}
          </ul>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative h-[420px] sm:h-[480px] lg:h-[520px]">
      {/* main panel */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-card to-secondary border border-border shadow-2xl overflow-hidden">
        <div className="h-10 border-b border-border flex items-center gap-1.5 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-xs text-muted-foreground">preciflow.app / dashboard</span>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2 rounded-xl bg-background/60 border border-border p-4">
            <div className="text-xs text-muted-foreground">Lucro estimado do mês</div>
            <div className="mt-1 font-display text-2xl font-semibold text-primary">R$ 4.380,00</div>
            <div className="mt-3 h-16 flex items-end gap-1.5">
              {[40, 65, 50, 78, 60, 85, 72, 90, 68, 95, 80, 100].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/70 to-accent" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-background/60 border border-border p-4">
            <div className="text-xs text-muted-foreground">Custo médio</div>
            <div className="mt-1 font-display text-lg font-semibold">R$ 6,80</div>
          </div>
          <div className="rounded-xl bg-background/60 border border-border p-4">
            <div className="text-xs text-muted-foreground">Margem média</div>
            <div className="mt-1 font-display text-lg font-semibold text-success">62%</div>
          </div>
        </div>
      </div>

      {/* floating card 1 */}
      <div className="absolute -left-4 top-32 sm:-left-8 rounded-2xl bg-card border border-border shadow-xl p-4 w-56 animate-float-slow">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5 text-success" /> Preço sugerido
        </div>
        <div className="mt-1 font-display text-xl font-semibold">R$ 18,90</div>
        <div className="text-xs text-muted-foreground">margem 60%</div>
      </div>

      {/* floating card 2 */}
      <div className="absolute -right-3 bottom-10 sm:-right-6 rounded-2xl bg-card border border-border shadow-xl p-4 w-56 animate-float-slower">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5 text-primary" /> Kit Cafeteria
        </div>
        <div className="mt-1 font-display text-base font-semibold">3 itens · R$ 32,40</div>
        <div className="text-xs text-success">Lucro R$ 19,80</div>
      </div>
    </div>
  );
}

/* ---------------- Para quem ---------------- */
function ParaQuem() {
  const segmentos = [
    { icon: Cake, label: "Confeitarias" },
    { icon: Cookie, label: "Docerias" },
    { icon: Sandwich, label: "Hamburguerias" },
    { icon: Coffee, label: "Cafeterias" },
    { icon: Truck, label: "Food trucks" },
    { icon: IceCream, label: "Açaiterias" },
    { icon: Pizza, label: "Pizzarias artesanais" },
    { icon: UtensilsCrossed, label: "Marmitarias e produção caseira" },
  ];
  return (
    <section className="py-14 border-y border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-sm uppercase tracking-wider text-muted-foreground">Feito para</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {segmentos.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-2xl bg-card border border-border px-4 py-3 text-sm hover:shadow-md transition"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Dores ---------------- */
function Dores() {
  const dores = [
    { icon: AlertTriangle, t: "Você não sabe o lucro real", d: "Vende muito mas no fim do mês não sobra dinheiro?" },
    { icon: FileSpreadsheet, t: "Planilhas que travam", d: "Fórmulas quebram, perdem dados e ninguém entende mais nada." },
    { icon: Calculator, t: "Precifica no chute", d: "Olha o preço do concorrente e torce pra dar certo." },
    { icon: Package, t: "Esquece itens na conta", d: "Embalagem, gás, taxa do app, custo fixo — tudo fica de fora." },
    { icon: TrendingUp, t: "Insumo subiu, e agora?", d: "Cada vez que um ingrediente muda, é refazer tudo do zero." },
    { icon: ChefHat, t: "Receitas espalhadas", d: "Caderno, WhatsApp, anotações soltas. Bagunça total na produção." },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">Você provavelmente já passou por isso…</h2>
          <p className="mt-3 text-muted-foreground">
            Quem produz comida e vende sabe: a parte difícil não é cozinhar, é organizar os números.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dores.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl bg-card border border-border p-6 hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 grid place-items-center text-destructive">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Solução ---------------- */
function Solucao() {
  const itens = [
    { icon: Calculator, t: "Saiba quanto cada receita custa", d: "Cálculo automático com base nos seus ingredientes reais." },
    { icon: DollarSign, t: "Preço sugerido com a margem que você quiser", d: "Defina sua margem e o sistema sugere o preço de venda." },
    { icon: ChefHat, t: "Fichas técnicas e receitas organizadas", d: "Tudo no mesmo lugar, fácil de atualizar e consultar." },
    { icon: Package, t: "Embalagens e kits no cálculo", d: "Inclua copos, caixas, sacolas e monte combos em poucos cliques." },
    { icon: PieChart, t: "Lucro real produto a produto", d: "Veja exatamente quanto cada item entrega de lucro." },
    { icon: Layers, t: "Custo fixo distribuído automaticamente", d: "Aluguel, energia, gás e taxas considerados no preço final." },
    { icon: Upload, t: "Importe sua lista de ingredientes", d: "Comece rápido: traga seus insumos e atualize preços em massa." },
    { icon: Tag, t: "Tudo organizado por categorias", d: "Encontre rápido seus produtos, insumos e receitas." },
  ];
  return (
    <section id="funcionalidades" className="py-20 bg-secondary/30 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">
            Tudo que você precisa pra precificar com confiança
          </h2>
          <p className="mt-3 text-muted-foreground">
            Funcione com qualquer tipo de produto: doces, lanches, bebidas, marmitas, açaí, cafés, pizzas, kits e mais.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {itens.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl bg-card border border-border p-5 hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Demonstração ---------------- */
function Demonstracao() {
  const cards = [
    {
      title: "Dashboard claro",
      desc: "Lucro, custos e margem em um piscar de olhos.",
      visual: (
        <div className="p-4">
          <div className="text-xs text-muted-foreground">Faturamento do mês</div>
          <div className="font-display text-2xl font-semibold text-primary">R$ 12.940</div>
          <div className="mt-3 h-20 flex items-end gap-1.5">
            {[40, 60, 55, 80, 65, 88, 72, 95, 78, 100].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/70 to-accent" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Cadastro de produtos",
      desc: "Adicione ingredientes, embalagens e modo de preparo.",
      visual: (
        <div className="p-4 space-y-2">
          {["Pão brioche · R$ 1,20", "Hambúrguer 150g · R$ 4,80", "Queijo cheddar · R$ 0,90", "Embalagem · R$ 0,70"].map((l) => (
            <div key={l} className="flex justify-between text-sm bg-background/60 border border-border rounded-lg px-3 py-2">
              <span>{l.split(" · ")[0]}</span>
              <span className="text-muted-foreground">{l.split(" · ")[1]}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Cálculo de preço",
      desc: "Defina sua margem e veja o preço sugerido na hora.",
      visual: (
        <div className="p-4">
          <div className="flex justify-between text-sm"><span>Custo total</span><span className="font-medium">R$ 7,60</span></div>
          <div className="flex justify-between text-sm mt-1"><span>Margem desejada</span><span className="font-medium">60%</span></div>
          <div className="mt-4 rounded-xl bg-primary/10 p-4">
            <div className="text-xs text-muted-foreground">Preço sugerido</div>
            <div className="font-display text-2xl font-semibold text-primary">R$ 19,00</div>
            <div className="text-xs text-success mt-1">Lucro R$ 11,40 por unidade</div>
          </div>
        </div>
      ),
    },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">Feito para quem quer simplicidade</h2>
          <p className="mt-3 text-muted-foreground">Não precisa entender de planilhas. Em poucos minutos você já tem o preço certo.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div key={c.title} className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
              <div className="bg-secondary/40 border-b border-border h-44">{c.visual}</div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Benefícios ---------------- */
function Beneficios() {
  const itens = [
    { icon: Clock, t: "Economize tempo", d: "Pare de refazer planilhas toda semana." },
    { icon: ShieldCheck, t: "Pare de precificar errado", d: "Tenha segurança para vender com lucro." },
    { icon: TrendingUp, t: "Descubra o lucro real", d: "Saiba exatamente o que cada produto entrega." },
    { icon: Layers, t: "Mais organização", d: "Receitas, insumos e custos no mesmo lugar." },
    { icon: PieChart, t: "Menos prejuízo", d: "Identifique produtos que estão te dando prejuízo." },
    { icon: Smartphone, t: "Tudo num lugar só", d: "Acesso pelo celular ou computador, quando precisar." },
  ];
  return (
    <section className="py-20 bg-secondary/30 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold max-w-2xl">
          Resultados que você sente no caixa do seu negócio
        </h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {itens.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl bg-card border border-border p-6 hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-accent/20 grid place-items-center text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Autoridade ---------------- */
function Autoridade() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 grid md:grid-cols-5 gap-10 items-center">
        <div className="md:col-span-2">
          <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary border border-border grid place-items-center">
            <ChefHat className="h-24 w-24 text-primary/70" />
          </div>
        </div>
        <div className="md:col-span-3">
          <span className="text-sm uppercase tracking-wider text-muted-foreground">Por trás do Preciflow</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-semibold">
            Criado por quem vive a rotina de produzir e vender comida
          </h2>
          <p className="mt-4 text-muted-foreground">
            Cada detalhe do Preciflow foi pensado para resolver as dores reais de pequenos empreendedores: precificação,
            controle de custos, organização de receitas e gestão do dia a dia. Sem termos complicados, sem planilhas,
            sem mistério.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Planos ---------------- */
function Planos() {
  const planos = [
    {
      nome: "Mensal",
      preco: "R$ 9,90",
      periodo: "/mês",
      features: ["Acesso completo", "Cancele quando quiser", "Suporte por e-mail"],
      destaque: false,
    },
    {
      nome: "Semestral",
      preco: "R$ 54",
      periodo: "/6 meses",
      features: ["Equivale a R$ 9,00/mês", "Economize ~10%", "Acesso completo"],
      destaque: true,
      tag: "Mais escolhido",
    },
    {
      nome: "Anual",
      preco: "R$ 100",
      periodo: "/ano",
      features: ["Equivale a R$ 8,33/mês", "Maior economia", "Acesso completo"],
      destaque: false,
    },
  ];
  return (
    <section id="planos" className="py-20 bg-secondary/30 border-y border-border/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">Planos simples, preço justo</h2>
          <p className="mt-3 text-muted-foreground">Comece com 7 dias grátis. Sem cartão na hora do cadastro.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {planos.map((p) => (
            <div
              key={p.nome}
              className={`relative rounded-3xl border p-7 flex flex-col ${
                p.destaque
                  ? "bg-card border-primary shadow-xl scale-[1.02]"
                  : "bg-card border-border shadow-sm"
              }`}
            >
              {p.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-medium px-3 py-1 shadow">
                  {p.tag}
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{p.nome}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold text-primary">{p.preco}</span>
                <span className="text-muted-foreground text-sm">{p.periodo}</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={`mt-6 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition ${
                  p.destaque
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:bg-secondary"
                }`}
              >
                Começar grátis
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ() {
  const items = [
    { q: "Funciona no celular?", a: "Sim. O Preciflow é 100% responsivo: você usa do celular, tablet ou computador, sem instalar nada." },
    { q: "Preciso instalar algum programa?", a: "Não. Tudo roda no navegador. Basta criar sua conta e começar." },
    { q: "Posso cancelar quando quiser?", a: "Sim. Você cancela a assinatura a qualquer momento, sem multa." },
    { q: "Meus dados ficam salvos com segurança?", a: "Sim. Seus dados ficam armazenados na nuvem com backup automático." },
    { q: "Preciso entender de Excel ou planilhas?", a: "Não. O sistema foi feito para quem quer simplicidade — você só preenche e o cálculo acontece." },
    {
      q: "Funciona pra qualquer tipo de produto (doces, lanches, bebidas, marmitas, açaí)?",
      a: "Sim. O Preciflow é genérico para qualquer negócio de comida: confeitaria, hamburgueria, cafeteria, food truck, açaiteria, marmitaria, produção caseira e mais.",
    },
    { q: "O teste grátis exige cartão?", a: "Não. Você pode testar antes e só assinar quando tiver certeza." },
  ];
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-center">Perguntas frequentes</h2>
        <Accordion type="single" collapsible className="mt-10">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-medium">{it.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------------- CTA Final ---------------- */
function CTAFinal() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-10 sm:p-14 text-center text-primary-foreground shadow-2xl">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <h2 className="relative font-display text-3xl sm:text-5xl font-semibold leading-tight">
            Comece agora a precificar seus produtos corretamente
          </h2>
          <p className="relative mt-4 text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Junte-se a quem já saiu das planilhas e está vendendo com lucro de verdade.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-background text-foreground px-8 py-4 text-base font-semibold hover:bg-background/90 transition shadow-lg"
            >
              Começar grátis <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="relative mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-primary-foreground/80">
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> 7 dias grátis</span>
            <span className="inline-flex items-center gap-1.5"><Cloud className="h-4 w-4" /> Dados na nuvem</span>
            <span className="inline-flex items-center gap-1.5"><Smartphone className="h-4 w-4" /> Funciona no celular</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground">
            <ChefHat className="h-4 w-4" />
          </div>
          <span>© {new Date().getFullYear()} Preciflow. Todos os direitos reservados.</span>
        </div>
        <div className="flex gap-5">
          <Link to="/auth" className="hover:text-foreground">Entrar</Link>
          <a href="#planos" className="hover:text-foreground">Planos</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </div>
      </div>
    </footer>
  );
}

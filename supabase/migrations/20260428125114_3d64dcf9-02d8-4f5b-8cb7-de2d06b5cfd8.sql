
-- Enums
create type public.unidade_medida as enum ('g','kg','ml','L','unidade');
create type public.categoria_materia as enum ('ingrediente','embalagem');
create type public.tipo_arredondamento as enum ('nenhum','0.10','0.50','1.00');

-- Matérias-primas
create table public.materias_primas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor_embalagem numeric(12,4) not null default 0,
  quantidade_embalagem numeric(12,4) not null default 1,
  unidade_medida public.unidade_medida not null default 'g',
  categoria public.categoria_materia not null default 'ingrediente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.materias_primas (user_id);

-- Kits de embalagem
create table public.kits_embalagem (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome_kit text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.kits_embalagem (user_id);

create table public.kit_itens (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits_embalagem(id) on delete cascade,
  materia_prima_id uuid not null references public.materias_primas(id) on delete cascade,
  quantidade_utilizada numeric(12,4) not null default 0,
  created_at timestamptz not null default now()
);
create index on public.kit_itens (kit_id);

-- Produtos
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome_produto text not null,
  rendimento numeric(12,4) not null default 1,
  percentual_perda numeric(8,4) not null default 0,
  tempo_producao_minutos numeric(10,2) not null default 0,
  preco_praticado numeric(12,4),
  kit_embalagem_id uuid references public.kits_embalagem(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.produtos (user_id);

create table public.produto_itens (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id) on delete cascade,
  materia_prima_id uuid not null references public.materias_primas(id) on delete cascade,
  quantidade_utilizada numeric(12,4) not null default 0,
  created_at timestamptz not null default now()
);
create index on public.produto_itens (produto_id);

-- Configurações (uma linha por usuário)
create table public.configuracoes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  percentual_custo_fixo numeric(8,4) not null default 19,
  percentual_lucro numeric(8,4) not null default 20,
  valor_hora_trabalho numeric(12,4) not null default 0,
  tipo_arredondamento_preco public.tipo_arredondamento not null default 'nenhum',
  updated_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_mp_updated before update on public.materias_primas
  for each row execute function public.set_updated_at();
create trigger trg_kit_updated before update on public.kits_embalagem
  for each row execute function public.set_updated_at();
create trigger trg_prod_updated before update on public.produtos
  for each row execute function public.set_updated_at();
create trigger trg_cfg_updated before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- Auto criar configurações para novos usuários
create or replace function public.handle_new_user_config()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.configuracoes (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_cfg
  after insert on auth.users
  for each row execute function public.handle_new_user_config();

-- RLS
alter table public.materias_primas enable row level security;
alter table public.kits_embalagem enable row level security;
alter table public.kit_itens enable row level security;
alter table public.produtos enable row level security;
alter table public.produto_itens enable row level security;
alter table public.configuracoes enable row level security;

-- materias_primas
create policy "mp_select_own" on public.materias_primas for select using (auth.uid() = user_id);
create policy "mp_insert_own" on public.materias_primas for insert with check (auth.uid() = user_id);
create policy "mp_update_own" on public.materias_primas for update using (auth.uid() = user_id);
create policy "mp_delete_own" on public.materias_primas for delete using (auth.uid() = user_id);

-- kits
create policy "kit_select_own" on public.kits_embalagem for select using (auth.uid() = user_id);
create policy "kit_insert_own" on public.kits_embalagem for insert with check (auth.uid() = user_id);
create policy "kit_update_own" on public.kits_embalagem for update using (auth.uid() = user_id);
create policy "kit_delete_own" on public.kits_embalagem for delete using (auth.uid() = user_id);

-- kit_itens (via kit ownership)
create policy "kit_itens_select_own" on public.kit_itens for select
  using (exists (select 1 from public.kits_embalagem k where k.id = kit_id and k.user_id = auth.uid()));
create policy "kit_itens_insert_own" on public.kit_itens for insert
  with check (exists (select 1 from public.kits_embalagem k where k.id = kit_id and k.user_id = auth.uid()));
create policy "kit_itens_update_own" on public.kit_itens for update
  using (exists (select 1 from public.kits_embalagem k where k.id = kit_id and k.user_id = auth.uid()));
create policy "kit_itens_delete_own" on public.kit_itens for delete
  using (exists (select 1 from public.kits_embalagem k where k.id = kit_id and k.user_id = auth.uid()));

-- produtos
create policy "prod_select_own" on public.produtos for select using (auth.uid() = user_id);
create policy "prod_insert_own" on public.produtos for insert with check (auth.uid() = user_id);
create policy "prod_update_own" on public.produtos for update using (auth.uid() = user_id);
create policy "prod_delete_own" on public.produtos for delete using (auth.uid() = user_id);

-- produto_itens
create policy "pi_select_own" on public.produto_itens for select
  using (exists (select 1 from public.produtos p where p.id = produto_id and p.user_id = auth.uid()));
create policy "pi_insert_own" on public.produto_itens for insert
  with check (exists (select 1 from public.produtos p where p.id = produto_id and p.user_id = auth.uid()));
create policy "pi_update_own" on public.produto_itens for update
  using (exists (select 1 from public.produtos p where p.id = produto_id and p.user_id = auth.uid()));
create policy "pi_delete_own" on public.produto_itens for delete
  using (exists (select 1 from public.produtos p where p.id = produto_id and p.user_id = auth.uid()));

-- configurações
create policy "cfg_select_own" on public.configuracoes for select using (auth.uid() = user_id);
create policy "cfg_insert_own" on public.configuracoes for insert with check (auth.uid() = user_id);
create policy "cfg_update_own" on public.configuracoes for update using (auth.uid() = user_id);

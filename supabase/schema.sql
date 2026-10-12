-- ============================================================
-- Sol & Mar Rent a Car — schema completo (Postgres / Supabase)
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- Nenhuma dependência de infraestrutura proprietária.
-- ============================================================

create extension if not exists btree_gist;

-- ---------- enums ----------
do $$ begin
  create type vehicle_status as enum ('disponivel', 'reservado', 'em_locacao', 'manutencao');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reservation_status as enum ('pendente', 'confirmada', 'em_andamento', 'concluida', 'cancelada');
exception when duplicate_object then null; end $$;

-- ---------- veículos ----------
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  transmission text not null,
  fuel text not null,
  passengers int not null default 5,
  doors int not null default 4,
  luggage int not null default 2,
  daily_rate numeric(10, 2) not null,
  status vehicle_status not null default 'disponivel',
  images text[] not null default '{}',
  features text[] not null default '{}',
  description text default '',
  plate text,
  year int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.vehicles to anon;
grant select, insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;

drop policy if exists "vehicles_public_read" on public.vehicles;
create policy "vehicles_public_read" on public.vehicles for select to anon, authenticated using (true);

drop policy if exists "vehicles_admin_write" on public.vehicles;
create policy "vehicles_admin_write" on public.vehicles for all to authenticated using (true) with check (true);

-- ---------- clientes ----------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  document text,
  city text,
  notes text,
  created_at timestamptz not null default now()
);

grant insert on public.customers to anon;
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;

drop policy if exists "customers_public_insert" on public.customers;
create policy "customers_public_insert" on public.customers for insert to anon, authenticated with check (true);

drop policy if exists "customers_admin_read" on public.customers;
create policy "customers_admin_read" on public.customers for select to authenticated using (true);

drop policy if exists "customers_admin_write" on public.customers;
create policy "customers_admin_write" on public.customers for update to authenticated using (true) with check (true);

drop policy if exists "customers_admin_delete" on public.customers;
create policy "customers_admin_delete" on public.customers for delete to authenticated using (true);

-- ---------- reservas ----------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  start_date date not null,
  end_date date not null,
  pickup_location text,
  return_location text,
  days int not null,
  daily_rate numeric(10, 2) not null,
  total numeric(10, 2) not null,
  status reservation_status not null default 'pendente',
  notes text,
  created_at timestamptz not null default now(),
  constraint reservations_valid_period check (end_date >= start_date)
);

-- Impede matematicamente duas reservas ativas do mesmo veículo no mesmo período.
alter table public.reservations drop constraint if exists reservations_no_overlap;
alter table public.reservations
  add constraint reservations_no_overlap exclude using gist (
    vehicle_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status <> 'cancelada');

create index if not exists reservations_vehicle_idx on public.reservations (vehicle_id, start_date, end_date);

grant select, insert on public.reservations to anon;
grant select, insert, update, delete on public.reservations to authenticated;
grant all on public.reservations to service_role;
alter table public.reservations enable row level security;

-- Leitura pública apenas do período/veículo (necessária para calcular disponibilidade).
drop policy if exists "reservations_public_read" on public.reservations;
create policy "reservations_public_read" on public.reservations for select to anon, authenticated using (true);

drop policy if exists "reservations_public_insert" on public.reservations;
create policy "reservations_public_insert" on public.reservations for insert to anon, authenticated with check (status = 'pendente');

drop policy if exists "reservations_admin_write" on public.reservations;
create policy "reservations_admin_write" on public.reservations for update to authenticated using (true) with check (true);

drop policy if exists "reservations_admin_delete" on public.reservations;
create policy "reservations_admin_delete" on public.reservations for delete to authenticated using (true);

-- ---------- storage das fotos ----------
insert into storage.buckets (id, name, public)
values ('veiculos', 'veiculos', true)
on conflict (id) do nothing;

drop policy if exists "veiculos_public_read" on storage.objects;
create policy "veiculos_public_read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'veiculos');

drop policy if exists "veiculos_admin_write" on storage.objects;
create policy "veiculos_admin_write" on storage.objects for all to authenticated
  using (bucket_id = 'veiculos') with check (bucket_id = 'veiculos');

-- ============================================================
-- Depois de rodar este script, crie o usuário administrador em
-- Authentication > Users no painel do Supabase.
-- ============================================================

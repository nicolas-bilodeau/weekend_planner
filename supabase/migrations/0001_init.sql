-- Weekend planner schema.
-- Two-person couple, all data shared (no per-row ownership beyond an
-- informational created_by). Weekends themselves are never stored — they
-- are computed on the fly from the current date (see src/lib/weekends.ts).

create extension if not exists pgcrypto;

create type event_category as enum ('obligation', 'prevu', 'envie');
create type location_kind as enum ('ville', 'exterieur');
create type idea_status as enum ('backlog', 'planifiee');

create table recurring_rules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  month int not null check (month between 1 and 12),
  day int not null check (day between 1 and 31),
  location location_kind not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tag text not null check (tag in ('Nature', 'Bouffe', 'Voyage', 'Culture', 'Détente')),
  duration text not null check (
    duration in ('Quelques heures', '1 jour', 'Soirée', 'Week-end complet', 'Plusieurs jours')
  ),
  location location_kind not null,
  status idea_status not null default 'backlog',
  assigned_weekend_id date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category event_category not null,
  location location_kind not null,
  start_date date not null,
  end_date date not null,
  idea_id uuid references ideas (id) on delete set null,
  recurring_rule_id uuid references recurring_rules (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint events_date_order check (end_date >= start_date)
);

create table protected_weekends (
  weekend_id date primary key,
  protected_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table skipped_recurring_instances (
  recurring_rule_id uuid not null references recurring_rules (id) on delete cascade,
  year int not null,
  primary key (recurring_rule_id, year)
);

create index events_start_date_idx on events (start_date);
create index events_idea_id_idx on events (idea_id);
create index events_recurring_rule_id_idx on events (recurring_rule_id);
create index ideas_status_idx on ideas (status);

-- Row Level Security: any signed-in user (the two accounts) has full
-- read/write access to every row — the data is jointly owned, there is no
-- per-user partition.
alter table recurring_rules enable row level security;
alter table ideas enable row level security;
alter table events enable row level security;
alter table protected_weekends enable row level security;
alter table skipped_recurring_instances enable row level security;

create policy "authenticated full access" on recurring_rules
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on ideas
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on events
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on protected_weekends
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on skipped_recurring_instances
  for all to authenticated using (true) with check (true);

-- Realtime: broadcast row changes on every planner table so both accounts
-- see each other's edits live without reloading.
alter publication supabase_realtime add table
  events, ideas, recurring_rules, protected_weekends, skipped_recurring_instances;

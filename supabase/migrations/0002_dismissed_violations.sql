-- Persists which "broken rule" pairs have been dismissed, so closing the
-- banner sticks across reloads/logins for both accounts. Keyed by the pair
-- of weekend ids involved — a different pair (e.g. a new one appearing
-- later) is a different key and is never pre-dismissed by this.
create table dismissed_violations (
  weekend_a_id date not null,
  weekend_b_id date not null,
  dismissed_by uuid references auth.users (id) on delete set null,
  dismissed_at timestamptz not null default now(),
  primary key (weekend_a_id, weekend_b_id)
);

alter table dismissed_violations enable row level security;

create policy "authenticated full access" on dismissed_violations
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table dismissed_violations;

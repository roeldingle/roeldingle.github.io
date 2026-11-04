create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid default auth.uid() references auth.users(id) on delete set null,
  action text not null check (
    action in (
      'created',
      'updated',
      'deleted',
      'published',
      'unpublished',
      'reordered',
      'imported',
      'progress updated'
    )
  ),
  entity_type text not null,
  entity_title text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_logs_created_at_idx
  on public.admin_activity_logs (created_at desc);

alter table public.admin_activity_logs enable row level security;

revoke all on table public.admin_activity_logs from anon;
grant select, insert on table public.admin_activity_logs to authenticated;

create policy "Portfolio admins can view activity logs"
  on public.admin_activity_logs
  for select
  to authenticated
  using ((select public.is_portfolio_admin()));

create policy "Portfolio admins can record their activity"
  on public.admin_activity_logs
  for insert
  to authenticated
  with check (
    (select public.is_portfolio_admin())
    and actor_id = (select auth.uid())
  );

notify pgrst, 'reload schema';

create table if not exists public.portfolio_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  content_markdown text not null default '',
  technologies text[] not null default '{}',
  is_published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.portfolio_notes enable row level security;

revoke all on table public.portfolio_notes from anon;
grant select, insert, update, delete on table public.portfolio_notes to authenticated;

create policy "Portfolio admins can manage notes"
  on public.portfolio_notes
  for all
  to authenticated
  using ((select public.is_portfolio_admin()))
  with check ((select public.is_portfolio_admin()));

notify pgrst, 'reload schema';

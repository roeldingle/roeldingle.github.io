create table if not exists public.portfolio_profile (
  id integer primary key check (id = 1),
  name text not null default '',
  headline text not null default '',
  biography text not null default ''
);

create table if not exists public.portfolio_roles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  display_order integer not null default 0
);

create table if not exists public.portfolio_skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  display_order integer not null default 0
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  technologies text[] not null default '{}',
  github_url text,
  demo_url text,
  status text not null default 'planned'
    check (status in ('completed', 'in-progress', 'planned')),
  is_published boolean not null default false,
  display_order integer not null default 0
);

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.portfolio_profile enable row level security;
alter table public.portfolio_roles enable row level security;
alter table public.portfolio_skills enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_admins enable row level security;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.portfolio_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_portfolio_admin() from public, anon;
grant execute on function public.is_portfolio_admin() to authenticated;

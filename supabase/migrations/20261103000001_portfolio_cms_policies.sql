drop policy if exists "Public can read portfolio profile" on public.portfolio_profile;
create policy "Public can read portfolio profile"
  on public.portfolio_profile
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read portfolio roles" on public.portfolio_roles;
create policy "Public can read portfolio roles"
  on public.portfolio_roles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read portfolio skills" on public.portfolio_skills;
create policy "Public can read portfolio skills"
  on public.portfolio_skills
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read published portfolio projects" on public.portfolio_projects;
create policy "Public can read published portfolio projects"
  on public.portfolio_projects
  for select
  to anon, authenticated
  using (is_published);

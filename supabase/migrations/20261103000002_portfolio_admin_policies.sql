drop policy if exists "Portfolio admins can manage profile" on public.portfolio_profile;
create policy "Portfolio admins can manage profile"
  on public.portfolio_profile
  for all
  to authenticated
  using ((select public.is_portfolio_admin()))
  with check ((select public.is_portfolio_admin()));

drop policy if exists "Portfolio admins can manage roles" on public.portfolio_roles;
create policy "Portfolio admins can manage roles"
  on public.portfolio_roles
  for all
  to authenticated
  using ((select public.is_portfolio_admin()))
  with check ((select public.is_portfolio_admin()));

drop policy if exists "Portfolio admins can manage skills" on public.portfolio_skills;
create policy "Portfolio admins can manage skills"
  on public.portfolio_skills
  for all
  to authenticated
  using ((select public.is_portfolio_admin()))
  with check ((select public.is_portfolio_admin()));

drop policy if exists "Portfolio admins can manage projects" on public.portfolio_projects;
create policy "Portfolio admins can manage projects"
  on public.portfolio_projects
  for all
  to authenticated
  using ((select public.is_portfolio_admin()))
  with check ((select public.is_portfolio_admin()));

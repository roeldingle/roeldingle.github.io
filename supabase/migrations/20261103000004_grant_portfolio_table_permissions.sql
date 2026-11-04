grant usage on schema public to anon, authenticated;

grant select on table
  public.portfolio_profile,
  public.portfolio_roles,
  public.portfolio_skills,
  public.portfolio_projects
to anon, authenticated;

grant insert, update, delete on table
  public.portfolio_profile,
  public.portfolio_roles,
  public.portfolio_skills,
  public.portfolio_projects
to authenticated;

revoke all on table public.portfolio_admins from anon, authenticated;

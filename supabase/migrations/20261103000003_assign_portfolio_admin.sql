create or replace function public.set_portfolio_admin(
  target_user_id uuid,
  should_be_admin boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or not (select public.is_portfolio_admin()) then
    raise exception 'Only portfolio admins can change admin access.';
  end if;

  if should_be_admin then
    insert into public.portfolio_admins (user_id, created_by)
    values (target_user_id, (select auth.uid()))
    on conflict (user_id) do nothing;
  else
    delete from public.portfolio_admins
    where user_id = target_user_id;

    if not exists (select 1 from public.portfolio_admins) then
      raise exception 'The last portfolio admin cannot be removed.';
    end if;
  end if;
end;
$$;

revoke all on function public.set_portfolio_admin(uuid, boolean) from public, anon;
grant execute on function public.set_portfolio_admin(uuid, boolean) to authenticated;

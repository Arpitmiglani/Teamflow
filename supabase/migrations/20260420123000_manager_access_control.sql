create or replace function public.grant_manager_access(target_identifier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_id uuid := auth.uid();
  target_user_id uuid;
begin
  if requester_id is null then
    raise exception 'Not authenticated';
  end if;

  if not (public.has_role(requester_id, 'admin') or public.has_role(requester_id, 'manager')) then
    raise exception 'Not authorized';
  end if;

  select id
  into target_user_id
  from auth.users
  where lower(email) = lower(target_identifier)
     or id::text = target_identifier
  limit 1;

  if target_user_id is null then
    raise exception 'User not found';
  end if;

  insert into public.user_roles (user_id, role)
  values (target_user_id, 'manager')
  on conflict (user_id, role) do nothing;
end;
$$;

grant execute on function public.grant_manager_access(text) to authenticated;

insert into public.user_roles (user_id, role)
select id, 'manager'::public.app_role
from auth.users
where lower(email) = 'arpitdon2004@gmail.com'
on conflict (user_id, role) do nothing;

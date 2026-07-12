-- Create a security definer function to allow users to delete their own account from auth.users
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users
  where id = auth.uid();
end;
$$;

-- Revoke execution from anonymous public roles to prevent unauthenticated abuse
revoke execute on function public.delete_own_account() from anon, public;
grant execute on function public.delete_own_account() to authenticated;

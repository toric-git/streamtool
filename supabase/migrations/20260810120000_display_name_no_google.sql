-- Do not copy Google full_name / email local-part into profiles.
-- Only an explicit user-provided display_name (auth metadata) is accepted;
-- otherwise use a neutral placeholder until onboarding sets a real name.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');

  if v_name is null or length(v_name) = 0 then
    v_name := 'ユーザー';
  end if;

  v_name := left(v_name, 30);

  insert into public.profiles (id, display_name)
  values (new.id, v_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

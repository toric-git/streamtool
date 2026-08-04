-- Ownership transfer + allow owner_id/role updates only during controlled transfer

create or replace function public.enforce_room_sensitive_fields()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is distinct from old.owner_id
     and current_setting('app.transferring_ownership', true) is distinct from 'true' then
    raise exception 'owner_id cannot be changed';
  end if;
  if new.room_code is distinct from old.room_code
     and not public.is_room_owner(old.id) then
    raise exception 'only owner can change room_code';
  end if;
  if new.password_hash is distinct from old.password_hash
     and not public.is_room_owner(old.id) then
    raise exception 'only owner can change password';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_room_member_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if current_setting('app.transferring_ownership', true) = 'true' then
      return new;
    end if;
    if new.role is distinct from old.role
       and not public.is_room_owner(old.room_id) then
      raise exception 'only owner can change roles';
    end if;
    if new.role = 'owner' and old.role is distinct from 'owner' then
      raise exception 'owner role cannot be assigned this way';
    end if;
    if auth.uid() = old.user_id
       and new.role is distinct from old.role
       and new.role in ('owner', 'admin') then
      raise exception 'cannot self-promote';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.transfer_room_ownership(
  p_room_id uuid,
  p_new_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_target_role text;
begin
  if v_actor is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if v_actor = p_new_owner_id then
    raise exception 'already owner' using errcode = 'P0001';
  end if;

  select role into v_actor_role
  from public.room_members
  where room_id = p_room_id and user_id = v_actor;

  if v_actor_role is distinct from 'owner' then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select role into v_target_role
  from public.room_members
  where room_id = p_room_id and user_id = p_new_owner_id;

  if v_target_role is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  if v_target_role = 'guest' then
    raise exception 'cannot transfer to guest' using errcode = '42501';
  end if;

  perform set_config('app.transferring_ownership', 'true', true);

  update public.room_members
  set role = 'owner',
      can_play = true,
      can_upload = true,
      is_muted = false
  where room_id = p_room_id and user_id = p_new_owner_id;

  update public.room_members
  set role = 'admin',
      can_play = true,
      can_upload = true,
      is_muted = false
  where room_id = p_room_id and user_id = v_actor;

  update public.rooms
  set owner_id = p_new_owner_id
  where id = p_room_id;

  perform set_config('app.transferring_ownership', 'false', true);
end;
$$;

grant execute on function public.transfer_room_ownership(uuid, uuid) to authenticated;

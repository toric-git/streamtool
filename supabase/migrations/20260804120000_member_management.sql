-- Member management RPCs (kick, play mute, role, upload permission)

create or replace function public.kick_room_member(
  p_room_id uuid,
  p_user_id uuid
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

  if v_actor = p_user_id then
    raise exception 'cannot kick yourself' using errcode = '42501';
  end if;

  select role into v_actor_role
  from public.room_members
  where room_id = p_room_id and user_id = v_actor;

  if v_actor_role is distinct from 'owner' then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select role into v_target_role
  from public.room_members
  where room_id = p_room_id and user_id = p_user_id;

  if v_target_role is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  if v_target_role = 'owner' then
    raise exception 'cannot kick owner' using errcode = '42501';
  end if;

  delete from public.room_members
  where room_id = p_room_id and user_id = p_user_id;
end;
$$;

create or replace function public.set_member_play_permission(
  p_room_id uuid,
  p_user_id uuid,
  p_can_play boolean,
  p_is_muted boolean
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

  select role into v_actor_role
  from public.room_members
  where room_id = p_room_id and user_id = v_actor;

  if v_actor_role not in ('owner', 'admin') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select role into v_target_role
  from public.room_members
  where room_id = p_room_id and user_id = p_user_id;

  if v_target_role is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  if v_target_role = 'owner' then
    raise exception 'cannot change owner play permission' using errcode = '42501';
  end if;

  -- Admin cannot mute/disable another admin
  if v_actor_role = 'admin' and v_target_role = 'admin' then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  update public.room_members
  set can_play = p_can_play,
      is_muted = p_is_muted
  where room_id = p_room_id and user_id = p_user_id;
end;
$$;

create or replace function public.set_member_upload_permission(
  p_room_id uuid,
  p_user_id uuid,
  p_can_upload boolean
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

  select role into v_actor_role
  from public.room_members
  where room_id = p_room_id and user_id = v_actor;

  if v_actor_role not in ('owner', 'admin') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select role into v_target_role
  from public.room_members
  where room_id = p_room_id and user_id = p_user_id;

  if v_target_role is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  if v_target_role = 'owner' then
    raise exception 'cannot change owner upload permission' using errcode = '42501';
  end if;

  if v_actor_role = 'admin' and v_target_role = 'admin' then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  update public.room_members
  set can_upload = p_can_upload
  where room_id = p_room_id and user_id = p_user_id;
end;
$$;

create or replace function public.set_member_role(
  p_room_id uuid,
  p_user_id uuid,
  p_role text
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

  if p_role not in ('admin', 'member', 'guest') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  if v_actor = p_user_id then
    raise exception 'cannot change own role' using errcode = '42501';
  end if;

  select role into v_actor_role
  from public.room_members
  where room_id = p_room_id and user_id = v_actor;

  if v_actor_role is distinct from 'owner' then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select role into v_target_role
  from public.room_members
  where room_id = p_room_id and user_id = p_user_id;

  if v_target_role is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  if v_target_role = 'owner' then
    raise exception 'cannot change owner role' using errcode = '42501';
  end if;

  update public.room_members
  set role = p_role,
      can_play = case when p_role = 'guest' then can_play else true end,
      can_upload = case when p_role in ('admin') then true else can_upload end
  where room_id = p_room_id and user_id = p_user_id;
end;
$$;

grant execute on function public.kick_room_member(uuid, uuid) to authenticated;
grant execute on function public.set_member_play_permission(uuid, uuid, boolean, boolean) to authenticated;
grant execute on function public.set_member_upload_permission(uuid, uuid, boolean) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

-- Realtime Soundboard initial schema
-- Apply with Supabase CLI: supabase db push
-- or paste into SQL Editor in the Supabase Dashboard.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, 'guest'), '@', 1), ''),
    'Guest'
  );
  v_name := left(v_name, 30);

  insert into public.profiles (id, display_name)
  values (new.id, v_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text check (description is null or char_length(description) <= 500),
  room_code text not null unique check (room_code ~ '^[A-Z0-9]{6,8}$'),
  password_hash text,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  guest_enabled boolean not null default true,
  guest_can_play boolean not null default true,
  upload_enabled boolean not null default false,
  upload_requires_approval boolean not null default true,
  max_members integer not null default 30 check (max_members between 2 and 200),
  master_volume numeric not null default 1.0 check (master_volume >= 0 and master_volume <= 1),
  obs_volume numeric not null default 1.0 check (obs_volume >= 0 and obs_volume <= 1),
  default_cooldown_ms integer not null default 1000 check (default_cooldown_ms >= 0),
  max_events_per_minute integer not null default 30 check (max_events_per_minute between 1 and 600),
  max_simultaneous_sounds integer not null default 4 check (max_simultaneous_sounds between 1 and 32),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index rooms_owner_id_idx on public.rooms (owner_id);
create index rooms_room_code_idx on public.rooms (room_code);

create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create or replace function public.enforce_room_sensitive_fields()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is distinct from old.owner_id then
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

create trigger rooms_enforce_sensitive
before update on public.rooms
for each row execute function public.enforce_room_sensitive_fields();

-- ---------------------------------------------------------------------------
-- room_members
-- ---------------------------------------------------------------------------

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  role text not null check (role in ('owner', 'admin', 'member', 'guest')),
  can_play boolean not null default true,
  can_upload boolean not null default false,
  is_muted boolean not null default false,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (room_id, user_id)
);

create index room_members_user_id_idx on public.room_members (user_id);
create index room_members_room_id_idx on public.room_members (room_id);

-- Membership helpers (must come after room_members exists — SQL functions resolve relations at CREATE time)
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.get_room_role(p_room_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.room_members m
  where m.room_id = p_room_id
    and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_room_owner_or_admin(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_room_owner(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members m
    where m.room_id = p_room_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- Prevent users from elevating themselves via direct update
create or replace function public.enforce_room_member_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
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

create trigger room_members_enforce_role
before update on public.room_members
for each row execute function public.enforce_room_member_role_change();

-- ---------------------------------------------------------------------------
-- sound_categories
-- ---------------------------------------------------------------------------

create table public.sound_categories (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (room_id, name)
);

create index sound_categories_room_sort_idx
  on public.sound_categories (room_id, sort_order);

create trigger sound_categories_set_updated_at
before update on public.sound_categories
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sounds
-- ---------------------------------------------------------------------------

create table public.sounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  uploader_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.sound_categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 40),
  audio_path text not null,
  image_path text,
  button_color text not null default '#334155' check (button_color ~ '^#[0-9A-Fa-f]{6}$'),
  text_color text not null default '#ffffff' check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  volume numeric not null default 1.0 check (volume >= 0 and volume <= 1),
  playback_mode text not null default 'one_shot'
    check (playback_mode in ('one_shot', 'toggle_loop')),
  cooldown_ms integer not null default 1000 check (cooldown_ms >= 0),
  duration_ms integer not null check (duration_ms > 0 and duration_ms <= 30000),
  sort_order integer not null default 0,
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index sounds_room_sort_idx on public.sounds (room_id, sort_order);
create index sounds_room_status_idx on public.sounds (room_id, approval_status, is_active);
create index sounds_category_id_idx on public.sounds (category_id);

create trigger sounds_set_updated_at
before update on public.sounds
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- playback_events
-- ---------------------------------------------------------------------------

create table public.playback_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  sound_id uuid references public.sounds (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in ('play', 'stop', 'stop_all')),
  volume numeric not null default 1.0 check (volume >= 0 and volume <= 1),
  client_event_id uuid not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create index playback_events_room_created_idx
  on public.playback_events (room_id, created_at desc);

-- ---------------------------------------------------------------------------
-- obs_tokens
-- ---------------------------------------------------------------------------

create table public.obs_tokens (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  token_hash text not null unique,
  token_hint text,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz
);

create index obs_tokens_room_id_idx on public.obs_tokens (room_id);

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.generate_room_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.join_room(
  p_room_code text,
  p_password text default null,
  p_display_name text default null
)
returns table (room_id uuid, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_member public.room_members%rowtype;
  v_count integer;
  v_name text;
  v_is_anon boolean;
  v_role text;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_room
  from public.rooms r
  where r.room_code = upper(trim(p_room_code))
  limit 1;

  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  select * into v_member
  from public.room_members m
  where m.room_id = v_room.id and m.user_id = v_user_id;

  if found then
    return query select v_member.room_id, v_member.role;
    return;
  end if;

  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) into v_is_anon;

  if v_is_anon and not v_room.guest_enabled then
    raise exception 'guest join disabled' using errcode = '42501';
  end if;

  -- Password-protected rooms must be joined via the Next.js server action after
  -- bcrypt verification. Direct RPC calls are rejected to avoid plaintext/hash bypass.
  if v_room.password_hash is not null
     and current_setting('app.password_verified', true) is distinct from 'true' then
    raise exception 'password required' using errcode = '42501';
  end if;

  select count(*) into v_count from public.room_members m where m.room_id = v_room.id;
  if v_count >= v_room.max_members then
    raise exception 'room is full' using errcode = 'P0001';
  end if;

  select display_name into v_name from public.profiles p where p.id = v_user_id;
  if p_display_name is not null and length(trim(p_display_name)) > 0 then
    v_name := left(trim(p_display_name), 30);
    update public.profiles set display_name = v_name where id = v_user_id;
  end if;

  if v_name is null or length(v_name) = 0 then
    v_name := 'Guest';
  end if;

  v_role := case when v_is_anon then 'guest' else 'member' end;

  insert into public.room_members (
    room_id, user_id, display_name, role, can_play, can_upload
  ) values (
    v_room.id,
    v_user_id,
    v_name,
    v_role,
    case
      when v_role = 'guest' then v_room.guest_can_play
      else true
    end,
    false
  );

  return query select v_room.id, v_role;
end;
$$;

-- Called only by the Next.js server (service role) after bcrypt password check.
create or replace function public.server_join_room(
  p_user_id uuid,
  p_room_code text,
  p_display_name text default null
)
returns table (room_id uuid, role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_member public.room_members%rowtype;
  v_count integer;
  v_name text;
  v_is_anon boolean;
  v_role text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  select * into v_room
  from public.rooms r
  where r.room_code = upper(trim(p_room_code))
  limit 1;

  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  select * into v_member
  from public.room_members m
  where m.room_id = v_room.id and m.user_id = p_user_id;

  if found then
    return query select v_member.room_id, v_member.role;
    return;
  end if;

  select coalesce(is_anonymous, false) into v_is_anon from auth.users where id = p_user_id;

  if v_is_anon and not v_room.guest_enabled then
    raise exception 'guest join disabled' using errcode = '42501';
  end if;

  select count(*) into v_count from public.room_members m where m.room_id = v_room.id;
  if v_count >= v_room.max_members then
    raise exception 'room is full' using errcode = 'P0001';
  end if;

  select display_name into v_name from public.profiles p where p.id = p_user_id;
  if p_display_name is not null and length(trim(p_display_name)) > 0 then
    v_name := left(trim(p_display_name), 30);
    update public.profiles set display_name = v_name where id = p_user_id;
  end if;

  if v_name is null or length(v_name) = 0 then
    v_name := 'Guest';
  end if;

  v_role := case when v_is_anon then 'guest' else 'member' end;

  insert into public.room_members (
    room_id, user_id, display_name, role, can_play, can_upload
  ) values (
    v_room.id,
    p_user_id,
    v_name,
    v_role,
    case when v_role = 'guest' then v_room.guest_can_play else true end,
    false
  );

  return query select v_room.id, v_role;
end;
$$;

create or replace function public.create_playback_event(
  p_room_id uuid,
  p_sound_id uuid,
  p_action text,
  p_volume numeric,
  p_client_event_id uuid
)
returns table (
  id uuid,
  room_id uuid,
  sound_id uuid,
  user_id uuid,
  action text,
  volume numeric,
  client_event_id uuid,
  created_at timestamptz,
  user_display_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_member public.room_members%rowtype;
  v_room public.rooms%rowtype;
  v_sound public.sounds%rowtype;
  v_event public.playback_events%rowtype;
  v_recent_count integer;
  v_vol numeric;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_action not in ('play', 'stop', 'stop_all') then
    raise exception 'invalid action' using errcode = '22023';
  end if;

  select * into v_member
  from public.room_members m
  where m.room_id = p_room_id and m.user_id = v_user_id;

  if not found then
    raise exception 'not a room member' using errcode = '42501';
  end if;

  select * into v_room from public.rooms r where r.id = p_room_id;
  if not found then
    raise exception 'room not found' using errcode = 'P0002';
  end if;

  v_vol := greatest(0, least(1, coalesce(p_volume, 1)));

  if p_action = 'stop_all' then
    if v_member.role not in ('owner', 'admin') then
      raise exception 'permission denied' using errcode = '42501';
    end if;
  else
    if not v_member.can_play or v_member.is_muted then
      raise exception 'playback denied' using errcode = '42501';
    end if;
    if v_member.role = 'guest' and not v_room.guest_can_play then
      raise exception 'guest playback disabled' using errcode = '42501';
    end if;
  end if;

  if p_action in ('play', 'stop') then
    if p_sound_id is null then
      raise exception 'sound_id required' using errcode = '22023';
    end if;

    select * into v_sound
    from public.sounds s
    where s.id = p_sound_id and s.room_id = p_room_id;

    if not found then
      raise exception 'sound not found' using errcode = 'P0002';
    end if;

    if p_action = 'play' then
      if v_sound.approval_status <> 'approved' or not v_sound.is_active then
        raise exception 'sound not available' using errcode = '42501';
      end if;

      -- Per-sound cooldown
      if exists (
        select 1
        from public.playback_events e
        where e.room_id = p_room_id
          and e.sound_id = p_sound_id
          and e.user_id = v_user_id
          and e.action = 'play'
          and e.created_at > timezone('utc', now()) - make_interval(secs => (v_sound.cooldown_ms::numeric / 1000.0))
      ) then
        raise exception 'cooldown active' using errcode = 'P0001';
      end if;
    end if;
  end if;

  -- Per-user rate limit
  select count(*) into v_recent_count
  from public.playback_events e
  where e.room_id = p_room_id
    and e.user_id = v_user_id
    and e.created_at > timezone('utc', now()) - interval '1 minute';

  if v_recent_count >= v_room.max_events_per_minute then
    raise exception 'rate limit exceeded' using errcode = 'P0001';
  end if;

  begin
    insert into public.playback_events (
      room_id, sound_id, user_id, action, volume, client_event_id
    ) values (
      p_room_id,
      case when p_action = 'stop_all' then null else p_sound_id end,
      v_user_id,
      p_action,
      v_vol,
      p_client_event_id
    )
    returning * into v_event;
  exception
    when unique_violation then
      select * into v_event
      from public.playback_events e
      where e.client_event_id = p_client_event_id;
  end;

  return query
  select
    v_event.id,
    v_event.room_id,
    v_event.sound_id,
    v_event.user_id,
    v_event.action,
    v_event.volume,
    v_event.client_event_id,
    v_event.created_at,
    v_member.display_name;
end;
$$;

create or replace function public.reorder_sounds(
  p_room_id uuid,
  p_sound_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer;
begin
  if not public.is_room_owner_or_admin(p_room_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  for i in 1 .. coalesce(array_length(p_sound_ids, 1), 0) loop
    update public.sounds
    set sort_order = i - 1
    where id = p_sound_ids[i]
      and room_id = p_room_id;
  end loop;
end;
$$;

create or replace function public.approve_sound(p_sound_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  select room_id into v_room_id from public.sounds where id = p_sound_id;
  if v_room_id is null then
    raise exception 'sound not found' using errcode = 'P0002';
  end if;
  if not public.is_room_owner_or_admin(v_room_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.sounds
  set approval_status = 'approved', is_active = true
  where id = p_sound_id;
end;
$$;

create or replace function public.reject_sound(p_sound_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  select room_id into v_room_id from public.sounds where id = p_sound_id;
  if v_room_id is null then
    raise exception 'sound not found' using errcode = 'P0002';
  end if;
  if not public.is_room_owner_or_admin(v_room_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.sounds
  set approval_status = 'rejected', is_active = false
  where id = p_sound_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.sound_categories enable row level security;
alter table public.sounds enable row level security;
alter table public.playback_events enable row level security;
alter table public.obs_tokens enable row level security;

-- profiles
create policy profiles_select_self_or_roommates
on public.profiles for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.room_members me
    join public.room_members other
      on me.room_id = other.room_id
    where me.user_id = auth.uid()
      and other.user_id = profiles.id
  )
);

create policy profiles_update_self
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

-- rooms
create policy rooms_select_member
on public.rooms for select
using (public.is_room_member(id));

create policy rooms_insert_authenticated
on public.rooms for insert
with check (auth.uid() = owner_id);

create policy rooms_update_owner_admin
on public.rooms for update
using (public.is_room_owner_or_admin(id))
with check (public.is_room_owner_or_admin(id));

create policy rooms_delete_owner
on public.rooms for delete
using (public.is_room_owner(id));

-- room_members
create policy room_members_select_same_room
on public.room_members for select
using (public.is_room_member(room_id));

create policy room_members_update_owner_or_self_limited
on public.room_members for update
using (
  public.is_room_owner(room_id)
  or (user_id = auth.uid())
)
with check (
  public.is_room_owner(room_id)
  or (user_id = auth.uid())
);

create policy room_members_delete_owner_or_self
on public.room_members for delete
using (
  public.is_room_owner(room_id)
  or user_id = auth.uid()
);

-- Direct inserts are disabled; use join_room / server actions.
-- Owner bootstrap insert when creating a room is allowed:
create policy room_members_insert_owner_bootstrap
on public.room_members for insert
with check (
  auth.uid() = user_id
  and role = 'owner'
  and exists (
    select 1 from public.rooms r
    where r.id = room_id and r.owner_id = auth.uid()
  )
);

-- categories
create policy categories_select_member
on public.sound_categories for select
using (public.is_room_member(room_id));

create policy categories_write_admin
on public.sound_categories for all
using (public.is_room_owner_or_admin(room_id))
with check (public.is_room_owner_or_admin(room_id));

-- sounds
create policy sounds_select_member
on public.sounds for select
using (
  public.is_room_member(room_id)
  and (
    public.is_room_owner_or_admin(room_id)
    or uploader_id = auth.uid()
    or (approval_status = 'approved' and is_active = true)
  )
);

create policy sounds_insert_allowed
on public.sounds for insert
with check (
  auth.uid() = uploader_id
  and public.is_room_member(room_id)
  and (
    public.is_room_owner_or_admin(room_id)
    or exists (
      select 1
      from public.room_members m
      join public.rooms r on r.id = m.room_id
      where m.room_id = sounds.room_id
        and m.user_id = auth.uid()
        and r.upload_enabled = true
        and m.can_upload = true
    )
  )
);

create policy sounds_update_admin_or_own_pending
on public.sounds for update
using (
  public.is_room_owner_or_admin(room_id)
  or (uploader_id = auth.uid() and approval_status = 'pending')
)
with check (
  public.is_room_owner_or_admin(room_id)
  or (uploader_id = auth.uid() and approval_status = 'pending')
);

create policy sounds_delete_admin_or_own_pending
on public.sounds for delete
using (
  public.is_room_owner_or_admin(room_id)
  or (uploader_id = auth.uid() and approval_status = 'pending')
);

-- playback_events: members can read recent; inserts only via RPC (revoke direct insert)
create policy playback_events_select_member
on public.playback_events for select
using (public.is_room_member(room_id));

revoke insert on public.playback_events from authenticated;
revoke insert on public.playback_events from anon;

-- obs_tokens: owner only, never expose hash to non-owners (owners see meta only)
create policy obs_tokens_owner_all
on public.obs_tokens for all
using (public.is_room_owner(room_id))
with check (public.is_room_owner(room_id));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant insert, delete on public.rooms to authenticated;
grant select (
  id,
  owner_id,
  name,
  description,
  room_code,
  visibility,
  guest_enabled,
  guest_can_play,
  upload_enabled,
  upload_requires_approval,
  max_members,
  master_volume,
  obs_volume,
  default_cooldown_ms,
  max_events_per_minute,
  max_simultaneous_sounds,
  created_at,
  updated_at
) on public.rooms to authenticated;
grant update (
  name,
  description,
  room_code,
  password_hash,
  visibility,
  guest_enabled,
  guest_can_play,
  upload_enabled,
  upload_requires_approval,
  max_members,
  master_volume,
  obs_volume,
  default_cooldown_ms,
  max_events_per_minute,
  max_simultaneous_sounds,
  updated_at
) on public.rooms to authenticated;
-- password_hash is never granted for SELECT to authenticated/anon
grant select, update, delete on public.room_members to authenticated;
grant insert on public.room_members to authenticated;
grant select, insert, update, delete on public.sound_categories to authenticated;
grant select, insert, update, delete on public.sounds to authenticated;
grant select on public.playback_events to authenticated;
grant select (
  id, room_id, token_hint, enabled, created_at, last_used_at
) on public.obs_tokens to authenticated;
grant insert, update, delete on public.obs_tokens to authenticated;

grant execute on function public.is_room_member(uuid) to authenticated;
grant execute on function public.get_room_role(uuid) to authenticated;
grant execute on function public.is_room_owner_or_admin(uuid) to authenticated;
grant execute on function public.is_room_owner(uuid) to authenticated;
grant execute on function public.join_room(text, text, text) to authenticated;
grant execute on function public.create_playback_event(uuid, uuid, text, numeric, uuid) to authenticated;
grant execute on function public.reorder_sounds(uuid, uuid[]) to authenticated;
grant execute on function public.approve_sound(uuid) to authenticated;
grant execute on function public.reject_sound(uuid) to authenticated;
grant execute on function public.generate_room_code() to authenticated;
-- server_join_room: service_role only (no grant to authenticated/anon)

create or replace function public.get_room_join_info(p_room_code text)
returns table (
  room_id uuid,
  name text,
  has_password boolean,
  guest_enabled boolean,
  member_count integer,
  max_members integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_count integer;
begin
  select * into v_room
  from public.rooms r
  where r.room_code = upper(trim(p_room_code))
  limit 1;

  if not found then
    return;
  end if;

  select count(*)::integer into v_count
  from public.room_members m
  where m.room_id = v_room.id;

  return query
  select
    v_room.id,
    v_room.name,
    (v_room.password_hash is not null),
    v_room.guest_enabled,
    v_count,
    v_room.max_members;
end;
$$;

grant execute on function public.get_room_join_info(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'room-audio',
    'room-audio',
    false,
    10485760,
    array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/webm']
  ),
  (
    'room-images',
    'room-images',
    false,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path format: {roomId}/{userId}/{filename}
create or replace function public.storage_room_id(object_name text)
returns uuid
language sql
immutable
as $$
  select nullif(split_part(object_name, '/', 1), '')::uuid;
$$;

create policy room_audio_select_member
on storage.objects for select
to authenticated
using (
  bucket_id = 'room-audio'
  and public.is_room_member(public.storage_room_id(name))
);

create policy room_audio_insert_member
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'room-audio'
  and public.is_room_member(public.storage_room_id(name))
  and auth.uid()::text = split_part(name, '/', 2)
);

create policy room_audio_update_admin
on storage.objects for update
to authenticated
using (
  bucket_id = 'room-audio'
  and public.is_room_owner_or_admin(public.storage_room_id(name))
);

create policy room_audio_delete_admin_or_owner_path
on storage.objects for delete
to authenticated
using (
  bucket_id = 'room-audio'
  and (
    public.is_room_owner_or_admin(public.storage_room_id(name))
    or auth.uid()::text = split_part(name, '/', 2)
  )
);

create policy room_images_select_member
on storage.objects for select
to authenticated
using (
  bucket_id = 'room-images'
  and public.is_room_member(public.storage_room_id(name))
);

create policy room_images_insert_member
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'room-images'
  and public.is_room_member(public.storage_room_id(name))
  and auth.uid()::text = split_part(name, '/', 2)
);

create policy room_images_update_admin
on storage.objects for update
to authenticated
using (
  bucket_id = 'room-images'
  and public.is_room_owner_or_admin(public.storage_room_id(name))
);

create policy room_images_delete_admin_or_owner_path
on storage.objects for delete
to authenticated
using (
  bucket_id = 'room-images'
  and (
    public.is_room_owner_or_admin(public.storage_room_id(name))
    or auth.uid()::text = split_part(name, '/', 2)
  )
);

-- Realtime publication
alter publication supabase_realtime add table public.playback_events;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.sounds;

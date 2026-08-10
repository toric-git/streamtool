-- Per-user favorite sounds, synced across devices for the same account.
create table public.sound_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  sound_id uuid not null references public.sounds (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, sound_id)
);

create index sound_favorites_room_user_idx
  on public.sound_favorites (room_id, user_id);

alter table public.sound_favorites enable row level security;

create policy sound_favorites_select_own
on public.sound_favorites for select
using (user_id = auth.uid() and public.is_room_member(room_id));

create policy sound_favorites_insert_own
on public.sound_favorites for insert
with check (
  user_id = auth.uid()
  and public.is_room_member(room_id)
  and exists (
    select 1 from public.sounds s
    where s.id = sound_id
      and s.room_id = room_id
  )
);

create policy sound_favorites_delete_own
on public.sound_favorites for delete
using (user_id = auth.uid());

grant select, insert, delete on public.sound_favorites to authenticated;

alter publication supabase_realtime add table public.sound_favorites;

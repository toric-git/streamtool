-- Owners must be able to SELECT their rooms before room_members exists.
-- Without this, createRoom's insert().select() and the
-- room_members_insert_owner_bootstrap EXISTS check both fail under RLS.

create policy rooms_select_owner
on public.rooms for select
using (owner_id = auth.uid());

-- Free plan default: 7 members. 8+ requires paid capacity (enforced in app).
alter table public.rooms
  alter column max_members set default 7;

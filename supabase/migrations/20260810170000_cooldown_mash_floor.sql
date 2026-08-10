-- Raise floor on cooldowns so pads cannot be mashed with 0ms / sub-second gaps.

update public.sounds
set cooldown_ms = 1000
where cooldown_ms < 1000;

update public.rooms
set default_cooldown_ms = greatest(default_cooldown_ms, 1000)
where default_cooldown_ms < 1000;

alter table public.sounds
  alter column cooldown_ms set default 1500;

alter table public.rooms
  alter column default_cooldown_ms set default 1500;

alter table public.sounds
  drop constraint if exists sounds_cooldown_ms_check;

alter table public.sounds
  add constraint sounds_cooldown_ms_check
  check (cooldown_ms >= 1000);

alter table public.rooms
  drop constraint if exists rooms_default_cooldown_ms_check;

alter table public.rooms
  add constraint rooms_default_cooldown_ms_check
  check (default_cooldown_ms >= 1000);

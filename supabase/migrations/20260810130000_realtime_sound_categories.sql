-- Live pad-sheet sync: categories must be in the realtime publication.
-- (sounds already published in init migration.)
alter publication supabase_realtime add table public.sound_categories;

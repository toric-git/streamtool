-- Product decision: remove upload-approval workflow from the app UI.
-- Force existing rooms off approval, and publish any leftover pending sounds.
update public.rooms
set upload_requires_approval = false
where upload_requires_approval is distinct from false;

update public.sounds
set
  approval_status = 'approved',
  is_active = true
where approval_status = 'pending';

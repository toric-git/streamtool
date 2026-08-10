-- Public feedback / bug reports from the site header form.
create table public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('request', 'bug')),
  message text not null check (char_length(message) between 1 and 4000),
  contact_email text check (
    contact_email is null or char_length(contact_email) <= 254
  ),
  contact_name text check (
    contact_name is null or char_length(contact_name) <= 80
  ),
  page_url text check (page_url is null or char_length(page_url) <= 500),
  user_id uuid references auth.users (id) on delete set null,
  user_agent text check (user_agent is null or char_length(user_agent) <= 500),
  created_at timestamptz not null default now()
);

create index feedback_reports_created_at_idx
  on public.feedback_reports (created_at desc);

alter table public.feedback_reports enable row level security;

-- Anyone (logged-in or guest) can submit feedback.
create policy feedback_reports_insert_anyone
on public.feedback_reports
for insert
to anon, authenticated
with check (true);

-- No public read. Admins use service role / SQL editor.
revoke all on table public.feedback_reports from public;
grant insert on table public.feedback_reports to anon, authenticated;
grant select, insert, update, delete on table public.feedback_reports to service_role;

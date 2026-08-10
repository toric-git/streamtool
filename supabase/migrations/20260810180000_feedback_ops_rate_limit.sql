-- Feedback ops: rate-limit key + triage status.
alter table public.feedback_reports
  add column if not exists client_key text,
  add column if not exists status text not null default 'open';

alter table public.feedback_reports
  drop constraint if exists feedback_reports_status_check;

alter table public.feedback_reports
  add constraint feedback_reports_status_check
  check (status in ('open', 'done'));

alter table public.feedback_reports
  drop constraint if exists feedback_reports_client_key_len;

alter table public.feedback_reports
  add constraint feedback_reports_client_key_len
  check (client_key is null or char_length(client_key) <= 80);

create index if not exists feedback_reports_client_key_created_idx
  on public.feedback_reports (client_key, created_at desc);

create index if not exists feedback_reports_status_created_idx
  on public.feedback_reports (status, created_at desc);

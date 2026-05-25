-- Profile feature: ensure full_name column exists on users
alter table public.users
  add column if not exists full_name text;

-- Assignment submission feature: add submission columns to assignments
alter table public.assignments
  add column if not exists submission_text text,
  add column if not exists submission_file_path text,
  add column if not exists submitted_at timestamptz;

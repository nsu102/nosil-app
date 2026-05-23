-- 데일리 케어 완료 체크
create table if not exists daily_completed (
  id bigint generated always as identity primary key,
  uid text not null,
  date_key text not null,
  task_id text not null,
  created_at timestamptz default now(),
  unique(uid, date_key, task_id)
);

-- 데일리 커스텀 태스크
create table if not exists daily_custom_tasks (
  id bigint generated always as identity primary key,
  uid text not null,
  date_key text not null,
  task_time text not null,
  task_text text not null,
  task_icon text not null default '✨',
  task_id text not null,
  created_at timestamptz default now(),
  unique(uid, task_id)
);

-- 데일리 루틴 설정
create table if not exists daily_routines (
  id bigint generated always as identity primary key,
  uid text not null unique,
  routine jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- 데일리 사진
create table if not exists daily_photos (
  id bigint generated always as identity primary key,
  uid text not null,
  date_key text not null,
  photo_url text not null,
  created_at timestamptz default now(),
  unique(uid, date_key)
);

-- 시술 기록 (record.tsx)
create table if not exists treatment_records (
  id bigint generated always as identity primary key,
  uid text not null unique,
  step text not null default 'select',
  counts jsonb not null default '{}',
  start_date text,
  schedule jsonb not null default '[]',
  past_treatments jsonb not null default '[]',
  updated_at timestamptz default now()
);

-- RLS
alter table daily_completed enable row level security;
alter table daily_custom_tasks enable row level security;
alter table daily_routines enable row level security;
alter table daily_photos enable row level security;
alter table treatment_records enable row level security;

create policy "Anyone can select own data" on daily_completed for select using (true);
create policy "Anyone can insert own data" on daily_completed for insert with check (true);
create policy "Anyone can delete own data" on daily_completed for delete using (true);

create policy "Anyone can select own tasks" on daily_custom_tasks for select using (true);
create policy "Anyone can insert own tasks" on daily_custom_tasks for insert with check (true);
create policy "Anyone can delete own tasks" on daily_custom_tasks for delete using (true);

create policy "Anyone can select own routine" on daily_routines for select using (true);
create policy "Anyone can insert own routine" on daily_routines for insert with check (true);
create policy "Anyone can update own routine" on daily_routines for update using (true);

create policy "Anyone can select own photos" on daily_photos for select using (true);
create policy "Anyone can insert own photos" on daily_photos for insert with check (true);
create policy "Anyone can delete own photos" on daily_photos for delete using (true);

create policy "Anyone can select own records" on treatment_records for select using (true);
create policy "Anyone can insert own records" on treatment_records for insert with check (true);
create policy "Anyone can update own records" on treatment_records for update using (true);

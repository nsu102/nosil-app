create table if not exists analysis_records (
  id bigint generated always as identity primary key,
  uid text not null,
  photo_url text,
  result jsonb not null default '{}',
  created_at timestamptz default now()
);

alter table analysis_records enable row level security;

create policy "Anyone can select own analyses" on analysis_records for select using (true);
create policy "Anyone can insert own analyses" on analysis_records for insert with check (true);

-- Create request_queue table for concurrency control
create table if not exists request_queue (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id), -- Optional, can be null for guests if needed, but best linked
  provider text not null, -- 'gemini' | 'glm'
  model text,
  status text check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS
alter table request_queue enable row level security;

create policy "Users can view own queue items"
  on request_queue for select
  using ( auth.uid() = user_id );

create policy "Users can insert own queue items"
  on request_queue for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own queue items"
  on request_queue for update
  using ( auth.uid() = user_id );

-- Index for fast counting
create index idx_queue_status on request_queue(status);

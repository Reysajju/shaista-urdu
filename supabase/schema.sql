-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector; -- For embeddings

-- Users/Auth handled by Supabase Auth, extended with:
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text default 'free', -- free, pro, enterprise
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Workspaces (main container)
create table workspaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references profiles(id) on delete cascade,
  settings jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Projects within workspaces
create table projects (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  type text check (type in ('chat', 'doc', 'slide', 'sheet', 'research')),
  title text not null,
  content jsonb default '{}',
  parent_id uuid references projects(id), -- For nested docs
  version integer default 1,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Chat-specific tables
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  model text default 'kimi-k2-5',
  system_prompt text,
  settings jsonb default '{}'
);

create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}', -- token usage, latency, etc.
  parent_message_id uuid references messages(id), -- For branching
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Real-time collaboration cursors
create table presence (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id),
  cursor jsonb, -- {x, y, selection}
  last_seen timestamp with time zone default timezone('utc'::text, now())
);

-- Vector embeddings for memory/RAG
create table embeddings (
  id uuid default uuid_generate_v4() primary key,
  content_id uuid references projects(id) on delete cascade,
  content_type text,
  embedding vector(1536),
  metadata jsonb
);

-- Agent Swarm definitions
create table agents (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  role text not null,
  system_prompt text,
  tools jsonb default '[]',
  model_config jsonb default '{}',
  is_active boolean default true
);

-- Enable Row Level Security
alter table workspaces enable row level security;
alter table projects enable row level security;

-- RLS Policies
create policy "Users can view workspace they belong to"
  on workspaces for select using (auth.uid() = owner_id);

create policy "Users can view their projects"
  on projects for select using (
    exists (
      select 1 from workspaces w 
      where w.id = projects.workspace_id 
      and w.owner_id = auth.uid()
    )
  );

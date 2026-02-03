-- ALERTS: Run this in your Supabase SQL Editor to fix "UNRESTRICTED" warnings

-- 1. Profiles (User Data)
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on profiles for insert
  with check ( auth.uid() = id );

-- 2. Conversations
alter table conversations enable row level security;

create policy "Users can view own conversations"
  on conversations for select
  using (
    exists (
      select 1 from projects p
      join workspaces w on p.workspace_id = w.id
      where conversations.project_id = p.id
      and w.owner_id = auth.uid()
    )
  );

create policy "Users can insert own conversations"
  on conversations for insert
  with check (
    exists (
      select 1 from projects p
      join workspaces w on p.workspace_id = w.id
      where conversations.project_id = p.id
      and w.owner_id = auth.uid()
    )
  );

-- 3. Messages
alter table messages enable row level security;

create policy "Users can view own messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      join projects p on c.project_id = p.id
      join workspaces w on p.workspace_id = w.id
      where messages.conversation_id = c.id
      and w.owner_id = auth.uid()
    )
  );

create policy "Users can insert own messages"
  on messages for insert
  with check (
    exists (
      select 1 from conversations c
      join projects p on c.project_id = p.id
      join workspaces w on p.workspace_id = w.id
      where messages.conversation_id = c.id
      and w.owner_id = auth.uid()
    )
  );

-- 4. Embeddings
alter table embeddings enable row level security;

create policy "Users can view own embeddings"
  on embeddings for select
  using (
    exists (
      select 1 from projects p
      join workspaces w on p.workspace_id = w.id
      where embeddings.content_id = p.id
      and w.owner_id = auth.uid()
    )
  );

-- 5. Agents
alter table agents enable row level security;

create policy "Users can view own agents"
  on agents for select
  using (
    exists (
      select 1 from workspaces w
      where agents.workspace_id = w.id
      and w.owner_id = auth.uid()
    )
  );

-- 6. Presence
alter table presence enable row level security;

create policy "Users can view presence in own projects"
  on presence for select
  using (
    exists (
      select 1 from projects p
      join workspaces w on p.workspace_id = w.id
      where presence.project_id = p.id
      and w.owner_id = auth.uid()
    )
  );

create policy "Users can update own presence"
  on presence for all
  using ( auth.uid() = user_id );

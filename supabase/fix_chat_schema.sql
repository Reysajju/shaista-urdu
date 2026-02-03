-- FIX: Add ownership to conversations to allow standalone chats (without projects)

-- 1. Add user_id to conversations
alter table conversations 
add column if not exists user_id uuid references profiles(id);

-- 2. Update RLS for Conversations to allow access if you are the owner (user_id) OR it belongs to your project
drop policy if exists "Users can view own conversations" on conversations;
create policy "Users can view own conversations"
  on conversations for select
  using (
    (user_id = auth.uid()) or
    exists (
      select 1 from projects p
      join workspaces w on p.workspace_id = w.id
      where conversations.project_id = p.id
      and w.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own conversations" on conversations;
create policy "Users can insert own conversations"
  on conversations for insert
  with check (
    (user_id = auth.uid()) or
    exists (
      select 1 from projects p
      join workspaces w on p.workspace_id = w.id
      where conversations.project_id = p.id
      and w.owner_id = auth.uid()
    )
  );

-- 3. Update RLS for Messages to allow access if conversation is owned by user
drop policy if exists "Users can view own messages" on messages;
create policy "Users can view own messages"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      left join projects p on c.project_id = p.id
      left join workspaces w on p.workspace_id = w.id
      where messages.conversation_id = c.id
      and (
        c.user_id = auth.uid() or 
        w.owner_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can insert own messages" on messages;
create policy "Users can insert own messages"
  on messages for insert
  with check (
    exists (
      select 1 from conversations c
      left join projects p on c.project_id = p.id
      left join workspaces w on p.workspace_id = w.id
      where messages.conversation_id = c.id
      and (
        c.user_id = auth.uid() or 
        w.owner_id = auth.uid()
      )
    )
  );

create extension if not exists "pgcrypto";

create type public.workspace_role as enum ('owner', 'admin', 'member');
create type public.task_priority as enum ('urgent', 'high', 'medium', 'low');
create type public.task_status as enum ('todo', 'in_progress', 'review', 'done');
create type public.board_visibility as enum ('workspace', 'private');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  visibility public.board_visibility not null default 'workspace',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  name text not null,
  status public.task_status not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null,
  description text,
  priority public.task_priority not null default 'medium',
  due_date date,
  position int not null default 0,
  created_by uuid not null references public.profiles(id) on delete cascade,
  assignee_id uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_labels (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_complete boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size int,
  mime_type text,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index memberships_user_id_idx on public.memberships(user_id);
create index memberships_workspace_id_idx on public.memberships(workspace_id);
create index boards_workspace_id_idx on public.boards(workspace_id);
create index columns_board_position_idx on public.columns(board_id, position);
create index tasks_board_column_position_idx on public.tasks(board_id, column_id, position);
create index tasks_assignee_id_idx on public.tasks(assignee_id);
create index comments_task_created_idx on public.comments(task_id, created_at desc);
create index activities_workspace_created_idx on public.activities(workspace_id, created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id, is_read, created_at desc);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.labels enable row level security;
alter table public.tasks enable row level security;
alter table public.task_labels enable row level security;
alter table public.comments enable row level security;
alter table public.subtasks enable row level security;
alter table public.attachments enable row level security;
alter table public.activities enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where workspace_id = target_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships
    where workspace_id = target_workspace and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

create policy "profiles readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members read workspaces" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "authenticated create workspaces" on public.workspaces for insert to authenticated with check (created_by = auth.uid());
create policy "admins update workspaces" on public.workspaces for update to authenticated using (public.is_workspace_admin(id));

create policy "members read memberships" on public.memberships for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "admins manage memberships" on public.memberships for all to authenticated using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));

create policy "members manage boards" on public.boards for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members manage labels" on public.labels for all to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy "members manage columns" on public.columns for all to authenticated
using (exists (select 1 from public.boards b where b.id = board_id and public.is_workspace_member(b.workspace_id)))
with check (exists (select 1 from public.boards b where b.id = board_id and public.is_workspace_member(b.workspace_id)));

create policy "members manage tasks" on public.tasks for all to authenticated
using (exists (select 1 from public.boards b where b.id = board_id and public.is_workspace_member(b.workspace_id)))
with check (exists (select 1 from public.boards b where b.id = board_id and public.is_workspace_member(b.workspace_id)));

create policy "members manage task labels" on public.task_labels for all to authenticated
using (exists (select 1 from public.tasks t join public.boards b on b.id = t.board_id where t.id = task_id and public.is_workspace_member(b.workspace_id)))
with check (exists (select 1 from public.tasks t join public.boards b on b.id = t.board_id where t.id = task_id and public.is_workspace_member(b.workspace_id)));

create policy "members manage comments" on public.comments for all to authenticated
using (exists (select 1 from public.tasks t join public.boards b on b.id = t.board_id where t.id = task_id and public.is_workspace_member(b.workspace_id)))
with check (exists (select 1 from public.tasks t join public.boards b on b.id = t.board_id where t.id = task_id and public.is_workspace_member(b.workspace_id)));

create policy "members manage subtasks" on public.subtasks for all to authenticated
using (exists (select 1 from public.tasks t join public.boards b on b.id = t.board_id where t.id = task_id and public.is_workspace_member(b.workspace_id)))
with check (exists (select 1 from public.tasks t join public.boards b on b.id = t.board_id where t.id = task_id and public.is_workspace_member(b.workspace_id)));

create policy "members manage attachments" on public.attachments for all to authenticated
using (exists (select 1 from public.tasks t join public.boards b on b.id = t.board_id where t.id = task_id and public.is_workspace_member(b.workspace_id)))
with check (exists (select 1 from public.tasks t join public.boards b on b.id = t.board_id where t.id = task_id and public.is_workspace_member(b.workspace_id)));

create policy "members read activities" on public.activities for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "users read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid());

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_touch_updated_at before update on public.tasks
for each row execute function public.touch_updated_at();

create or replace function public.workspace_for_task(task_board uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select workspace_id from public.boards where id = task_board;
$$;

create or replace function public.audit_task_changes()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_workspace uuid;
  action_name text;
begin
  target_workspace := public.workspace_for_task(coalesce(new.board_id, old.board_id));
  action_name := case
    when tg_op = 'INSERT' then 'task_created'
    when tg_op = 'UPDATE' and old.column_id is distinct from new.column_id then 'task_moved'
    when tg_op = 'UPDATE' then 'task_edited'
    when tg_op = 'DELETE' then 'task_deleted'
  end;
  insert into public.activities(workspace_id, actor_id, entity_type, entity_id, action, metadata)
  values (target_workspace, auth.uid(), 'task', coalesce(new.id, old.id), action_name, jsonb_build_object('title', coalesce(new.title, old.title)));
  return coalesce(new, old);
end;
$$;

create trigger tasks_audit after insert or update or delete on public.tasks
for each row execute function public.audit_task_changes();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  workspace_id uuid;
  board_id uuid;
  todo_id uuid;
  progress_id uuid;
  review_id uuid;
  done_id uuid;
begin
  insert into public.profiles(id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);

  insert into public.workspaces(name, slug, created_by)
  values ('Acme Product', 'acme-' || substr(new.id::text, 1, 8), new.id)
  returning id into workspace_id;

  insert into public.memberships(workspace_id, user_id, role) values (workspace_id, new.id, 'owner');
  insert into public.labels(workspace_id, name, color)
  values (workspace_id, 'Design', '#14b8a6'), (workspace_id, 'Engineering', '#6366f1'), (workspace_id, 'Bug', '#ef4444'), (workspace_id, 'Launch', '#f59e0b');

  insert into public.boards(workspace_id, name, description, created_by)
  values (workspace_id, 'Product roadmap', 'A polished starter board for planning launches, fixes, and experiments.', new.id)
  returning id into board_id;

  insert into public.columns(board_id, name, status, position) values
    (board_id, 'Todo', 'todo', 0) returning id into todo_id;
  insert into public.columns(board_id, name, status, position) values
    (board_id, 'In Progress', 'in_progress', 1) returning id into progress_id;
  insert into public.columns(board_id, name, status, position) values
    (board_id, 'Review', 'review', 2) returning id into review_id;
  insert into public.columns(board_id, name, status, position) values
    (board_id, 'Done', 'done', 3) returning id into done_id;

  insert into public.tasks(board_id, column_id, title, description, priority, position, created_by, assignee_id, due_date)
  values
    (board_id, todo_id, 'Draft enterprise onboarding flow', 'Map the workspace creation, invites, and role management experience.', 'high', 0, new.id, new.id, current_date + 4),
    (board_id, progress_id, 'Wire realtime board updates', 'Subscribe to task changes and presence so teammates feel live in the room.', 'urgent', 0, new.id, new.id, current_date + 2),
    (board_id, review_id, 'Polish analytics dashboard', 'Tune chart density, responsive states, and executive summary metrics.', 'medium', 0, new.id, new.id, current_date + 7),
    (board_id, done_id, 'Define visual system tokens', 'Dark-first palette, spacing rhythm, cards, and interaction states.', 'low', 0, new.id, new.id, current_date - 1);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.create_workspace_with_defaults(workspace_name text, workspace_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  workspace_id uuid;
  board_id uuid;
begin
  insert into public.workspaces(name, slug, created_by)
  values (workspace_name, workspace_slug, auth.uid())
  returning id into workspace_id;
  insert into public.memberships(workspace_id, user_id, role) values (workspace_id, auth.uid(), 'owner');
  insert into public.boards(workspace_id, name, description, created_by)
  values (workspace_id, 'Team board', 'Default planning board.', auth.uid())
  returning id into board_id;
  insert into public.columns(board_id, name, status, position) values
    (board_id, 'Todo', 'todo', 0),
    (board_id, 'In Progress', 'in_progress', 1),
    (board_id, 'Review', 'review', 2),
    (board_id, 'Done', 'done', 3);
  return workspace_id;
end;
$$;

alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.activities;

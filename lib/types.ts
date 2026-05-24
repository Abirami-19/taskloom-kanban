export type Role = "owner" | "admin" | "member";
export type Priority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_by: string;
  created_at: string;
};

export type Membership = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: Role;
  profiles?: Profile;
};

export type Board = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  visibility: "workspace" | "private";
  created_by: string;
  created_at: string;
};

export type Column = {
  id: string;
  board_id: string;
  name: string;
  status: TaskStatus;
  position: number;
};

export type Label = {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  position: number;
  created_by: string;
  assignee_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile | null;
  task_labels?: { labels: Label }[];
  comments?: Comment[];
  subtasks?: Subtask[];
};

export type Comment = {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
};

export type Subtask = {
  id: string;
  task_id: string;
  title: string;
  is_complete: boolean;
  position: number;
};

export type Activity = {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: Profile | null;
};

export type Notification = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

export type BoardPayload = {
  workspace: Workspace;
  workspaces: Workspace[];
  membership: Membership;
  members: Membership[];
  boards: Board[];
  activeBoard: Board;
  columns: Column[];
  tasks: Task[];
  labels: Label[];
  activities: Activity[];
  notifications: Notification[];
};

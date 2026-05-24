import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Activity, Board, BoardPayload, Column, Label, Membership, Notification, Task, Workspace } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireUser() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function ensureStarterBoard(supabase: Awaited<ReturnType<typeof createClient>>, workspace: Workspace, userId: string) {
  const { data: existingBoards } = await supabase
    .from("boards")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (existingBoards?.length) return existingBoards as Board[];

  const { data: board, error: boardError } = await supabase
    .from("boards")
    .insert({
      workspace_id: workspace.id,
      name: "Getting Started",
      description: "Your launch board with a few guided tasks to get the workspace moving.",
      visibility: "workspace",
      created_by: userId
    })
    .select("*")
    .single();

  if (boardError || !board) return [];

  const { data: columns } = await supabase
    .from("columns")
    .insert([
      { board_id: board.id, name: "Todo", status: "todo", position: 0 },
      { board_id: board.id, name: "In Progress", status: "in_progress", position: 1 },
      { board_id: board.id, name: "Done", status: "done", position: 2 }
    ])
    .select("*")
    .order("position");

  const todo = columns?.find((column) => column.status === "todo");
  if (todo) {
    await supabase.from("tasks").insert([
      {
        board_id: board.id,
        column_id: todo.id,
        title: "Invite your first teammate",
        description: "Open Settings, add a teammate by email, and start collaborating in realtime.",
        priority: "high",
        position: 0,
        created_by: userId,
        assignee_id: userId
      },
      {
        board_id: board.id,
        column_id: todo.id,
        title: "Create a real project board",
        description: "Use the sidebar plus button to create a board for your sprint, launch, or roadmap.",
        priority: "medium",
        position: 1,
        created_by: userId,
        assignee_id: userId
      }
    ]);
  }

  return [board as Board];
}

async function ensureBoardColumns(supabase: Awaited<ReturnType<typeof createClient>>, board: Board) {
  const { data: existingColumns } = await supabase
    .from("columns")
    .select("*")
    .eq("board_id", board.id)
    .order("position");

  if (existingColumns?.length) return existingColumns as Column[];

  const { data: columns } = await supabase
    .from("columns")
    .insert([
      { board_id: board.id, name: "Todo", status: "todo", position: 0 },
      { board_id: board.id, name: "In Progress", status: "in_progress", position: 1 },
      { board_id: board.id, name: "Done", status: "done", position: 2 }
    ])
    .select("*")
    .order("position");

  return (columns as Column[] | null) ?? [];
}

export async function getAppPayload(boardId?: string, workspaceId?: string): Promise<BoardPayload | null> {
  const { supabase, user } = await requireUser();
  const cookieStore = await cookies();
  const activeWorkspaceId = workspaceId ?? cookieStore.get("active_workspace_id")?.value;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const membership =
    ((memberships as Membership[] | null) ?? []).find((item) => item.workspace_id === activeWorkspaceId) ??
    ((memberships as Membership[] | null) ?? [])[0];
  if (!membership) return null;

  const workspaceIds = ((memberships as Membership[] | null) ?? []).map((item) => item.workspace_id);
  const [{ data: workspace }, { data: allWorkspaces }] = await Promise.all([
    supabase.from("workspaces").select("*").eq("id", membership.workspace_id).single(),
    workspaceIds.length
      ? supabase.from("workspaces").select("*").in("id", workspaceIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  const { data: members } = await supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("workspace_id", membership.workspace_id)
    .order("role", { ascending: true });

  let { data: boards } = await supabase
    .from("boards")
    .select("*")
    .eq("workspace_id", membership.workspace_id)
    .order("created_at", { ascending: true });

  if (!workspace) return null;
  boards = await ensureStarterBoard(supabase, workspace as Workspace, user.id);

  const activeBoard = (boards as Board[] | null)?.find((board) => board.id === boardId) ?? (boards as Board[] | null)?.[0];
  if (!activeBoard) return null;
  const ensuredColumns = await ensureBoardColumns(supabase, activeBoard);

  const [{ data: columns }, { data: tasks }, { data: labels }, { data: activities }, { data: notifications }] =
    await Promise.all([
      ensuredColumns.length
        ? Promise.resolve({ data: ensuredColumns })
        : supabase.from("columns").select("*").eq("board_id", activeBoard.id).order("position"),
      supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(*), task_labels(labels(*)), comments(*, profiles(*)), subtasks(*)")
        .eq("board_id", activeBoard.id)
        .order("position"),
      supabase.from("labels").select("*").eq("workspace_id", membership.workspace_id).order("name"),
      supabase
        .from("activities")
        .select("*, profiles(*)")
        .eq("workspace_id", membership.workspace_id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("workspace_id", membership.workspace_id)
        .order("created_at", { ascending: false })
        .limit(20)
    ]);

  return {
    workspace: workspace as Workspace,
    workspaces: (allWorkspaces as Workspace[] | null) ?? [workspace as Workspace],
    membership,
    members: (members as Membership[] | null) ?? [],
    boards: (boards as Board[] | null) ?? [],
    activeBoard,
    columns: (columns as Column[] | null) ?? [],
    tasks: (tasks as Task[] | null) ?? [],
    labels: (labels as Label[] | null) ?? [],
    activities: (activities as Activity[] | null) ?? [],
    notifications: (notifications as Notification[] | null) ?? []
  };
}

export async function getAnalyticsPayload() {
  const payload = await getAppPayload();
  if (!payload) return null;

  const done = payload.tasks.filter((task) => task.completed_at || payload.columns.find((c) => c.id === task.column_id)?.status === "done").length;
  const overdue = payload.tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && !task.completed_at).length;

  return {
    ...payload,
    stats: {
      total: payload.tasks.length,
      done,
      overdue,
      completionRate: payload.tasks.length ? Math.round((done / payload.tasks.length) * 100) : 0
    }
  };
}

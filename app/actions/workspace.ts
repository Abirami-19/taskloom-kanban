"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  boardSchema,
  commentSchema,
  inviteMemberSchema,
  profileSchema,
  subtaskSchema,
  subtaskToggleSchema,
  taskSchema,
  taskUpdateSchema,
  workspaceSchema
} from "@/lib/validations";

export async function createWorkspace(_: unknown, formData: FormData) {
  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid workspace" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { data: workspaceId, error } = await supabase.rpc("create_workspace_with_defaults", {
    workspace_name: parsed.data.name,
    workspace_slug: parsed.data.slug
  });
  if (error) return { error: error.message };
  if (!workspaceId) return { error: "Workspace was created but could not be selected." };

  const { data: board } = await supabase
    .from("boards")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (board) {
    await supabase
      .from("boards")
      .update({
        name: "Getting Started",
        description: "A starter board with the first steps for setting up your workspace."
      })
      .eq("id", board.id);
  }

  const cookieStore = await cookies();
  cookieStore.set("active_workspace_id", workspaceId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });
  revalidatePath("/app");
  redirect("/app");
}

export async function createBoard(workspaceId: string, _: unknown, formData: FormData) {
  const parsed = boardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid board" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("boards")
    .insert({ ...parsed.data, workspace_id: workspaceId, created_by: userData.user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const defaults = ["Todo", "In Progress", "Done"];
  await supabase.from("columns").insert(
    defaults.map((name, position) => ({
      board_id: data.id,
      name,
      status: name.toLowerCase().replace(" ", "_"),
      position
    }))
  );
  revalidatePath("/app");
  return { success: "Board created.", boardId: data.id };
}

export async function selectWorkspace(workspaceId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userData.user.id)
    .single();

  if (!membership) return { error: "Workspace not found." };

  const cookieStore = await cookies();
  cookieStore.set("active_workspace_id", workspaceId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });
  revalidatePath("/app");
  return { success: "Workspace selected." };
}

export async function createTask(boardId: string, columnId: string, _: unknown, formData: FormData) {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid task" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { count } = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("column_id", columnId);
  const { error } = await supabase.from("tasks").insert({
    ...parsed.data,
    board_id: boardId,
    column_id: columnId,
    position: count ?? 0,
    created_by: userData.user.id
  });
  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: "Task created." };
}

export async function updateTask(taskId: string, _: unknown, formData: FormData) {
  const parsed = taskUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid task" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      due_date: parsed.data.due_date || null,
      assignee_id: parsed.data.assignee_id || null
    })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: "Task updated." };
}

export async function addComment(taskId: string, _: unknown, formData: FormData) {
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid comment" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { error } = await supabase.from("comments").insert({
    task_id: taskId,
    user_id: userData.user.id,
    body: parsed.data.body
  });

  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: "Comment added." };
}

export async function addSubtask(taskId: string, _: unknown, formData: FormData) {
  const parsed = subtaskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid checklist item" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };
  const { count } = await supabase.from("subtasks").select("*", { count: "exact", head: true }).eq("task_id", taskId);
  const { error } = await supabase.from("subtasks").insert({
    task_id: taskId,
    title: parsed.data.title,
    position: count ?? 0
  });

  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: "Checklist item added." };
}

export async function updateSubtask(subtaskId: string, isComplete: boolean) {
  const parsed = subtaskToggleSchema.safeParse({ is_complete: isComplete });
  if (!parsed.success) return { error: "Invalid checklist state" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("subtasks")
    .update({ is_complete: parsed.data.is_complete })
    .eq("id", subtaskId);
  if (error) return { error: error.message };
  revalidatePath("/app");
  return { success: "Checklist updated." };
}

export async function updateProfile(_: unknown, formData: FormData) {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid profile" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, email: parsed.data.email })
    .eq("id", userData.user.id);
  if (profileError) return { error: profileError.message };

  const { error: authError } = await supabase.auth.updateUser({ email: parsed.data.email });
  if (authError) return { error: authError.message };

  revalidatePath("/app");
  return { success: "Profile updated." };
}

export async function inviteMember(workspaceId: string, _: unknown, formData: FormData) {
  const parsed = inviteMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid invite" };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "You must be signed in." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", parsed.data.email)
    .single();

  if (profileError || !profile) return { error: "That user needs to sign up before they can be added." };

  const { error } = await supabase.from("memberships").upsert(
    {
      workspace_id: workspaceId,
      user_id: profile.id,
      role: parsed.data.role
    },
    { onConflict: "workspace_id,user_id" }
  );
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    workspace_id: workspaceId,
    user_id: profile.id,
    title: "You were added to a workspace",
    body: "Open the workspace to start collaborating.",
    href: "/app"
  });

  revalidatePath("/app");
  return { success: "Member added and notified." };
}

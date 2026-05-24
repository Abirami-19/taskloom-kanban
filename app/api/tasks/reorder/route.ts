import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reorderTaskSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = reorderTaskSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid reorder payload" }, { status: 422 });

  const body = parsed.data;
  const { data: task } = await supabase
    .from("tasks")
    .select("id, board_id, column_id")
    .eq("id", body.taskId)
    .single();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { data: column } = await supabase
    .from("columns")
    .select("id, board_id")
    .eq("id", body.columnId)
    .single();
  if (!column || column.board_id !== task.board_id) {
    return NextResponse.json({ error: "Target column does not belong to this board" }, { status: 422 });
  }

  const { data: targetTasks, error: targetError } = await supabase
    .from("tasks")
    .select("id, position")
    .eq("column_id", body.columnId)
    .neq("id", body.taskId)
    .order("position", { ascending: true });

  if (targetError) return NextResponse.json({ error: targetError.message }, { status: 400 });

  const nextTargetOrder = [...(targetTasks ?? [])];
  nextTargetOrder.splice(Math.min(body.position, nextTargetOrder.length), 0, { id: body.taskId, position: body.position });

  const updates = nextTargetOrder.map((item, position) =>
    supabase
      .from("tasks")
      .update({ column_id: body.columnId, position, updated_at: new Date().toISOString() })
      .eq("id", item.id)
  );

  if (task.column_id !== body.columnId) {
    const { data: sourceTasks, error: sourceError } = await supabase
      .from("tasks")
      .select("id, position")
      .eq("column_id", task.column_id)
      .neq("id", body.taskId)
      .order("position", { ascending: true });

    if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 400 });
    updates.push(
      ...(sourceTasks ?? []).map((item, position) =>
        supabase
          .from("tasks")
          .update({ position, updated_at: new Date().toISOString() })
          .eq("id", item.id)
      )
    );
  }

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

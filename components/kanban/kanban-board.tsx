"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock3, SlidersHorizontal, Users } from "lucide-react";
import { createTask } from "@/app/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { BoardPayload, Task } from "@/lib/types";
import { useBoardStore } from "@/store/board-store";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { TaskCard } from "@/components/kanban/task-card";
import { TaskModal } from "@/components/kanban/task-modal";

export function KanbanBoard({ payload, query }: { payload: BoardPayload; query?: string }) {
  const { columns, tasks, selectedTask, draggingTask, setBoard, upsertTask, removeTask, setSelectedTask, setDraggingTask, moveTask } = useBoardStore();
  const [search, setSearch] = useState(query ?? "");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [presence, setPresence] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 8 } })
  );
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => setBoard(payload.columns, payload.tasks), [payload.columns, payload.tasks, setBoard]);

  useEffect(() => {
    const channel = supabase
      .channel(`board:${payload.activeBoard.id}`, { config: { presence: { key: crypto.randomUUID() } } })
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `board_id=eq.${payload.activeBoard.id}` }, async (event) => {
        if (event.eventType === "DELETE") removeTask((event.old as Task).id);
        else {
          const { data } = await supabase
            .from("tasks")
            .select("*, assignee:profiles!tasks_assignee_id_fkey(*), task_labels(labels(*)), comments(*, profiles(*)), subtasks(*)")
            .eq("id", (event.new as Task).id)
            .single();
          upsertTask((data as Task | null) ?? (event.new as Task));
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ name: string }>();
        setPresence(Object.values(state).flat().map((item) => item.name));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ name: payload.membership.profiles?.full_name ?? "Teammate" });
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [payload.activeBoard.id, payload.membership.profiles?.full_name, removeTask, supabase, upsertTask]);

  const visibleTasks = useMemo(() => {
    const term = search.toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = term ? `${task.title} ${task.description ?? ""}`.toLowerCase().includes(term) : true;
      const matchesPriority = priorityFilter === "all" ? true : task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [priorityFilter, search, tasks]);

  const freshSelectedTask = useMemo(
    () => (selectedTask ? tasks.find((task) => task.id === selectedTask.id) ?? selectedTask : null),
    [selectedTask, tasks]
  );

  function onDragStart(event: DragStartEvent) {
    const task = tasks.find((item) => item.id === event.active.id);
    setDraggingTask(task ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setDraggingTask(null);
    if (!over) return;
    const task = tasks.find((item) => item.id === active.id);
    if (!task) return;
    const overTask = tasks.find((item) => item.id === over.id);
    const columnId = overTask?.column_id ?? String(over.id);
    const position = overTask?.position ?? tasks.filter((item) => item.column_id === columnId).length;
    moveTask(task.id, columnId, position);
    startTransition(() => {
      void fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, columnId, position })
      });
    });
  }

  return (
    <section className="space-y-5 p-3 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{payload.activeBoard.name}</h1>
            <Badge>{payload.activeBoard.visibility}</Badge>
            {isPending ? <Badge className="border-emerald-500/30 text-emerald-600">Syncing</Badge> : null}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{payload.activeBoard.description ?? "Plan, assign, discuss, and ship work with realtime context."}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1"><Clock3 className="size-3.5" />{tasks.length} total</span>
            <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1"><CheckCircle2 className="size-3.5" />{tasks.filter((task) => columns.find((column) => column.id === task.column_id)?.status === "done").length} done</span>
            <span className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1"><AlertCircle className="size-3.5" />{tasks.filter((task) => task.priority === "urgent").length} urgent</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            {presence.length || 1} online
          </div>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter board..." className="w-full sm:w-52" />
          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="all">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Button variant="outline" onClick={() => { setSearch(""); setPriorityFilter("all"); }}>
            <SlidersHorizontal /> Reset
          </Button>
        </div>
      </div>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="kanban-scrollbar flex min-h-[calc(100vh-14rem)] gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTasks = visibleTasks.filter((task) => task.column_id === column.id).sort((a, b) => a.position - b.position);
            return (
              <SortableContext key={column.id} items={columnTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                <KanbanColumn
                  column={column}
                  count={columnTasks.length}
                  action={createTask.bind(null, payload.activeBoard.id, column.id)}
                >
                  <AnimatePresence initial={false}>
                    {columnTasks.map((task) => <TaskCard key={task.id} task={task} onOpen={() => setSelectedTask(task)} />)}
                  </AnimatePresence>
                </KanbanColumn>
              </SortableContext>
            );
          })}
        </div>
        <DragOverlay>{draggingTask ? <TaskCard task={draggingTask} dragging /> : null}</DragOverlay>
      </DndContext>
      <TaskModal task={freshSelectedTask} members={payload.members} labels={payload.labels} onClose={() => setSelectedTask(null)} />
    </section>
  );
}

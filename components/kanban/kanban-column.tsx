"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { MoreHorizontal, Plus } from "lucide-react";
import type { Column } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionState = { error?: string; success?: string };

export function KanbanColumn({
  column,
  count,
  action,
  children
}: {
  column: Column;
  count: number;
  action: (state: unknown, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  return (
    <div ref={setNodeRef} className={`flex w-[18.5rem] shrink-0 flex-col rounded-lg border bg-card/70 transition sm:w-[20rem] ${isOver ? "ring-2 ring-emerald-500/40" : ""}`}>
      <div className="flex h-12 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{column.name}</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
        </div>
        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
      </div>
      <div className="kanban-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
        {children}
        {open ? (
          <form ref={formRef} action={formAction} className="space-y-2 rounded-md border bg-background p-2 shadow-sm">
            <Input name="title" placeholder="Task title" autoFocus required />
            <input type="hidden" name="priority" value="medium" />
            {state && "error" in state ? <p className="text-xs text-destructive">{state.error}</p> : null}
            <div className="flex gap-2">
              <Button size="sm" disabled={pending}>{pending ? "Adding..." : "Add"}</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => setOpen(true)}>
            <Plus /> New task
          </Button>
        )}
      </div>
    </div>
  );
}

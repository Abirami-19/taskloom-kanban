"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2, MessageSquare, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import type { Task } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";

const priorityStyles = {
  urgent: "border-red-500/30 text-red-500",
  high: "border-amber-500/30 text-amber-500",
  medium: "border-sky-500/30 text-sky-500",
  low: "border-zinc-500/30 text-muted-foreground"
};

export function TaskCard({ task, onOpen, dragging }: { task: Task; onOpen?: () => void; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const labels = task.task_labels?.map((item) => item.labels) ?? [];
  const complete = task.subtasks?.filter((item) => item.is_complete).length ?? 0;
  const subtasks = task.subtasks?.length ?? 0;

  return (
    <motion.article
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn(
        "cursor-grab rounded-lg border bg-background p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md",
        (isDragging || dragging) && "opacity-70 shadow-xl"
      )}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <Badge className={priorityStyles[task.priority]}>{task.priority}</Badge>
        {labels.slice(0, 2).map((label) => (
          <span key={label.id} className="h-2 w-8 rounded-full" style={{ backgroundColor: label.color }} />
        ))}
      </div>
      <h3 className="text-sm font-medium leading-5">{task.title}</h3>
      {task.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p> : null}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.due_date ? <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />{format(new Date(task.due_date), "MMM d")}</span> : null}
          <span className="flex items-center gap-1"><MessageSquare className="size-3.5" />{task.comments?.length ?? 0}</span>
          <span className="flex items-center gap-1"><Paperclip className="size-3.5" />0</span>
          {subtasks ? <span className="flex items-center gap-1"><CheckCircle2 className="size-3.5" />{complete}/{subtasks}</span> : null}
        </div>
        {task.assignee ? (
          <Avatar className="size-7">
            <AvatarImage src={task.assignee.avatar_url ?? undefined} />
            <AvatarFallback>{initials(task.assignee.full_name ?? task.assignee.email)}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </motion.article>
  );
}

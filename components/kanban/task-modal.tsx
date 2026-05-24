"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Calendar, CheckSquare, Flag, MessageSquare, Paperclip, SmilePlus, UserRound } from "lucide-react";
import { addComment, addSubtask, updateSubtask, updateTask } from "@/app/actions/workspace";
import type { Label, Membership, Task } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/utils";

type ActionState = { error?: string; success?: string };

export function TaskModal({
  task,
  members,
  labels,
  onClose
}: {
  task: Task | null;
  members: Membership[];
  labels: Label[];
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(task)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0">
        {task ? (
          <TaskModalBody key={task.id} task={task} members={members} labels={labels} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TaskModalBody({ task, members, labels }: { task: Task; members: Membership[]; labels: Label[] }) {
  const router = useRouter();
  const commentRef = useRef<HTMLFormElement>(null);
  const subtaskRef = useRef<HTMLFormElement>(null);
  const [updateState, updateAction, updatePending] = useActionState<ActionState, FormData>(updateTask.bind(null, task.id), {});
  const [commentState, commentAction, commentPending] = useActionState<ActionState, FormData>(addComment.bind(null, task.id), {});
  const [subtaskState, subtaskAction, subtaskPending] = useActionState<ActionState, FormData>(addSubtask.bind(null, task.id), {});

  useEffect(() => {
    if (commentState.success) {
      commentRef.current?.reset();
      router.refresh();
    }
  }, [commentState.success, router]);

  useEffect(() => {
    if (subtaskState.success) {
      subtaskRef.current?.reset();
      router.refresh();
    }
  }, [subtaskState.success, router]);

  useEffect(() => {
    if (updateState.success) router.refresh();
  }, [router, updateState.success]);

  return (
    <div className="grid max-h-[90vh] overflow-hidden lg:grid-cols-[1fr_17rem]">
      <div className="kanban-scrollbar max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        <DialogTitle className="pr-8 text-xl">{task.title}</DialogTitle>
        <DialogDescription className="mt-2">
          Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </DialogDescription>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge><Flag className="mr-1 size-3" />{task.priority}</Badge>
          {task.due_date ? <Badge><Calendar className="mr-1 size-3" />{task.due_date}</Badge> : null}
          {(task.task_labels ?? []).map(({ labels: label }) => (
            <Badge key={label.id} style={{ borderColor: label.color }}>{label.name}</Badge>
          ))}
        </div>

        <form action={updateAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="task-title">Title</label>
            <Input id="task-title" name="title" defaultValue={task.title} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="task-description">Description</label>
            <Textarea id="task-description" name="description" defaultValue={task.description ?? ""} placeholder="Add context, requirements, specs, links, or decisions..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground" htmlFor="task-priority">Priority</label>
              <select id="task-priority" name="priority" defaultValue={task.priority} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground" htmlFor="task-date">Due date</label>
              <Input id="task-date" name="due_date" type="date" defaultValue={task.due_date ?? ""} />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground" htmlFor="task-assignee">Assignee</label>
              <select id="task-assignee" name="assignee_id" defaultValue={task.assignee_id ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.profiles?.full_name ?? member.profiles?.email ?? "Teammate"}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {updateState.error ? <p className="text-sm text-destructive">{updateState.error}</p> : null}
          {updateState.success ? <p className="text-sm text-emerald-600">{updateState.success}</p> : null}
          <Button disabled={updatePending}>{updatePending ? "Saving..." : "Save task"}</Button>
        </form>

        <section className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><CheckSquare className="size-4" />Checklist</h3>
          <div className="space-y-2">
            {(task.subtasks ?? []).sort((a, b) => a.position - b.position).map((subtask) => (
              <SubtaskRow key={subtask.id} id={subtask.id} title={subtask.title} isComplete={subtask.is_complete} />
            ))}
            <form ref={subtaskRef} action={subtaskAction} className="flex gap-2">
              <Input name="title" placeholder="Add checklist item" />
              <Button variant="outline" disabled={subtaskPending}>{subtaskPending ? "Adding..." : "Add"}</Button>
            </form>
            {subtaskState.error ? <p className="text-xs text-destructive">{subtaskState.error}</p> : null}
          </div>
        </section>

        <section className="mt-8">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><MessageSquare className="size-4" />Comments</h3>
          <form ref={commentRef} action={commentAction} className="space-y-2">
            <Textarea name="body" placeholder="Write a comment or mention a teammate..." />
            {commentState.error ? <p className="text-xs text-destructive">{commentState.error}</p> : null}
            <Button variant="outline" disabled={commentPending}>{commentPending ? "Posting..." : "Post comment"}</Button>
          </form>
          <div className="mt-4 space-y-3">
            {(task.comments ?? []).map((comment) => (
              <div key={comment.id} className="flex gap-3 rounded-md border p-3">
                <Avatar className="size-8">
                  <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(comment.profiles?.full_name ?? comment.profiles?.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{comment.profiles?.full_name ?? "Teammate"}</p>
                  <p className="text-sm text-muted-foreground">{comment.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-5 border-t bg-secondary/20 p-5 lg:border-l lg:border-t-0">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><UserRound className="size-4" />Assignee</h3>
          <div className="space-y-2">
            {members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-secondary">
                <Avatar className="size-7">
                  <AvatarImage src={member.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(member.profiles?.full_name ?? member.profiles?.email)}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{member.profiles?.full_name ?? member.profiles?.email}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Labels</h3>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => <Badge key={label.id} style={{ borderColor: label.color }}>{label.name}</Badge>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled title="Supabase Storage bucket required"><Paperclip />Attach</Button>
          <Button variant="outline" disabled title="Reactions require a reactions table"><SmilePlus />React</Button>
        </div>
      </aside>
    </div>
  );
}

function SubtaskRow({ id, title, isComplete }: { id: string; title: string; isComplete: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3 rounded-md border p-2 text-sm transition hover:bg-secondary/60">
      <input
        type="checkbox"
        className="accent-emerald-500"
        defaultChecked={isComplete}
        disabled={pending}
        onChange={(event) => {
          const checked = event.currentTarget.checked;
          startTransition(async () => {
            await updateSubtask(id, checked);
            router.refresh();
          });
        }}
      />
      <span className={isComplete ? "text-muted-foreground line-through" : ""}>{title}</span>
    </label>
  );
}

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBoard } from "@/app/actions/workspace";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ActionState = { error?: string; success?: string; boardId?: string };

export function CreateBoardDialog({ workspaceId, children }: { workspaceId: string; children: React.ReactNode }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(createBoard.bind(null, workspaceId), {});

  useEffect(() => {
    if (state.boardId) router.push(`/app?board=${state.boardId}`);
    else if (state.success) router.refresh();
  }, [router, state.boardId, state.success]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Create board</DialogTitle>
        <DialogDescription>Set up a focused surface for a project, sprint, or initiative.</DialogDescription>
        <form action={action} className="space-y-4">
          <Input name="name" placeholder="Growth launch" required />
          <Textarea name="description" placeholder="What this board is driving..." />
          <select name="visibility" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="workspace">Workspace visible</option>
            <option value="private">Private</option>
          </select>
          {state && "error" in state ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button disabled={pending}>{pending ? "Creating..." : "Create board"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

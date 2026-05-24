"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MousePointer2, Plus, Sparkles, Users } from "lucide-react";
import { CreateBoardDialog } from "@/components/app/create-board-dialog";
import { Button } from "@/components/ui/button";
import type { BoardPayload } from "@/lib/types";

export function OnboardingPanel({ payload }: { payload: BoardPayload }) {
  const hasTasks = payload.tasks.length > 0;
  const steps = [
    { label: "Workspace created", done: true },
    { label: "Starter board ready", done: payload.boards.length > 0 },
    { label: "Create or edit a task", done: hasTasks },
    { label: "Invite teammates", done: payload.members.length > 1 }
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="grid gap-4 border-b bg-card/35 p-3 sm:p-5 xl:grid-cols-[1fr_24rem]"
    >
      <div className="rounded-lg border bg-background/80 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-600">
          <Sparkles className="size-4" />
          Welcome to {payload.workspace.name}
        </div>
        <h1 className="max-w-2xl text-2xl font-semibold tracking-tight">Your team workspace is ready to use.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Start with the Getting Started board, drag a task across the workflow, then invite teammates when you are ready for realtime collaboration.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <CreateBoardDialog workspaceId={payload.workspace.id}>
            <Button><Plus />Create board</Button>
          </CreateBoardDialog>
          <Button variant="outline" asChild>
            <a href="/app/settings"><Users />Invite team</a>
          </Button>
          <Button variant="ghost" onClick={() => document.getElementById("kanban-board")?.scrollIntoView({ behavior: "smooth" })}>
            <MousePointer2 />Open board
          </Button>
        </div>
      </div>
      <div className="rounded-lg border bg-background/80 p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold">Setup checklist</p>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.label} className="flex items-center gap-3 rounded-md border bg-card/50 p-3 text-sm">
              <CheckCircle2 className={`size-4 ${step.done ? "text-emerald-500" : "text-muted-foreground"}`} />
              <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

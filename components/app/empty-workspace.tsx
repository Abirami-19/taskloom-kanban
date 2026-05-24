"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Plus, Sparkles } from "lucide-react";
import { createWorkspace } from "@/app/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionState = { error?: string; success?: string };

export function EmptyWorkspace() {
  const router = useRouter();
  const [state, action, pending] = useActionState<ActionState, FormData>(createWorkspace, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border bg-card shadow-2xl lg:grid-cols-[1fr_24rem]">
        <div className="p-6 sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-emerald-500" />
            Realtime workspace setup
          </div>
          <h1 className="max-w-xl text-3xl font-semibold tracking-tight">Create your first workspace and start planning immediately.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            We will create a Getting Started board, starter columns, and guided tasks so your dashboard is useful the moment setup finishes.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Starter board", "Dashboard metrics", "Realtime ready"].map((item) => (
              <div key={item} className="rounded-md border bg-background/70 p-3 text-sm">
                <CheckCircle2 className="mb-2 size-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <form action={action} className="border-t bg-background/70 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="mb-5 flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Plus className="size-5" />
          </div>
          <h2 className="text-lg font-semibold">Workspace details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use a short, memorable slug. You can invite teammates later.</p>
          <div className="mt-5 space-y-3">
            <Input name="name" placeholder="Acme Product" required />
            <Input name="slug" placeholder="acme-product" required pattern="[a-z0-9-]+" />
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
          <Button className="mt-5 w-full" disabled={pending}>
            {pending ? "Creating workspace..." : "Create workspace"}
            <ArrowRight />
          </Button>
        </form>
      </div>
    </div>
  );
}

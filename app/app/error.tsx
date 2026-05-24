"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-lg border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">Something slipped out of sync.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Refresh the workspace state and try again.</p>
        <Button className="mt-5" onClick={reset}>Reload</Button>
      </div>
    </div>
  );
}

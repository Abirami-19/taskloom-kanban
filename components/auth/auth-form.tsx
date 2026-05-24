"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Github, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup" | "reset";
  action: (state: unknown, formData: FormData) => Promise<{ error?: string; success?: string } | void>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  const copy = {
    login: ["Welcome back", "Sign in to continue shipping with your team.", "Sign in"],
    signup: ["Create your workspace", "Start a focused realtime product hub in minutes.", "Create account"],
    reset: ["Reset password", "We will send a secure recovery link to your inbox.", "Send reset link"]
  }[mode];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8">
        <div className="mb-6 flex size-10 items-center justify-center rounded-lg border bg-card font-semibold">N</div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy[0]}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy[1]}</p>
      </div>
      <form action={formAction} className="space-y-4">
        <Input name="email" type="email" placeholder="you@company.com" required />
        {mode !== "reset" ? <Input name="password" type="password" placeholder="Password" required minLength={8} /> : null}
        {state && "error" in state && state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state && "success" in state && state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
        <Button className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Mail />}
          {copy[2]}
        </Button>
      </form>
      {mode !== "reset" ? (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            SSO
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const supabase = createClient();
              supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${location.origin}/auth/callback` } });
            }}
            className="w-full"
          >
            <Github />
            Continue with GitHub
          </Button>
        </>
      ) : null}
      <div className="mt-6 flex justify-between text-sm text-muted-foreground">
        {mode === "login" ? <Link href="/signup">Create account</Link> : <Link href="/login">Back to login</Link>}
        {mode !== "reset" ? <Link href="/forgot-password">Forgot password?</Link> : null}
      </div>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { Bell, Moon, Shield, Users } from "lucide-react";
import { inviteMember, updateProfile } from "@/app/actions/workspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import type { BoardPayload, Profile } from "@/lib/types";
import { initials } from "@/lib/utils";

type ActionState = { error?: string; success?: string };

export function SettingsClient({ profile, payload }: { profile: Profile; payload: BoardPayload | null }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});
  const [inviteState, inviteAction, invitePending] = useActionState<ActionState, FormData>(
    inviteMember.bind(null, payload?.workspace.id ?? ""),
    {}
  );
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>({
    Mentions: true,
    Assignments: true,
    "Due date alerts": true
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("northstar-notification-preferences");
      if (saved) setNotificationPrefs(JSON.parse(saved) as Record<string, boolean>);
    } catch {
      window.localStorage.removeItem("northstar-notification-preferences");
    }
  }, []);

  function updateNotificationPreference(key: string, value: boolean) {
    const next = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(next);
    try {
      window.localStorage.setItem("northstar-notification-preferences", JSON.stringify(next));
    } catch {
      // Preference persistence is best-effort; UI state remains updated.
    }
  }

  return (
    <section className="space-y-5 p-3 sm:p-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Workspace, account, notifications, and appearance controls.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Moon className="size-4" />Appearance</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Dark is default, preference persists locally.</p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="size-4" />Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Mentions", "Assignments", "Due date alerts"].map((item) => (
              <label key={item} className="flex items-center justify-between rounded-md border p-3 text-sm">
                {item}
                <input
                  className="accent-emerald-500"
                  type="checkbox"
                  checked={notificationPrefs[item] ?? true}
                  onChange={(event) => updateNotificationPreference(item, event.currentTarget.checked)}
                />
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-4" />Account</CardTitle></CardHeader>
          <CardContent>
            <form action={action} className="space-y-3">
              <Input name="full_name" placeholder="Full name" defaultValue={profile.full_name ?? ""} required />
              <Input name="email" type="email" placeholder="Email" defaultValue={profile.email ?? ""} required />
              {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
              {state.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
              <Button disabled={pending}>{pending ? "Saving..." : "Save account"}</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-4" />Workspace members</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {(payload?.members ?? []).map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback>{initials(member.profiles?.full_name ?? member.profiles?.email)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{member.profiles?.full_name ?? member.profiles?.email}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <span className="size-2 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
            <form action={inviteAction} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
              <Input name="email" type="email" placeholder="teammate@company.com" required disabled={!payload} />
              <select name="role" className="h-10 rounded-md border bg-background px-3 text-sm" disabled={!payload}>
                <option>member</option>
                <option>admin</option>
              </select>
              <Button variant="outline" disabled={!payload || invitePending}>{invitePending ? "Adding..." : "Invite"}</Button>
              {inviteState.error ? <p className="text-sm text-destructive sm:col-span-3">{inviteState.error}</p> : null}
              {inviteState.success ? <p className="text-sm text-emerald-600 sm:col-span-3">{inviteState.success}</p> : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

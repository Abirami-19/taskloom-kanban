"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, ChevronDown, Command, LayoutDashboard, LogOut, Plus, Search, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { signOut } from "@/app/actions/auth";
import { selectWorkspace } from "@/app/actions/workspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { initials } from "@/lib/utils";
import type { BoardPayload, Profile } from "@/lib/types";
import { CreateBoardDialog } from "@/components/app/create-board-dialog";
import { NotificationsPanel } from "@/components/app/notifications-panel";
import { useWorkspaceStore } from "@/store/workspace-store";

const nav = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

export function AppShell({ payload, user, children }: { payload: BoardPayload; user: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeBoardId = searchParams.get("board") ?? payload.activeBoard.id;
  const [, startTransition] = useTransition();
  const { setActiveWorkspace, setWorkspaces } = useWorkspaceStore();

  useEffect(() => {
    setActiveWorkspace(payload.workspace.id);
    setWorkspaces(payload.workspaces);
  }, [payload.workspace.id, payload.workspaces, setActiveWorkspace, setWorkspaces]);

  function switchWorkspace(workspaceId: string) {
    setActiveWorkspace(workspaceId);
    document.cookie = `active_workspace_id=${workspaceId}; path=/; max-age=31536000; samesite=lax`;
    startTransition(async () => {
      await selectWorkspace(workspaceId);
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen pb-16 text-foreground sm:p-3 sm:pb-3">
      <div className="grid min-h-screen grid-cols-1 overflow-hidden border bg-background/70 shadow-2xl shadow-black/5 sm:min-h-[calc(100vh-1.5rem)] sm:rounded-lg md:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r bg-card/70 md:flex md:flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-4">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">N</div>
            <div className="min-w-0">
              <label className="sr-only" htmlFor="workspace-switcher">Workspace</label>
              <div className="relative">
                <select
                  id="workspace-switcher"
                  value={payload.workspace.id}
                  onChange={(event) => switchWorkspace(event.target.value)}
                  className="w-full appearance-none truncate bg-transparent pr-6 text-sm font-semibold outline-none"
                >
                  {payload.workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Realtime workspace</p>
            </div>
          </div>
          <div className="flex-1 space-y-6 p-3">
            <div className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                      active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Boards
                <CreateBoardDialog workspaceId={payload.workspace.id}>
                  <button aria-label="Create board"><Plus className="size-3.5" /></button>
                </CreateBoardDialog>
              </div>
              <div className="space-y-1">
                {payload.boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => router.push(`/app?board=${board.id}`)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                      activeBoardId === board.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70"
                    }`}
                  >
                    <span className="truncate">{board.name}</span>
                    {board.visibility === "private" ? <Badge className="text-[10px]">Private</Badge> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t p-3">
            <div className="flex items-center gap-3 rounded-md bg-secondary/60 p-2">
              <Avatar>
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback>{initials(user.full_name ?? user.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.full_name ?? user.email}</p>
                <p className="text-xs text-muted-foreground">{payload.membership.role}</p>
              </div>
              <form action={signOut}>
                <Button variant="ghost" size="icon"><LogOut /></Button>
              </form>
            </div>
          </div>
        </aside>
        <main className="min-w-0">
          <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b bg-background/85 px-3 py-2 backdrop-blur-xl sm:gap-3 sm:px-5">
            <select
              aria-label="Switch board"
              className="hidden h-10 max-w-36 rounded-md border bg-background px-2 text-sm outline-none sm:block md:hidden"
              value={activeBoardId}
              onChange={(event) => router.push(`/app?board=${event.target.value}`)}
            >
              {payload.boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Switch workspace"
              className="h-10 max-w-40 rounded-md border bg-background px-2 text-sm outline-none md:hidden"
              value={payload.workspace.id}
              onChange={(event) => switchWorkspace(event.target.value)}
            >
              {payload.workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
              ))}
            </select>
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9"
                defaultValue={searchParams.get("q") ?? ""}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const value = event.currentTarget.value;
                    const params = new URLSearchParams(searchParams.toString());
                    if (value) params.set("q", value);
                    else params.delete("q");
                    router.push(`/app${params.toString() ? `?${params.toString()}` : ""}`);
                  }
                }}
              />
            </div>
            <Button variant="outline" className="hidden sm:inline-flex"><Command />Ctrl K</Button>
            <ThemeToggle />
            <NotificationsPanel notifications={payload.notifications} userId={user.id} workspaceId={payload.workspace.id} />
          </header>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
            {children}
          </motion.div>
        </main>
      </div>
      <nav className="fixed inset-x-2 bottom-2 z-40 grid grid-cols-3 rounded-lg border bg-card/95 p-1 shadow-2xl backdrop-blur-xl md:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px] transition ${
                active ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <CreateBoardDialog workspaceId={payload.workspace.id}>
        <Button className="fixed bottom-20 right-4 z-40 size-12 rounded-full shadow-2xl md:hidden" size="icon" aria-label="Create board">
          <Plus />
        </Button>
      </CreateBoardDialog>
    </div>
  );
}

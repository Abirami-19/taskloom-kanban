import { Activity, ArrowUpRight, CheckCircle2, Clock3, Plus, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAppPayload } from "@/lib/data";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { EmptyWorkspace } from "@/components/app/empty-workspace";
import { OnboardingPanel } from "@/components/app/onboarding-panel";
import { CreateBoardDialog } from "@/components/app/create-board-dialog";
import { Button } from "@/components/ui/button";

export default async function AppPage({ searchParams }: { searchParams: Promise<{ board?: string; workspace?: string; q?: string }> }) {
  const params = await searchParams;
  const payload = await getAppPayload(params.board, params.workspace);
  if (!payload) return <EmptyWorkspace />;

  const completed = payload.tasks.filter((task) => task.completed_at || payload.columns.find((column) => column.id === task.column_id)?.status === "done").length;
  const overdue = payload.tasks.filter((task) => task.due_date && new Date(task.due_date) < new Date() && !task.completed_at).length;

  return (
    <>
      <OnboardingPanel payload={payload} />
      <section className="grid gap-4 p-3 sm:p-5 xl:grid-cols-[1fr_22rem]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Open tasks" value={payload.tasks.length - completed} icon={<Clock3 />} />
          <Metric title="Completed" value={completed} icon={<CheckCircle2 />} />
          <Metric title="Overdue" value={overdue} icon={<ArrowUpRight />} />
          <Metric title="Members" value={payload.members.length} icon={<Users />} />
        </div>
        <Card className="xl:row-span-2">
          <CardHeader>
            <CardTitle>Team pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payload.members.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
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
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payload.activities.slice(0, 4).map((item) => (
              <div key={item.id} className="flex gap-3 text-sm">
                <div className="mt-1 flex size-7 items-center justify-center rounded-full bg-secondary"><Activity className="size-3.5" /></div>
                <div>
                  <p>{item.action.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
            {!payload.activities.length ? <p className="text-sm text-muted-foreground">Activity will appear as your team works.</p> : null}
          </CardContent>
        </Card>
      </section>
      <div className="flex justify-end px-3 sm:hidden">
        <CreateBoardDialog workspaceId={payload.workspace.id}>
          <Button className="w-full"><Plus />Create board</Button>
        </CreateBoardDialog>
      </div>
      <div id="kanban-board">
        <KanbanBoard payload={payload} query={params.q} />
      </div>
    </>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}

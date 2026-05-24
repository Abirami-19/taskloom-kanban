"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BoardPayload } from "@/lib/types";

type AnalyticsPayload = (BoardPayload & {
  stats: {
    total: number;
    done: number;
    overdue: number;
    completionRate: number;
  };
}) | null;

const colors = ["#14b8a6", "#6366f1", "#f59e0b", "#ef4444"];

export function AnalyticsClient({ payload }: { payload: AnalyticsPayload }) {
  const columns = payload?.columns ?? [];
  const tasks = payload?.tasks ?? [];
  const statusData = columns.map((column, index) => ({
    name: column.name,
    value: tasks.filter((task) => task.column_id === column.id).length,
    color: colors[index % colors.length]
  }));
  const priorityData = ["urgent", "high", "medium", "low"].map((priority) => ({
    name: priority,
    value: tasks.filter((task) => task.priority === priority).length
  }));
  const throughput = columns.map((column) => ({
    day: column.name,
    created: tasks.filter((task) => task.column_id === column.id).length,
    done: column.status === "done" ? tasks.filter((task) => task.column_id === column.id).length : 0
  }));

  return (
    <section className="space-y-5 p-3 sm:p-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {payload ? `${payload.stats.completionRate}% completion, ${payload.stats.overdue} overdue, ${payload.stats.total} total tasks.` : "Completion, throughput, workload, and project health in one view."}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Board flow</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughput.length ? throughput : [{ day: "Todo", created: 0, done: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))" }} />
                <Area type="monotone" dataKey="created" stroke="#6366f1" fill="#6366f1" fillOpacity={0.12} />
                <Area type="monotone" dataKey="done" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Workload by status</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData.length ? statusData : [{ name: "No tasks", value: 1, color: "#71717a" }]} dataKey="value" innerRadius={58} outerRadius={92} paddingAngle={4}>
                  {(statusData.length ? statusData : [{ name: "No tasks", value: 1, color: "#71717a" }]).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Priority distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ background: "rgb(var(--popover))", border: "1px solid rgb(var(--border))" }} />
                <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

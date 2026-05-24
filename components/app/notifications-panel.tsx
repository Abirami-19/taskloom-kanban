"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { Bell } from "lucide-react";
import type { Notification } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function NotificationsPanel({
  notifications,
  userId,
  workspaceId,
}: {
  notifications: Notification[];
  userId: string;
  workspaceId: string;
}) {
  const [items, setItems] = useState(notifications);
  const unread = items.filter((item) => !item.is_read).length;
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => setItems(notifications), [notifications]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${workspaceId}:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (event) => {
          if (event.eventType === "INSERT") setItems((current) => [event.new as Notification, ...current].slice(0, 20));
          if (event.eventType === "UPDATE") {
            setItems((current) => current.map((item) => (item.id === (event.new as Notification).id ? (event.new as Notification) : item)));
          }
          if (event.eventType === "DELETE") setItems((current) => current.filter((item) => item.id !== (event.old as Notification).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, workspaceId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {unread ? <span className="absolute right-1 top-1 size-2 rounded-full bg-emerald-500" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="z-50 mt-2 w-80 rounded-lg border bg-popover p-2 shadow-xl">
        <div className="px-2 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">Realtime updates from your workspace.</p>
        </div>
        <div className="max-h-96 space-y-1 overflow-auto">
          {items.length ? items.map((item) => (
            <a key={item.id} href={item.href ?? "#"} className="block rounded-md p-3 text-sm hover:bg-secondary">
              <div className="flex items-start gap-2">
                <span className={`mt-1 size-2 rounded-full ${item.is_read ? "bg-border" : "bg-emerald-500"}`} />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            </a>
          )) : <p className="p-3 text-sm text-muted-foreground">No notifications yet.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

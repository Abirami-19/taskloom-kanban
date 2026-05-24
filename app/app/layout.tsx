import { AppShell } from "@/components/app/app-shell";
import { EmptyWorkspace } from "@/components/app/empty-workspace";
import { getAppPayload, requireUser } from "@/lib/data";
import type { Profile } from "@/lib/types";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const payload = await getAppPayload();

  if (!payload) {
    return <EmptyWorkspace />;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return <AppShell payload={payload} user={profile as Profile}>{children}</AppShell>;
}

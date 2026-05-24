import { getAppPayload, requireUser } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { SettingsClient } from "@/components/app/settings-client";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const payload = await getAppPayload();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return <SettingsClient profile={profile as Profile} payload={payload} />;
}

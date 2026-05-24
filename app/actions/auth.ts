"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";

export async function signIn(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid credentials" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/app");
}

export async function signUp(_: unknown, formData: FormData) {
  const parsed = authSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid signup details" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: absoluteUrl("/auth/callback") }
  });
  if (error) return { error: error.message };
  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: absoluteUrl("/auth/callback?next=/app/settings")
  });
  if (error) return { error: error.message };
  return { success: "Password reset link sent." };
}

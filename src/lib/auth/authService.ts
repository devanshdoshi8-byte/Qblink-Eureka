/**
 * Auth abstraction layer.
 *
 * Google sign-in uses real OAuth via Lovable Cloud managed credentials.
 * There is no client-side OTP generation or verification: verification
 * state is only ever read from the auth server, never asserted by the client.
 */
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export type AuthRole = "customer" | "business";

/**
 * Real Google OAuth sign-in. Redirects to Google (or completes in-place in the
 * preview popup flow). The desired role is stashed so the post-login bootstrap
 * can provision role/profile rows once the session exists.
 */
export async function signInWithGoogle(role: AuthRole, redirectPath?: string): Promise<void> {
  try {
    sessionStorage.setItem("qblink.pendingRole", role);
    if (redirectPath) sessionStorage.setItem("qblink.pendingNext", redirectPath);
  } catch { /* storage unavailable */ }

  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });

  if (result.error) throw result.error instanceof Error ? result.error : new Error(String(result.error));
  if (result.redirected) return;

  await ensureRoleAndProfile();
}

/**
 * Idempotently provision the user_roles / customer_profiles rows for the
 * currently signed-in user. Safe to call after any successful sign-in.
 */
export async function ensureRoleAndProfile(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;

  let role: AuthRole = "customer";
  try {
    const stored = sessionStorage.getItem("qblink.pendingRole");
    if (stored === "business" || stored === "customer") role = stored;
  } catch { /* ignore */ }

  const { data: existing } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .limit(1);

  if (!existing || existing.length === 0) {
    await supabase.from("user_roles").insert({ user_id: user.id, role });
    if (role === "customer") {
      await supabase.from("customer_profiles").insert({
        user_id: user.id,
        full_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Customer",
      });
    }
  }
}

/* --------------------- Verification-state helpers ---------------------- */

export interface VerificationStatus {
  signedIn: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  phone: string | null;
  primaryEmail: string | null;
}

/**
 * Read verification flags from the auth server. Only server-confirmed
 * timestamps are trusted — client-set metadata is never treated as proof.
 */
export async function getVerificationStatus(): Promise<VerificationStatus> {
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) {
    return { signedIn: false, phoneVerified: false, emailVerified: false, phone: null, primaryEmail: null };
  }
  return {
    signedIn: true,
    phoneVerified: Boolean(u.phone_confirmed_at),
    emailVerified: Boolean(u.email_confirmed_at),
    phone: u.phone ?? null,
    primaryEmail: u.email ?? null,
  };
}

export async function isPhoneVerified(): Promise<boolean> {
  return (await getVerificationStatus()).phoneVerified;
}

export async function isEmailVerified(): Promise<boolean> {
  return (await getVerificationStatus()).emailVerified;
}

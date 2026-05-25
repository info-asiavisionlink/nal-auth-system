import type { User } from "@supabase/supabase-js";

/** Supabase Auth のメール確認完了済みか */
export function isEmailConfirmed(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

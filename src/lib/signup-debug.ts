import type { AuthError } from "@supabase/supabase-js";

export type SignupDisplayError = {
  title: string;
  cause: string;
  details?: string;
  possibleCauses?: string[];
};

const PROFILE_INSERT_POSSIBLE_CAUSES = [
  "RLSポリシーで弾かれている可能性",
  "profilesテーブルのカラム名がコードと違う可能性",
  "id が auth.users.id と一致していない可能性",
  "email確認設定により session が null の可能性",
];

export function formatAuthErrorDisplay(error: AuthError): SignupDisplayError {
  return {
    title: "登録に失敗しました。",
    cause: error.message,
    details: [
      `status: ${error.status ?? "—"}`,
      `name: ${error.name ?? "—"}`,
    ].join("\n"),
  };
}

export function formatGenericDisplay(
  title: string,
  cause: string,
  details?: string,
  possibleCauses?: string[],
): SignupDisplayError {
  return { title, cause, details, possibleCauses };
}

export { PROFILE_INSERT_POSSIBLE_CAUSES };

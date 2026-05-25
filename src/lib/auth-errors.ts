const LOGIN_INVALID_MESSAGE =
  "メールアドレスまたはパスワードが違います";
const LOGIN_NOT_REGISTERED_MESSAGE =
  "登録されていません。新規登録してください";

export function mapLoginError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("wrong password")
  ) {
    return LOGIN_INVALID_MESSAGE;
  }

  if (lower.includes("user not found")) {
    return LOGIN_NOT_REGISTERED_MESSAGE;
  }

  if (lower.includes("email not confirmed")) {
    return "メール認証が完了していません。受信トレイのリンクから認証してください。";
  }

  return LOGIN_INVALID_MESSAGE;
}

export function mapSignupError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "このメールアドレスは既に登録されています。";
  }

  if (lower.includes("password")) {
    return "パスワードは6文字以上で入力してください。";
  }

  if (lower.includes("valid email")) {
    return "有効なメールアドレスを入力してください。";
  }

  return "登録に失敗しました。入力内容を確認して再度お試しください。";
}

export function validateSignupInput(
  username: string,
  email: string,
  password: string,
): string | null {
  if (!username.trim()) {
    return "ユーザー名は必須です。";
  }
  if (!email.trim()) {
    return "メールアドレスは必須です。";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "有効なメールアドレスを入力してください。";
  }
  if (password.length < 6) {
    return "パスワードは6文字以上で入力してください。";
  }
  return null;
}

export const SESSION_PASSWORD_KEY = "nal_auth_display_password";

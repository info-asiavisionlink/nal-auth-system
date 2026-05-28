import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthLanguageProvider } from "@/components/providers/AuthLanguageProvider";

export default function ForgotPasswordPage() {
  return (
    <AuthLanguageProvider>
      <ForgotPasswordForm />
    </AuthLanguageProvider>
  );
}

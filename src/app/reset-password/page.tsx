import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthLanguageProvider } from "@/components/providers/AuthLanguageProvider";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ResetPasswordPage() {
  return (
    <AuthLanguageProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLanguageProvider>
  );
}

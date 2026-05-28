import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLanguageProvider } from "@/components/providers/AuthLanguageProvider";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LoginPage() {
  return (
    <AuthLanguageProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLanguageProvider>
  );
}

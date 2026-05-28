"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";

type AuthLanguageProviderProps = {
  children: ReactNode;
};

export function AuthLanguageProvider({ children }: AuthLanguageProviderProps) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

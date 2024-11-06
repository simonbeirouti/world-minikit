"use client";

import { useSession } from "next-auth/react";
import { SignIn } from "../SignIn";

interface GateProps {
  children: React.ReactNode;
}

export function Gate({ children }: GateProps) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Welcome to MiAi</h1>
        <p className="text-muted-foreground text-center max-w-md">
          I&apos;m as unique as you are! Signing in will ensure that we stay together.
        </p>
        <SignIn />
      </div>
    );
  }

  return <>{children}</>;
} 
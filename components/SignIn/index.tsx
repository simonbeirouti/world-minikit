// @ts-nocheck
"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";

export const SignIn = () => {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Signed in as {session?.user?.name?.slice(0, 10)}
        </p>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("worldcoin")} size="lg">
      Verify with World ID
    </Button>
  );
};

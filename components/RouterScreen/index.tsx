"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UserProfile {
  name: string;
  preferences: {
    language: string;
    timezone: string;
    topics: string[];
  };
}

type UserStatus = "new" | "returning" | "loading";

export function RouterScreen() {
  const { data: session } = useSession();
  const [userStatus, setUserStatus] = useState<UserStatus>("loading");
  const [setupProgress, setSetupProgress] = useState(0);

  useEffect(() => {
    // Simulate checking user status
    // TODO: Replace with actual API call
    const checkUserStatus = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // TODO: Check if user has completed setup
        setUserStatus("new"); // or "returning" based on API response
      } catch (error) {
        console.error("Error checking user status:", error);
      }
    };

    if (session) {
      checkUserStatus();
    }
  }, [session]);

  if (userStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Progress value={setupProgress} className="w-[60%] max-w-md" />
        <p className="text-muted-foreground">Checking your profile...</p>
      </div>
    );
  }

  if (userStatus === "new") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-4">
        <h1 className="text-4xl font-bold text-center">Welcome to MiAi</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Let's personalize your experience to make our interactions more meaningful.
        </p>
        <Button size="lg" className="mt-4">
          Start Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-4">
      <h1 className="text-4xl font-bold text-center">Welcome Back!</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Ready to continue our conversation?
      </p>
      <div className="flex gap-4">
        <Button variant="outline">View History</Button>
        <Button>Start New Chat</Button>
      </div>
    </div>
  );
} 
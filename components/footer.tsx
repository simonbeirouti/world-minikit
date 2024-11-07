// @ts-nocheck
"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { Lock, Menu } from "lucide-react";

export function Footer() {
  return (
    <footer className="fixed bottom-2 left-0 right-0 bg-background p-4">
      <div className="flex gap-2 items-center mx-auto">
        <Button className="flex-grow">
          <Menu className="mr-2 h-4 w-4" />
          Menu
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => signOut()}
        >
          <Lock className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </footer>
  );
}

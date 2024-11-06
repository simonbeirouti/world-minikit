import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export function useExists() {
  const { status, data: session } = useSession();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkUserExists() {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const response = await fetch(`/api/user/exists?worldIdHash=${session.user.email}`);
          const data = await response.json();
          
          if (!data.exists) {
            await signOut();
          }
        } catch (error) {
          console.error("Error checking user existence:", error);
          await signOut();
        }
      }
      setIsChecking(false);
    }

    checkUserExists();
  }, [status, session?.user?.email]);

  return { isChecking, status };
}
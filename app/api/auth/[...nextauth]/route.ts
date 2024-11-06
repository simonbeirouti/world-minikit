import NextAuth, { NextAuthOptions } from "next-auth";
import { createOrUpdateUser, createUserSession } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    {
      id: "worldcoin",
      name: "Worldcoin",
      type: "oauth",
      wellKnown: "https://id.worldcoin.org/.well-known/openid-configuration",
      authorization: { params: { scope: "openid" } },
      clientId: process.env.WLD_CLIENT_ID,
      clientSecret: process.env.WLD_CLIENT_SECRET,
      idToken: true,
      checks: ["state", "nonce", "pkce"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.sub,
          verificationLevel: profile["https://id.worldcoin.org/v1"].verification_level,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ user, profile, account }: any) {
      try {
        const worldcoinData = {
          sub: profile.sub,
          verification_level: profile["https://id.worldcoin.org/v1"].verification_level,
        };
        
        const dbUser = await createOrUpdateUser(worldcoinData);

        // Create a session record
        await createUserSession({
          userId: dbUser.id,
          worldIdHash: profile.sub,
          sessionToken: account.access_token,
          expiresAt: new Date(account.expires_at * 1000), // Convert to milliseconds
        });

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

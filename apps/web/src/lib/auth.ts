import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users, accounts, sessions, verificationTokens } from "@jobboard/db";
import { eq } from "drizzle-orm";
import type { UserRole } from "@jobboard/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],

  session: {
    strategy: "database",
  },

  callbacks: {
    /**
     * Runs after sign-in / session fetch.
     * We pull `id` and `role` from DB and attach them to the session
     * so every server component can access them without extra queries.
     */
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user.role as UserRole) ?? "CANDIDATE";
      }
      return session;
    },
  },

  events: {
    /**
     * Runs the first time a user signs in via OAuth.
     * We default role to CANDIDATE — employers must explicitly
     * choose their role during onboarding.
     */
    async createUser({ user }) {
      await db
        .update(users)
        .set({ role: "CANDIDATE" })
        .where(eq(users.id, user.id));
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/onboarding",
  },
});

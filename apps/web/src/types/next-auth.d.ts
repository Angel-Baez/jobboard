import type { UserRole } from "@jobboard/types";
import type { DefaultSession } from "next-auth";

/**
 * Extending the built-in session/user types to include our custom fields.
 * Without this, session.user.role and session.user.id would be unknown.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

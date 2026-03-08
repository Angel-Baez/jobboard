import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";
import { timestamps } from "./_shared";

// ── Auth.js v5 required tables ────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique().notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    role: userRoleEnum("role").default("CANDIDATE").notNull(),
    phone: varchar("phone", { length: 20 }),
    bio: text("bio"),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_role_idx").on(t.role),
  ]
);

export const accounts = pgTable("accounts", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

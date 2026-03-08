import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { users } from "./users";

export const companies = pgTable(
  "companies",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    description: text("description"),
    website: varchar("website", { length: 500 }),
    location: varchar("location", { length: 255 }),
    size: varchar("size", { length: 50 }),
    industry: varchar("industry", { length: 100 }),
    logoFileId: integer("logo_file_id"),
    isVerified: boolean("is_verified").default(false).notNull(),
    ...timestamps,
  },
  (t) => [
    index("companies_owner_idx").on(t.ownerId),
    index("companies_slug_idx").on(t.slug),
  ]
);

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

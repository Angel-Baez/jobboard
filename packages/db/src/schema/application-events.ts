import {
    index,
    integer,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { applications } from "./applications";
import { applicationStatusEnum } from "./enums";
import { users } from "./users";

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    applicationId: integer("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    fromStatus: applicationStatusEnum("from_status"),
    toStatus: applicationStatusEnum("to_status").notNull(),
    changedBy: text("changed_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("app_status_history_application_idx").on(t.applicationId),
  ]
);

export type ApplicationStatusEvent = typeof applicationStatusHistory.$inferSelect;
export type NewApplicationStatusEvent = typeof applicationStatusHistory.$inferInsert;

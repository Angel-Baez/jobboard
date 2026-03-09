import {
    index,
    integer,
    pgTable,
    text,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { applicationStatusEnum } from "./enums";
import { files } from "./files";
import { jobs } from "./jobs";
import { users } from "./users";

export const applications = pgTable(
  "applications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resumeFileId: integer("resume_file_id").references(() => files.id, {
      onDelete: "set null",
    }),
    status: applicationStatusEnum("status").default("PENDING").notNull(),
    coverLetter: text("cover_letter"),
    employerNotes: text("employer_notes"),
    statusChangedAt: timestamp("status_changed_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
    autoExpireAt: timestamp("auto_expire_at", {
      mode: "date",
      withTimezone: true,
    }),
    ...timestamps,
  },
  (t) => [
    unique("applications_job_candidate_unique").on(t.jobId, t.candidateId),
    index("applications_job_idx").on(t.jobId),
    index("applications_candidate_idx").on(t.candidateId),
    index("applications_status_idx").on(t.status),
    index("applications_job_status_idx").on(t.jobId, t.status),
    index("applications_auto_expire_idx").on(t.autoExpireAt),
  ]
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

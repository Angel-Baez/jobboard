import {
    index,
    integer,
    pgTable,
    primaryKey,
    varchar,
} from "drizzle-orm/pg-core";
import { jobs } from "./jobs";

export const tags = pgTable(
  "tags",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 50 }).unique().notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
  },
  (t) => [
    index("tags_name_idx").on(t.name),
  ]
);

export const jobTags = pgTable(
  "job_tags",
  {
    jobId: integer("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.jobId, t.tagId] }),
    index("job_tags_job_idx").on(t.jobId),
    index("job_tags_tag_idx").on(t.tagId),
  ]
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type JobTag = typeof jobTags.$inferSelect;
export type NewJobTag = typeof jobTags.$inferInsert;

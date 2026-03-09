import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { companies } from "./companies";
import { employmentTypeEnum, jobStatusEnum, workModeEnum } from "./enums";

export const jobs = pgTable(
  "jobs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    description: text("description").notNull(),
    requirements: text("requirements"),
    benefits: text("benefits"),
    location: varchar("location", { length: 255 }),
    employmentType: employmentTypeEnum("employment_type")
      .default("FULL_TIME")
      .notNull(),
    workMode: workModeEnum("work_mode").default("ONSITE").notNull(),
    status: jobStatusEnum("status").default("DRAFT").notNull(),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: varchar("salary_currency", { length: 3 }).default("USD"),
    publishedAt: timestamp("published_at", { mode: "date", withTimezone: true }),
    expiresAt: timestamp("expires_at", { mode: "date", withTimezone: true }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    applicationCount: integer("application_count").default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    index("jobs_company_idx").on(t.companyId),
    index("jobs_status_idx").on(t.status),
    index("jobs_slug_idx").on(t.slug),
    index("jobs_work_mode_idx").on(t.workMode),
    index("jobs_employment_type_idx").on(t.employmentType),
    index("jobs_expires_at_idx").on(t.expiresAt),
    index("jobs_published_at_idx").on(t.publishedAt),
    index("jobs_company_status_idx").on(t.companyId, t.status),
  ]
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

import { relations } from "drizzle-orm";
import { users, accounts, sessions } from "./users";
import { companies } from "./companies";
import { jobs } from "./jobs";
import { applications } from "./applications";
import { files } from "./files";

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.ownerId],
  }),
  applications: many(applications),
  files: many(files),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, {
    fields: [companies.ownerId],
    references: [users.id],
  }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(users, {
    fields: [applications.candidateId],
    references: [users.id],
  }),
  resume: one(files, {
    fields: [applications.resumeFileId],
    references: [files.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [files.uploadedById],
    references: [users.id],
  }),
}));

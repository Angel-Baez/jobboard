import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "CANDIDATE",
  "EMPLOYER",
  "ADMIN",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "DRAFT",
  "ACTIVE",
  "EXPIRED",
  "FILLED",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "PENDING",
  "REVIEWING",
  "SHORTLISTED",
  "REJECTED",
  "HIRED",
]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "INTERNSHIP",
]);

export const workModeEnum = pgEnum("work_mode", [
  "REMOTE",
  "ONSITE",
  "HYBRID",
]);

export const fileTypeEnum = pgEnum("file_type", [
  "RESUME",
  "COMPANY_LOGO",
  "COVER_LETTER",
]);

export type UserRole = "EMPLOYER" | "CANDIDATE" | "ADMIN";

export type JobStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "FILLED";

export type ApplicationStatus =
  | "PENDING"
  | "REVIEWING"
  | "SHORTLISTED"
  | "REJECTED"
  | "HIRED";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "FREELANCE"
  | "INTERNSHIP";

export type WorkMode = "REMOTE" | "ONSITE" | "HYBRID";

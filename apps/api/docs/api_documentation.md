# Job Board API Documentation

This document provides a comprehensive overview of the Job Board API, including REST endpoints, GraphQL schema, authentication mechanisms, and infrastructure details.

## Overview
- **Base URL**: `http://localhost:4000`
- **GraphQL Endpoint**: `http://localhost:4000/graphql`
- **Inngest Webhook**: `http://localhost:4000/api/inngest`

## Authentication & Security

### Guards
- **SessionGuard**: Runs globally. It identifies the user via:
  1. `Authorization: Bearer <token>` header (Fallback for API clients).
  2. `next-auth.session-token` or `__Secure-next-auth.session-token` cookies (Primary for Auth.js/Next.js).
- **RolesGuard**: Enforces role-based access control when the `@Roles()` decorator is present on a route or controller.
  - **Roles**: `ADMIN`, `EMPLOYER`, `CANDIDATE`.
  - **Bypass**: Users with the `ADMIN` role bypass all role checks.

### Public Routes
Routes decorated with `@Public()` bypass `SessionGuard` and are accessible without a session.

---

## REST Endpoints

### Jobs
| Method | Path | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/jobs` | Public | List jobs with filters (`JobFiltersDto`). |
| `GET` | `/jobs/:slug` | Public | Get a single job by its slug. |
| `POST` | `/jobs` | `EMPLOYER` | Create a new job draft. |
| `PATCH` | `/jobs/:id` | `EMPLOYER` | Update an existing job. |
| `POST` | `/jobs/:id/publish` | `EMPLOYER` | Set job status to `ACTIVE`. |
| `POST` | `/jobs/:id/unpublish` | `EMPLOYER` | Set job status to `DRAFT`. |
| `DELETE` | `/jobs/:id` | `EMPLOYER` | Remove a job. |

### Companies
| Method | Path | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/companies` | Public | List all companies or search by name. |
| `GET` | `/companies/:slug` | Public | Get company details by slug. |
| `GET` | `/companies/me` | `EMPLOYER` | Get the authenticated employer's company. |
| `POST` | `/companies` | `EMPLOYER` | Create a company profile. |
| `PATCH` | `/companies/:id` | `EMPLOYER` | Update company profile. |
| `POST` | `/companies/:id/verify` | `ADMIN` | Verify a company. |

### Applications
| Method | Path | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/applications/my` | `CANDIDATE` | List authenticated candidate's applications. |
| `POST` | `/applications` | `CANDIDATE` | Submit a job application. |
| `DELETE` | `/applications/:id` | `CANDIDATE` | Withdraw a job application. |
| `GET` | `/applications/job/:jobId` | `EMPLOYER` | List applications for a specific job. |
| `PATCH` | `/applications/:id/status` | `EMPLOYER` | Update application status (`UpdateStatusDto`). |

### Users
| Method | Path | Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Auth | Get current user's profile. |
| `PATCH` | `/users/me` | Auth | Update current user's profile. |
| `POST` | `/users/me/role` | Auth | Choice of initial role (`CANDIDATE` or `EMPLOYER`). |
| `GET` | `/users/stats` | `ADMIN` | Get global system statistics. |
| `POST` | `/users/:id/deactivate` | `ADMIN` | Disable a user account. |
| `POST` | `/users/:id/reactivate` | `ADMIN` | Re-enable a user account. |

### Files (S3/Spaces Uploads)
| Method | Path | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/files/presign` | Auth | Request a presigned URL to upload directly to S3/DO Spaces. |
| `POST` | `/files/confirm` | Auth | Register a file in the DB after its upload succeeds. |
| `GET` | `/files/my` | Auth | List user's uploaded files. |
| `DELETE` | `/files/:id` | Auth | Delete a file from storage and database. |

---

## GraphQL API

The GraphQL API provides similar functionality to the REST API but tailored for more flexible frontend consumption.

### Queries Example
```graphql
query GetJobs {
  jobs(filters: { status: "ACTIVE" }) {
    data {
      id
      title
      slug
    }
    total
  }
}

query GetProfile {
  profile {
    name
    email
    role
  }
}
```

### Mutations Example
```graphql
mutation CreateJob($input: CreateJobDto!) {
  createJob(input: $input) {
    id
    slug
  }
}
```

---

## Request & Response Examples

### Creating a Job (POST `/jobs`)
**Request Body:**
```json
{
  "title": "Senior Full Stack Engineer",
  "description": "We are looking for a senior engineer to join our core team...",
  "requirements": "5+ years of experience with React, NestJS, and PostgreSQL.",
  "benefits": "Remote-first culture, health insurance, and competitive salary.",
  "location": "Madrid, Spain",
  "employmentType": "FULL_TIME",
  "workMode": "HYBRID",
  "salaryMin": 60000,
  "salaryMax": 90000,
  "salaryCurrency": "EUR",
  "tags": ["typescript", "react", "nestjs"]
}
```

### Submitting an Application (POST `/applications`)
**Request Body:**
```json
{
  "jobId": 42,
  "coverLetter": "I am very excited about this opportunity because...",
  "resumeFileId": 123
}
```

### Creating a Company (POST `/companies`)
**Request Body:**
```json
{
  "name": "Acme Corp",
  "description": "Building the future of gadgets.",
  "website": "https://acme.example.com",
  "location": "San Francisco, CA",
  "size": "51-200",
  "industry": "Technology"
}
```

---

## Database Schema

The system uses PostgreSQL with Drizzle ORM.

### Tables

#### `users`
- `id`: `text` (UUID, Primary Key)
- `name`: `text`
- `email`: `text` (Unique, Not Null)
- `role`: `enum` (`CANDIDATE`, `EMPLOYER`, `ADMIN`) - Default: `CANDIDATE`
- `phone`: `varchar(20)`
- `bio`: `text`
- `isActive`: `boolean` - Default: `true`
- `createdAt`, `updatedAt`: Timestamps

#### `companies`
- `id`: `integer` (Primary Key, Identity)
- `ownerId`: `text` (FK -> `users.id`)
- `name`: `varchar(255)`
- `slug`: `varchar(255)` (Unique)
- `description`: `text`
- `website`: `varchar(500)`
- `location`: `varchar(255)`
- `size`: `varchar(50)` (`1-10`, `11-50`, etc.)
- `industry`: `varchar(100)`
- `isVerified`: `boolean` - Default: `false`

#### `jobs`
- `id`: `integer` (Primary Key, Identity)
- `companyId`: `integer` (FK -> `companies.id`)
- `title`: `varchar(255)`
- `slug`: `varchar(255)` (Unique)
- `description`: `text`
- `requirements`: `text`
- `benefits`: `text`
- `employmentType`: `enum` (`FULL_TIME`, `PART_TIME`, etc.)
- `workMode`: `enum` (`REMOTE`, `ONSITE`, `HYBRID`)
- `status`: `enum` (`DRAFT`, `ACTIVE`, `EXPIRED`, `FILLED`)
- `salaryMin`, `salaryMax`: `integer`
- `salaryCurrency`: `varchar(3)` - Default: `USD`
- `tags`: `varchar(50)[]` (Array)
- `publishedAt`, `expiresAt`: Timestamps

#### `applications`
- `id`: `integer` (Primary Key, Identity)
- `jobId`: `integer` (FK -> `jobs.id`)
- `candidateId`: `text` (FK -> `users.id`)
- `resumeFileId`: `integer` (FK -> `files.id`)
- `status`: `enum` (`PENDING`, `REVIEWING`, `SHORTLISTED`, `REJECTED`, `ACCEPTED`, `WITHDRAWN`)
- `coverLetter`: `text`
- `employerNotes`: `text`

---

## Background Jobs (Inngest)

The API serves as an Inngest worker hub at `/api/inngest`.

### Handled Events
- `onApplicationSubmitted`: Triggers notifications or emails when a new application is received.
- `onApplicationStatusChanged`: Notifies candidates when their application status is updated.
- `jobExpiringSoon`: Background check for jobs near expiration.
- `jobExpired`: Cleanup or notification when a job expires.

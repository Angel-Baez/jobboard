import { requireRole } from "@/lib/auth-helpers";

export default async function EmployerJobsPage() {
  // Redirects to /unauthorized if role !== EMPLOYER | ADMIN
  const user = await requireRole("EMPLOYER");

  return (
    <div>
      <h1>My Job Listings</h1>
      <p>Employer: {user.email}</p>
      {/* Job listings will go here */}
    </div>
  );
}

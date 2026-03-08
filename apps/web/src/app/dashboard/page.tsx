import { requireAuth } from "@/lib/auth-helpers";

// This page is already protected by middleware,
// but requireAuth() gives us the typed user object
export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.name}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // Get session server-side
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to login if no session
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role == "admin") redirect("/admin/dashboard");

  return <DashboardShell user={session.user} />;
}

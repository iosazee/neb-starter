import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/admin-sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Check authentication and admin status on the server
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect non-admin users to login
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-900">
      {/* Pass session data to client component */}
      <AdminSidebar user={session.user} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-auto pb-10">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

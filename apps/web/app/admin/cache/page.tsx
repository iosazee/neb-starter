import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import CacheDashboard from "@/components/admin/cache-dashboard";
import { CacheDashboardSkeleton } from "@/components/general/cache-dashboard-skeleton";

// Force dynamic rendering to ensure fresh data
export const dynamic = "force-dynamic";

export default async function CacheMonitorPage() {
  // Verify user is authenticated and admin
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Access check - redirect if not admin
  if (!session?.user || session.user.role !== "admin") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<CacheDashboardSkeleton />}>
        <CacheDashboard />
      </Suspense>
    </div>
  );
}

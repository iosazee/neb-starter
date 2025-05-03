/**
 * app/api/cache/metrics/route.ts
 *
 * API endpoint for fetching cache metrics
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CacheMetricsService } from "@/lib/cache-metrics";

export const dynamic = "force-dynamic"; // Ensure fresh data on each request

export async function GET(request: NextRequest) {
  try {
    // Verify admin status
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";

    // Handle different metric types
    let data;

    switch (type) {
      case "memory":
        data = CacheMetricsService.getMemoryMetrics();
        break;
      case "database":
        data = await CacheMetricsService.getDatabaseMetrics();
        break;
      case "sessions":
        data = await CacheMetricsService.getSessionMetrics();
        break;
      case "all":
      default:
        data = await CacheMetricsService.getHealthMetrics();
        break;
    }

    return NextResponse.json({
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching cache metrics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch cache metrics",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

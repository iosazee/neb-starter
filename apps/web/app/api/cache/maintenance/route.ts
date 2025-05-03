/**
 * app/api/cache/maintenance/route.ts
 *
 * API endpoint for performing cache maintenance operations
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CacheMetricsService } from "@/lib/cache-metrics";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify admin status
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get maintenance options from request body
    const body = await request.json();
    const options = body.options || {};

    // Perform maintenance
    const result = await CacheMetricsService.performMaintenance(options);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error performing cache maintenance:", error);
    return NextResponse.json(
      {
        error: "Failed to perform maintenance",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

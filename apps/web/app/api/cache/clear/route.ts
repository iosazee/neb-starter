/**
 * app/api/cache/clear/route.ts
 *
 * API endpoint for clearing cache entries by prefix
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CacheMetricsService } from "@/lib/cache-metrics";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin status
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get options from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get("prefix");

    if (!prefix && prefix !== "") {
      return NextResponse.json({ error: "Prefix parameter is required" }, { status: 400 });
    }

    // Clear cache by prefix
    const result = await CacheMetricsService.clearByPrefix(prefix);

    return NextResponse.json({
      success: true,
      memoryEntriesRemoved: result.memoryEntriesRemoved,
      databaseEntriesRemoved: result.databaseEntriesRemoved,
      totalRemoved: result.memoryEntriesRemoved + result.databaseEntriesRemoved,
    });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      {
        error: "Failed to clear cache",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

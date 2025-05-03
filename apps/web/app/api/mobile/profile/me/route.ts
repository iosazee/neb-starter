import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "database";
import cache from "@/lib/cache-singleton";

/**
 * Interface for user profile data
 */
interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * ProfileCacheService - Handles caching for user profile data
 */
class ProfileCacheService {
  private static readonly CACHE_PREFIX = "user_profile:";

  // Regular environment settings
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly STALE_TTL = 30 * 60 * 1000; // 30 minutes

  // Serverless environment settings (shorter)
  private static readonly SERVERLESS_CACHE_TTL = 60 * 1000; // 1 minute
  private static readonly SERVERLESS_STALE_TTL = 2 * 60 * 1000; // 2 minutes

  // Role request cache for memoization within a single serverless request
  private static profileRequestCache: Map<string, UserProfile | null> = new Map();

  /**
   * Generate a consistent cache key for a user's profile
   */
  private static generateKey(userId: string): string {
    return `${this.CACHE_PREFIX}${userId}`;
  }

  /**
   * Check if we're running in a serverless environment
   */
  private static isServerlessEnvironment(): boolean {
    return cache.isServerlessMode();
  }

  /**
   * Initialize or reset the profile request cache
   * Should be called at the beginning of each serverless request
   */
  public static initializeRequestCache(): void {
    this.profileRequestCache.clear();
  }

  /**
   * Get appropriate TTL based on environment
   */
  private static getTTL(): number {
    return this.isServerlessEnvironment() ? this.SERVERLESS_CACHE_TTL : this.CACHE_TTL;
  }

  /**
   * Get appropriate stale TTL based on environment
   */
  private static getStaleTTL(): number {
    return this.isServerlessEnvironment() ? this.SERVERLESS_STALE_TTL : this.STALE_TTL;
  }

  /**
   * Get a user's profile with optimized caching
   * Features:
   * - Request-scoped memoization for serverless
   * - In-memory caching with TTL
   * - Stale-while-revalidate pattern
   * - Graceful degradation to default values
   */
  public static async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;

    // In serverless, check request-local cache first (fastest)
    if (this.isServerlessEnvironment()) {
      const cachedProfile = this.profileRequestCache.get(userId);
      if (cachedProfile !== undefined) {
        return cachedProfile;
      }
    }

    const cacheKey = this.generateKey(userId);

    // Try to get from cache with stale fallback
    const cachedProfile = cache.get<UserProfile | null>(cacheKey, {
      allowStale: true,
      maxStaleAgeMs: this.getStaleTTL(),
    });

    if (cachedProfile !== undefined) {
      // In serverless, add to request-local cache
      if (this.isServerlessEnvironment()) {
        this.profileRequestCache.set(userId, cachedProfile);
      }
      return cachedProfile;
    }

    try {
      // Start timing DB query for monitoring
      const dbStart = performance.now();

      // Get profile from database
      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      const dbDuration = (performance.now() - dbStart).toFixed(2);
      const profile = dbUser || null;

      // Store in cache with priority
      cache.set(cacheKey, profile, this.getTTL(), { priority: 8 });

      // In serverless, also store in request-local cache
      if (this.isServerlessEnvironment()) {
        this.profileRequestCache.set(userId, profile);
      }

      if (process.env.NODE_ENV === "development") {
        console.info(`💾 Cached profile for user: ${userId}`, {
          dbTime: `${dbDuration}ms`,
          inServerless: this.isServerlessEnvironment(),
          requestId: cache.getRequestId(),
        });
      }

      return profile;
    } catch (error) {
      console.error("Error fetching user profile:", error);

      // Check if we have a stale version that's still usable in emergency
      const staleProfile = cache.get<UserProfile | null>(cacheKey, {
        allowStale: true,
        maxStaleAgeMs: 24 * 60 * 60 * 1000, // Allow up to 1 day stale in emergency
      });

      // In serverless, cache the fallback result
      if (this.isServerlessEnvironment()) {
        const fallbackProfile = staleProfile || null;
        this.profileRequestCache.set(userId, fallbackProfile);
      }

      return staleProfile || null;
    }
  }

  /**
   * Memoized version of getUserProfile specifically optimized for serverless
   */
  public static memoizedGetUserProfile = cache.memoize(
    async (userId: string): Promise<UserProfile | null> => {
      if (!userId) return null;

      try {
        // Get profile from database
        const dbUser = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        return dbUser || null;
      } catch (error) {
        console.error("Error in memoized user profile fetch:", error);
        return null;
      }
    },
    {
      keyPrefix: "memo:profile:",
      ttl: 60 * 1000, // 1 minute memoization
      priority: 8,
    }
  );

  /**
   * Invalidate a specific user's profile in cache
   */
  public static invalidateUserProfile(userId: string): void {
    const cacheKey = this.generateKey(userId);
    cache.del(cacheKey);

    // Also remove from request cache if in serverless
    if (this.isServerlessEnvironment()) {
      this.profileRequestCache.delete(userId);
    }
  }
}

export async function GET() {
  try {
    // Get the user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use different strategies based on environment
    let profile: UserProfile | null;

    if (cache.isServerlessMode()) {
      // In serverless, use the memoized function
      profile = await ProfileCacheService.memoizedGetUserProfile(session.user.id);
    } else {
      // In regular environment, use the main function
      profile = await ProfileCacheService.getUserProfile(session.user.id);
    }

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error in user profile endpoint:", error);

    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

import cache from "./cache-singleton";
import { db } from "database";

/**
 * Enhanced UserRoleService with optimized caching and resilience features
 * Provides role information for users with high performance and fault tolerance
 */
export class UserRoleService {
  private static readonly CACHE_PREFIX = "user_role:";

  // Regular environment settings
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly STALE_TTL = 30 * 60 * 1000; // 30 minutes

  // Serverless environment settings (shorter)
  private static readonly SERVERLESS_CACHE_TTL = 60 * 1000; // 1 minute
  private static readonly SERVERLESS_STALE_TTL = 2 * 60 * 1000; // 2 minutes

  private static readonly CIRCUIT_OPEN_TIME = 30 * 1000; // 30 seconds
  private static readonly BATCH_SIZE = 50; // Maximum batch size for preloading

  // Role request cache for memoization within a single serverless request
  private static roleRequestCache: Map<string, string> = new Map();

  // Track error state for circuit breaking
  private static errorCount = 0;
  private static lastError = 0;

  /**
   * Generate a consistent cache key for a user's role
   * @param userId The user ID
   * @returns The cache key
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
   * Initialize or reset the role request cache
   * Should be called at the beginning of each serverless request
   */
  public static initializeRequestCache(): void {
    this.roleRequestCache.clear();

    if (this.isServerlessEnvironment() && process.env.NODE_ENV === "development") {
      console.info("💾 UserRoleService: Request cache initialized");
    }
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
   * Get a user's role with optimized caching
   * Features:
   * - Request-scoped memoization for serverless
   * - In-memory caching with TTL
   * - Stale-while-revalidate pattern
   * - Circuit breaker for database failures
   * - Graceful degradation to default values
   *
   * @param userId The user ID
   * @returns The user's role
   */
  public static async getUserRole(userId: string): Promise<string> {
    if (!userId) return "user";

    // In serverless, check request-local cache first (fastest)
    if (this.isServerlessEnvironment()) {
      const cachedRole = this.roleRequestCache.get(userId);
      if (cachedRole !== undefined) {
        return cachedRole;
      }
    }

    const cacheKey = this.generateKey(userId);

    // Try to get from cache with stale fallback
    const cachedResult = cache.get<string>(cacheKey, {
      allowStale: true,
      maxStaleAgeMs: this.getStaleTTL(),
    });

    if (cachedResult !== undefined) {
      // In serverless, add to request-local cache
      if (this.isServerlessEnvironment()) {
        this.roleRequestCache.set(userId, cachedResult);
      }
      return cachedResult;
    }

    try {
      // Start timing DB query for monitoring
      const dbStart = performance.now();

      // Get role from database
      const dbUser = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const dbDuration = (performance.now() - dbStart).toFixed(2);
      const role = dbUser?.role || "user";

      // Store in cache with priority
      cache.set(cacheKey, role, this.getTTL(), { priority: 8 });

      // In serverless, also store in request-local cache
      if (this.isServerlessEnvironment()) {
        this.roleRequestCache.set(userId, role);
      }

      // Reset error count on success
      this.errorCount = 0;

      if (process.env.NODE_ENV === "development") {
        console.info(`💾 Cached role for user: ${userId}`, {
          role,
          dbTime: `${dbDuration}ms`,
          inServerless: this.isServerlessEnvironment(),
          requestId: cache.getRequestId(),
        });
      }

      return role;
    } catch (error) {
      // Increment error count and maybe trigger circuit breaker
      this.errorCount++;
      this.lastError = Date.now();

      if (this.errorCount >= 5) {
        cache.openCircuit("user_role:", this.CIRCUIT_OPEN_TIME);
        console.error(`Circuit breaker triggered for user roles after ${this.errorCount} errors`);
        this.errorCount = 0;
      }

      console.error("Error fetching user role:", error);

      // Check if we have a stale version that's still usable in emergency
      const staleRole = cache.get<string>(cacheKey, {
        allowStale: true,
        maxStaleAgeMs: 24 * 60 * 60 * 1000, // Allow up to 1 day stale in emergency
      });

      // In serverless, cache the fallback result
      if (this.isServerlessEnvironment()) {
        const fallbackRole = staleRole || "user";
        this.roleRequestCache.set(userId, fallbackRole);
      }

      return staleRole || "user"; // Default role on error
    }
  }

  /**
   * Get roles for multiple users at once
   * Optimized for batch operations with parallel processing
   *
   * @param userIds Array of user IDs
   * @returns Map of user ID to role
   */
  public static async getUserRoles(userIds: string[]): Promise<Map<string, string>> {
    if (!userIds.length) return new Map();

    const uniqueIds = [...new Set(userIds)];
    const result = new Map<string, string>();
    const missingIds: string[] = [];

    // First check request cache if in serverless environment
    if (this.isServerlessEnvironment()) {
      for (const userId of uniqueIds) {
        const cachedRole = this.roleRequestCache.get(userId);
        if (cachedRole !== undefined) {
          result.set(userId, cachedRole);
        } else {
          missingIds.push(userId);
        }
      }
    } else {
      missingIds.push(...uniqueIds);
    }

    // If all IDs were in the request cache, return early
    if (!missingIds.length) return result;

    // Check regular cache for remaining IDs
    for (const userId of missingIds) {
      const cacheKey = this.generateKey(userId);
      const cachedRole = cache.get<string>(cacheKey, {
        allowStale: true,
        maxStaleAgeMs: this.getStaleTTL(),
      });

      if (cachedRole !== undefined) {
        result.set(userId, cachedRole);

        // Add to request cache in serverless
        if (this.isServerlessEnvironment()) {
          this.roleRequestCache.set(userId, cachedRole);
        }
      }
    }

    // Get IDs still missing from cache
    const uncachedIds = missingIds.filter((id) => !result.has(id));

    if (uncachedIds.length) {
      try {
        // Batch query to database for all missing roles
        const dbUsers = await db.user.findMany({
          where: { id: { in: uncachedIds } },
          select: { id: true, role: true },
        });

        // Process results
        for (const user of dbUsers) {
          const role = user.role || "user";
          result.set(user.id, role);

          // Cache the results
          const cacheKey = this.generateKey(user.id);
          cache.set(cacheKey, role, this.getTTL(), { priority: 8 });

          // Add to request cache in serverless
          if (this.isServerlessEnvironment()) {
            this.roleRequestCache.set(user.id, role);
          }
        }

        // For any IDs that weren't found, set default role
        for (const userId of uncachedIds) {
          if (!result.has(userId)) {
            result.set(userId, "user");

            // Cache the default role
            const cacheKey = this.generateKey(userId);
            cache.set(cacheKey, "user", this.getTTL(), { priority: 8 });

            // Add to request cache in serverless
            if (this.isServerlessEnvironment()) {
              this.roleRequestCache.set(userId, "user");
            }
          }
        }
      } catch (error) {
        console.error("Error batch fetching user roles:", error);

        // Use default role for all uncached IDs
        for (const userId of uncachedIds) {
          if (!result.has(userId)) {
            result.set(userId, "user");

            // Add to request cache in serverless
            if (this.isServerlessEnvironment()) {
              this.roleRequestCache.set(userId, "user");
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Memoized version of getUserRole specifically optimized for serverless
   * Re-uses the same function signature but with in-request caching
   *
   * @param userId The user ID
   * @returns The user's role
   */
  public static memoizedGetUserRole = cache.memoize(
    async (userId: string): Promise<string> => {
      if (!userId) return "user";

      try {
        // Get role from database
        const dbUser = await db.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        return dbUser?.role || "user";
      } catch (error) {
        console.error("Error in memoized user role fetch:", error);
        return "user"; // Default role on error
      }
    },
    {
      keyPrefix: "memo:role:",
      ttl: 60 * 1000, // 1 minute memoization
      priority: 8,
    }
  );

  /**
   * Invalidate a specific user's role in cache
   * @param userId The user ID to invalidate
   */
  public static invalidateUserRole(userId: string): void {
    const cacheKey = this.generateKey(userId);
    cache.del(cacheKey);

    // Also remove from request cache if in serverless
    if (this.isServerlessEnvironment()) {
      this.roleRequestCache.delete(userId);
    }
  }

  /**
   * Invalidate all cached user roles
   * @returns Number of entries removed
   */
  public static invalidateAllRoles(): void {
    const deletedCount = cache.deleteByPrefix(this.CACHE_PREFIX);

    // Also clear request cache if in serverless
    if (this.isServerlessEnvironment()) {
      this.roleRequestCache.clear();
    }

    if (process.env.NODE_ENV === "development") {
      console.info(`Cleared ${deletedCount} user role cache entries`);
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public static getCacheStats() {
    const stats = cache.getStats();
    const requestCacheSize = this.roleRequestCache.size;

    if (process.env.NODE_ENV === "development" && this.isServerlessEnvironment()) {
      console.info("Role request cache stats:", {
        size: requestCacheSize,
        entries: [...this.roleRequestCache.entries()].map(([id, role]) => ({ id, role })),
      });
    }

    return {
      ...stats,
      requestCacheSize,
    };
  }

  /**
   * Preload roles for a list of users
   * This optimizes performance for bulk operations by batching database queries
   *
   * @param userIds List of user IDs to preload
   */
  public static async preloadRoles(userIds: string[]): Promise<void> {
    if (!userIds.length) return;

    try {
      // Skip in serverless unless we're preloading for the current request
      if (this.isServerlessEnvironment()) {
        // In serverless we use the memoization pattern instead of preloading
        await this.getUserRoles(userIds);
        return;
      }

      // Regular environment preloading
      // Split into batches to avoid excessive database load
      for (let i = 0; i < userIds.length; i += this.BATCH_SIZE) {
        const batchIds = userIds.slice(i, i + this.BATCH_SIZE);

        // Batch query to get all roles at once
        const users = await db.user.findMany({
          where: { id: { in: batchIds } },
          select: { id: true, role: true },
        });

        // Cache all results
        for (const user of users) {
          const cacheKey = this.generateKey(user.id);
          cache.set(cacheKey, user.role || "user", this.getTTL(), { priority: 8 });
        }

        if (process.env.NODE_ENV === "development") {
          console.info(`Preloaded ${users.length} user roles (batch ${i / this.BATCH_SIZE + 1})`);
        }
      }
    } catch (error) {
      console.error("Error preloading user roles:", error);
    }
  }

  /**
   * Check health of the role service
   * @returns Health status and metrics
   */
  public static checkHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    lastError: number;
    errorCount: number;
    cacheSizeRoles: number;
    requestCacheSize?: number;
  } {
    const stats = cache.getStats();
    const roleCacheSize = stats.byKeyTypeCount["user_role"] || 0;

    // Determine health status
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (this.errorCount > 0) {
      status = "degraded";
    }

    if (this.errorCount > 3) {
      status = "unhealthy";
    }

    const health = {
      status,
      lastError: this.lastError,
      errorCount: this.errorCount,
      cacheSizeRoles: roleCacheSize,
    };

    // Add request cache info if in serverless
    if (this.isServerlessEnvironment()) {
      return {
        ...health,
        requestCacheSize: this.roleRequestCache.size,
      };
    }

    return health;
  }

  /**
   * Get the most frequently accessed user roles
   * This can be used for analytics and optimization
   *
   * @param limit Maximum number of entries to return
   * @returns Array of hot user roles
   */
  public static getHotUsers(limit: number = 10): string[] {
    const hotKeys = cache.getHotKeys(limit * 2);
    return hotKeys
      .filter(
        (item) =>
          item.key.startsWith(this.CACHE_PREFIX) || item.key.includes(`:${this.CACHE_PREFIX}`)
      )
      .slice(0, limit)
      .map((item) => {
        // Handle both regular and request-scoped keys
        const key = item.key;
        if (key.startsWith(this.CACHE_PREFIX)) {
          return key.replace(this.CACHE_PREFIX, "");
        } else {
          // Extract user ID from request-scoped key (req:{requestId}:user_role:{userId})
          const parts = key.split(":");
          return parts[parts.length - 1];
        }
      });
  }
}

export default UserRoleService;

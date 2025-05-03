import cache from "./cache-singleton";
import { db } from "database";

/**
 * Configuration options for the cache adapter
 */
interface CacheAdapterConfig {
  /** Additional key patterns that should be treated as persistent */
  persistentPatterns?: string[];

  /** Default TTL for persistent keys in seconds */
  defaultPersistentTTL?: number;

  /** Default TTL for non-persistent keys in seconds */
  defaultNonPersistentTTL?: number;

  /** Whether to enable detailed logging */
  enableDetailedLogs?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CacheAdapterConfig = {
  persistentPatterns: [],
  defaultPersistentTTL: 604800, // 7 days
  defaultNonPersistentTTL: 3600, // 1 hour
  enableDetailedLogs: false,
};

/**
 * Prefix for all Better Auth secondary storage keys
 */
const SECONDARY_STORAGE_PREFIX = "auth:secondary:";

/**
 * Key patterns that are always treated as persistent
 */
const CORE_PERSISTENT_PATTERNS = ["session", "token", "active-sessions", "passkey", "credential"];

/**
 * Type for additional info in logs
 */
type LogAdditionalInfo = {
  [key: string]: string | number | boolean | null | undefined;
};

/**
 * Environment helpers
 */
const isDevEnvironment = (): boolean => process.env.NODE_ENV === "development";
const isTestEnvironment = (): boolean => process.env.NODE_ENV === "test";
const isServerlessEnvironment = (): boolean => {
  return !!(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL ||
    process.env.NETLIFY ||
    process.env.AZURE_FUNCTIONS_ENVIRONMENT ||
    process.env.FUNCTIONS_WORKER_RUNTIME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_EXECUTION_ENV
  );
};

/**
 * Helper to format logs for better visibility
 */
const logOperation = (
  operation: string,
  key: string,
  additionalInfo: LogAdditionalInfo = {},
  enableDetailed = false
) => {
  const prefix = "🔐 SecStorage";
  const keyInfo = key.length > 30 ? `${key.substring(0, 30)}...` : key;

  // Only log in development/if detailed logging is enabled
  if ((!isDevEnvironment() && !enableDetailed) || isTestEnvironment()) return;

  console.info(`${prefix} [${operation}] ${keyInfo}`, {
    fullKey: key,
    ...additionalInfo,
  });
};

/**
 * Creates a configurable cache adapter that works efficiently
 * in both traditional and serverless environments, with special * handling for critical persistent data.
 */
export function createCacheAdapter(initialConfig: CacheAdapterConfig = {}) {
  // Merge provided config with defaults
  let config: CacheAdapterConfig = {
    ...DEFAULT_CONFIG,
    ...initialConfig,
  };

  // Helper to check if a key matches any persistent pattern
  function isPersistentKey(key: string): boolean {
    // Check core patterns first
    for (const pattern of CORE_PERSISTENT_PATTERNS) {
      if (key.includes(pattern)) {
        return true;
      }
    }

    // Check for 32-character hexadecimal keys (likely tokens)
    if (key.match(/^[A-Za-z0-9]{32}$/)) {
      return true;
    }

    // Check additional configured patterns
    for (const pattern of config.persistentPatterns || []) {
      if (key.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  // Ensure the CacheEntry model exists in the database
  const ensureCacheModel = async () => {
    try {
      // Try to query the model to see if it exists
      await db.cacheEntry.findFirst({ take: 1 });
    } catch (error) {
      // If the model doesn't exist, we'll create it
      if (error instanceof Error && error.message.includes("does not exist")) {
        console.warn(
          "CacheEntry model not found in database. Make sure your Prisma schema includes:"
        );
        console.warn(`
model CacheEntry {
  key       String    @id
  value     String    @db.Text
  expiresAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([expiresAt])
}
        `);
      }
    }
  };

  // Initialize database model
  ensureCacheModel().catch((error) => {
    console.error("Failed to initialize cache model:", error);
  });

  /**
   * Database storage implementation
   */
  const dbStorage = {
    /**
     * Retrieve a value from the database
     */
    async get(key: string): Promise<string | null> {
      try {
        const entry = await db.cacheEntry.findUnique({
          where: { key },
        });

        if (!entry) {
          return null;
        }

        // Check if the entry has expired
        if (entry.expiresAt && entry.expiresAt < new Date()) {
          // Delete expired entry
          await db.cacheEntry.delete({
            where: { key },
          });
          return null;
        }

        return entry.value;
      } catch (error) {
        console.error(`Database cache error (get) for ${key}:`, error);
        return null;
      }
    },

    /**
     * Store a value in the database
     */
    async set(key: string, value: string, ttl?: number): Promise<void> {
      try {
        const expiresAt = ttl ? new Date(Date.now() + ttl * 1000) : null;

        await db.cacheEntry.upsert({
          where: { key },
          update: {
            value,
            expiresAt,
            updatedAt: new Date(),
          },
          create: {
            key,
            value,
            expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error(`Database cache error (set) for ${key}:`, error);
      }
    },

    /**
     * Remove a value from the database
     */
    async delete(key: string): Promise<void> {
      try {
        await db.cacheEntry
          .delete({
            where: { key },
          })
          .catch((err) => {
            // Ignore if not found
            if (!err.message.includes("Record to delete does not exist")) {
              throw err;
            }
          });
      } catch (error) {
        console.error(`Database cache error (delete) for ${key}:`, error);
      }
    },

    /**
     * Remove all values with a given prefix
     */
    async deleteByPrefix(prefix: string): Promise<number> {
      try {
        const result = await db.$executeRaw`
          DELETE FROM "CacheEntry" 
          WHERE "key" LIKE ${prefix + "%"}
        `;
        return Number(result);
      } catch (error) {
        console.error(`Database cache error (deleteByPrefix) for ${prefix}:`, error);
        return 0;
      }
    },

    /**
     * Clean up expired entries
     */
    async cleanup(): Promise<number> {
      try {
        const result = await db.$executeRaw`
          DELETE FROM "CacheEntry" 
          WHERE "expiresAt" IS NOT NULL AND "expiresAt" < ${new Date()}
        `;
        return Number(result);
      } catch (error) {
        console.error(`Database cache error (cleanup):`, error);
        return 0;
      }
    },
  };

  /**
   * The cache adapter that implements Better Auth's SecondaryStorage interface
   */
  const cacheAdapter = {
    /**
     * Gets a value with environment and key-type awareness
     */
    get: async (key: string): Promise<string | null> => {
      const prefixedKey = SECONDARY_STORAGE_PREFIX + key;
      const isPersistent = isPersistentKey(key);
      const isServerless = isServerlessEnvironment();

      try {
        // Initialize in-memory cache for serverless if needed
        if (isServerless && !cache.getRequestId()) {
          cache.initializeForRequest();
        }

        // STRATEGY 1: SERVERLESS + PERSISTENT KEYS
        // For persistent keys in serverless, database is source of truth
        if (isServerless && isPersistent) {
          // First check database for persistent data
          const dbValue = await dbStorage.get(prefixedKey);

          if (dbValue) {
            // Update memory cache for subsequent calls in this function
            cache.set(prefixedKey, dbValue, 3600000, { priority: 10 });
            logOperation(
              "GET",
              key,
              {
                source: "database-primary",
                found: true,
                isPersistent,
                inServerless: true,
              },
              config.enableDetailedLogs
            );

            return dbValue;
          } else {
          }

          // Fallback to memory cache (might have just been set in this function)
          const memValue = cache.get<string>(prefixedKey);
          if (memValue) {
            logOperation(
              "GET",
              key,
              {
                source: "memory-fallback",
                found: true,
                isPersistent,
                inServerless: true,
              },
              config.enableDetailedLogs
            );
            return memValue;
          }

          return null;
        }

        // STRATEGY 2: SERVERLESS + NON-PERSISTENT KEYS
        // For non-persistent keys in serverless, just use memory
        if (isServerless && !isPersistent) {
          const memValue = cache.get<string>(prefixedKey);

          logOperation(
            "GET",
            key,
            {
              source: "memory-only",
              found: !!memValue,
              isPersistent,
              inServerless: true,
            },
            config.enableDetailedLogs
          );

          return memValue || null;
        }

        // STRATEGY 3: NON-SERVERLESS ENVIRONMENT
        // Use memory first, then database as fallback for persistent keys
        const memValue = cache.get<string>(prefixedKey);
        if (memValue) {
          logOperation(
            "GET",
            key,
            {
              source: "memory-primary",
              found: true,
              isPersistent,
              inServerless: false,
            },
            config.enableDetailedLogs
          );
          return memValue;
        }

        // For persistent keys, try database as fallback
        if (isPersistent) {
          const dbValue = await dbStorage.get(prefixedKey);

          if (dbValue) {
            // Update memory cache for future gets
            cache.set(prefixedKey, dbValue, 24 * 60 * 60 * 1000, { priority: 10 });

            logOperation(
              "GET",
              key,
              {
                source: "database-fallback",
                found: true,
                isPersistent,
                inServerless: false,
              },
              config.enableDetailedLogs
            );

            return dbValue;
          }
        }

        // Not found in either storage
        logOperation(
          "GET",
          key,
          {
            found: false,
            isPersistent,
            inServerless: isServerless,
          },
          config.enableDetailedLogs
        );

        return null;
      } catch (error) {
        console.error(`Cache error for ${key}:`, error);
        return null;
      }
    },

    /**
     * Sets a value with environment and key-type awareness
     */
    set: async (
      key: string,
      value: string,
      ttl?: number,
      options?: { forcePersist?: boolean }
    ): Promise<void> => {
      try {
        const prefixedKey = SECONDARY_STORAGE_PREFIX + key;
        let isPersistent = isPersistentKey(key);

        // Force persistence if requested via options
        if (options?.forcePersist) {
          isPersistent = true;
        }

        const isServerless = isServerlessEnvironment();

        // Determine TTL values
        let ttlMs: number | undefined;
        let ttlSecs: number | undefined = ttl;

        if (ttl) {
          ttlMs = ttl * 1000;
        } else {
          // Default TTLs
          if (isPersistent) {
            ttlMs = config.defaultPersistentTTL! * 1000;
            ttlSecs = config.defaultPersistentTTL;
          } else {
            ttlMs = config.defaultNonPersistentTTL! * 1000;
            ttlSecs = config.defaultNonPersistentTTL;
          }
        }

        // Initialize in-memory cache for serverless if needed
        if (isServerless && !cache.getRequestId()) {
          cache.initializeForRequest();
        }

        // STRATEGY 1: SERVERLESS + PERSISTENT KEYS
        // For persistent keys in serverless, database is primary, memory is secondary
        if (isServerless && isPersistent) {
          // First ensure it's in the database (primary storage)
          const expiresAt = ttlSecs ? new Date(Date.now() + ttlSecs * 1000) : null;

          try {
            // Store in database
            await db.cacheEntry.upsert({
              where: { key: prefixedKey },
              update: {
                value,
                expiresAt,
                updatedAt: new Date(),
              },
              create: {
                key: prefixedKey,
                value,
                expiresAt,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          } catch (error) {
            console.error(`Database cache error (set) for ${key}:`, error);
          }

          // Also store in memory for duration of this function
          cache.set(prefixedKey, value, ttlMs, { priority: 10 });

          logOperation(
            "SET",
            key,
            {
              source: "database-primary",
              ttlSeconds: ttlSecs,
              isPersistent,
              inServerless: true,
            },
            config.enableDetailedLogs
          );
        }
        // STRATEGY 2: SERVERLESS + NON-PERSISTENT KEYS
        // For non-persistent keys in serverless, just use memory
        else if (isServerless && !isPersistent) {
          cache.set(prefixedKey, value, ttlMs, { priority: 5 });

          logOperation(
            "SET",
            key,
            {
              source: "memory-only",
              ttlSeconds: ttlSecs,
              isPersistent,
              inServerless: true,
            },
            config.enableDetailedLogs
          );
        }
        // STRATEGY 3: NON-SERVERLESS ENVIRONMENT
        // Use memory primarily, database as backup for persistent keys
        else {
          // Always set in memory
          cache.set(prefixedKey, value, ttlMs, {
            priority: isPersistent ? 10 : 5,
          });

          // For persistent keys, also persist to database
          if (isPersistent) {
            const expiresAt = ttlSecs ? new Date(Date.now() + ttlSecs * 1000) : null;

            try {
              // Store in database
              await db.cacheEntry.upsert({
                where: { key: prefixedKey },
                update: {
                  value,
                  expiresAt,
                  updatedAt: new Date(),
                },
                create: {
                  key: prefixedKey,
                  value,
                  expiresAt,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              });
            } catch (error) {
              console.error(`Database cache error (set) for ${key}:`, error);
            }

            logOperation(
              "SET",
              key,
              {
                source: "hybrid",
                ttlSeconds: ttlSecs,
                isPersistent,
                inServerless: false,
              },
              config.enableDetailedLogs
            );
          } else {
            logOperation(
              "SET",
              key,
              {
                source: "memory-primary",
                ttlSeconds: ttlSecs,
                isPersistent,
                inServerless: false,
              },
              config.enableDetailedLogs
            );
          }
        }

        // Debug logging
        if (isDevEnvironment() && isPersistent) {
          console.log(`🔍 Persistent data stored: ${prefixedKey}`, {
            ttlMs,
            ttlSeconds: ttlSecs,
            inServerless: isServerless,
            inDatabase: isPersistent,
          });
        }
      } catch (error) {
        console.error(`Cache set error for ${key}:`, error);
      }
    },

    /**
     * Deletes a value with environment and key-type awareness
     */
    delete: async (key: string): Promise<void> => {
      try {
        const prefixedKey = SECONDARY_STORAGE_PREFIX + key;
        const isPersistent = isPersistentKey(key);

        // Always try to delete from memory
        cache.del(prefixedKey);

        // For persistent keys, also delete from database
        if (isPersistent) {
          await dbStorage.delete(prefixedKey);
        }

        logOperation(
          "DELETE",
          key,
          {
            inServerless: isServerlessEnvironment(),
            isPersistent,
          },
          config.enableDetailedLogs
        );
      } catch (error) {
        console.error(`Cache delete error for ${key}:`, error);
      }
    },

    /**
     * Clears all secondary storage data
     */
    clear: async (): Promise<number> => {
      try {
        // Clear in-memory cache
        const memoryCount = cache.deleteByPrefix(SECONDARY_STORAGE_PREFIX);

        // Clear database
        const dbCount = await dbStorage.deleteByPrefix(SECONDARY_STORAGE_PREFIX);

        if (isDevEnvironment() || config.enableDetailedLogs) {
          console.info(
            `🔐 SecStorage [CLEAR] Removed ${memoryCount} memory entries and ${dbCount} database entries`
          );
        }

        return memoryCount + dbCount;
      } catch (error) {
        console.error("Cache clear error:", error);
        return 0;
      }
    },

    /**
     * Gets statistics about the secondary storage cache
     */
    getStats: () => {
      const stats = cache.getStats();

      // Run database cleanup in the background
      dbStorage.cleanup().then((count) => {
        if (count > 0 && (isDevEnvironment() || config.enableDetailedLogs)) {
          console.info(`🧹 Cleaned up ${count} expired database cache entries`);
        }
      });

      if (isDevEnvironment() || config.enableDetailedLogs) {
        console.info("🔐 SecStorage [STATS]", {
          memory: {
            size: stats.size,
            hitRate: (stats.hitRate * 100).toFixed(2) + "%",
            missRate: (stats.missRate * 100).toFixed(2) + "%",
          },
          inServerless: isServerlessEnvironment(),
        });
      }

      return stats;
    },
  };

  // Configuration management methods
  return {
    ...cacheAdapter,

    /**
     * Update the adapter configuration
     * @param newConfig New configuration options
     */
    updateConfig(newConfig: Partial<CacheAdapterConfig>): void {
      config = {
        ...config,
        ...newConfig,
      };

      if (isDevEnvironment() || config.enableDetailedLogs) {
        console.info("🔐 SecStorage configuration updated:", config);
      }
    },

    /**
     * Add additional persistent key patterns
     * @param patterns Patterns to add (strings that will be checked with .includes())
     */
    addPersistentPatterns(patterns: string[]): void {
      const currentPatterns = config.persistentPatterns || [];

      // Add new patterns while avoiding duplicates
      const newPatterns = patterns.filter((pattern) => !currentPatterns.includes(pattern));

      config.persistentPatterns = [...currentPatterns, ...newPatterns];

      if (isDevEnvironment() || config.enableDetailedLogs) {
        console.info("🔐 Added persistent key patterns:", newPatterns);
        console.info("🔐 All persistent patterns:", config.persistentPatterns);
      }
    },

    /**
     * Remove persistent key patterns
     * @param patterns Patterns to remove
     */
    removePersistentPatterns(patterns: string[]): void {
      const currentPatterns = config.persistentPatterns || [];
      config.persistentPatterns = currentPatterns.filter((pattern) => !patterns.includes(pattern));

      if (isDevEnvironment() || config.enableDetailedLogs) {
        console.info("🔐 Removed persistent key patterns:", patterns);
        console.info("🔐 Remaining persistent patterns:", config.persistentPatterns);
      }
    },

    /**
     * Get the current configuration
     */
    getConfig(): CacheAdapterConfig {
      return { ...config };
    },

    /**
     * Check if a key would be treated as persistent
     * @param key The key to check
     * @returns Whether the key matches any persistent pattern
     */
    wouldPersist(key: string): boolean {
      return isPersistentKey(key);
    },
  };
}

// Create the default instance with default settings
export const hybridCacheStorage = createCacheAdapter();

export default hybridCacheStorage;

import { LRUMap } from "./lru-map.js";
import { generateSecureUUID } from "./uuid-generator.js";

/**
 * Cache entry structure with enhanced metadata
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
  hits: number;
  size: number;
  priority?: number;
}

/**
 * Comprehensive cache statistics structure
 */
interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  totalRequests: number;
  byKeyTypeCount: Record<string, number>;
  averageValueSize: number;
  memoryUsage: number;
  healthScore: number;
}

/**
 * Circuit breaker status types
 */
type CacheCircuitStatus = "closed" | "open" | "half-open";

/**
 * Eviction callback type
 */
type EvictionCallback<T> = (
  key: string,
  value: T,
  reason: "expired" | "capacity" | "memory" | "manual"
) => void;

// Default settings aligned with Better Auth
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_MAX_SIZE = 2000;
const DEFAULT_MAX_MEMORY_MB = 100; // 100MB max memory usage
const DEFAULT_CLEANUP_FREQUENCY_MS = 60 * 1000; // 1 minute

// Default settings for serverless environments
const SERVERLESS_TTL_MS = 60 * 1000; // 1 minute (typical max serverless execution time)
const SERVERLESS_MAX_SIZE = 100;
const SERVERLESS_MAX_MEMORY_MB = 50; // More conservative memory limit for serverless

/**
 * Enhanced in-memory cache optimized for serverless environments
 * with resilience features and memory efficiency improvements
 */
class CacheService {
  private cache: Map<string, CacheEntry<unknown>>;
  private prefixIndex: Map<string, Set<string>>; // For fast prefix lookups
  private defaultTTL: number;
  private maxSize: number;
  private maxMemoryBytes: number;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
    totalRequests: number;
    totalValueSize: number;
    keyTypeCounts: Map<string, number>;
    circuitBreaks: number;
    recoveries: number;
  };
  private lastCleanup: number;
  private cleanupFrequency: number;
  private lastMonitoringCheck: number;
  private growthRate: number;
  private estimatedMemoryUsage: number;
  private circuitStatus: Map<string, { status: CacheCircuitStatus; until: number }>;
  private hotKeys: LRUMap<string, number>; // Track frequently accessed keys
  private evictionCallbacks: EvictionCallback<unknown>[] = []; //Callbacks for eviction events
  private inFlightRequests: Map<string, Promise<unknown>> = new Map(); //Track in-flight async gets

  // Serverless-specific properties
  private isServerless: boolean;
  private requestId: string | null = null;
  private requestStartTime: number | null = null;

  /**
   * Enhanced memory estimation utility
   * Uses intelligent approaches to estimate object size without full stringification
   */
  private sizeEstimator = {
    // Size constants for JavaScript primitives (in bytes)
    SIZES: {
      BOOLEAN: 4,
      NUMBER: 8,
      STRING_BASE: 2, // Base size for strings
      STRING_CHAR: 2, // Per character (UTF-16)
      OBJECT_BASE: 32, // Base size for objects
      ARRAY_BASE: 32, // Base size for arrays
      ARRAY_ITEM: 8, // Reference size per array item
      KEY_BASE: 16, // Base size for object keys
      DATE: 32, // Size of a Date object
      REGEX: 64, // Approximate size of a RegExp
      NULL_UNDEFINED: 4, // Size of null or undefined
    },

    // Size threshold above which we'll use sampling
    SAMPLING_THRESHOLD: 1000,

    // For large arrays, we'll sample this many items
    SAMPLE_SIZE: 100,

    /**
     * Estimate the size of any JavaScript value
     * @param value The value to estimate
     * @param depth Current recursion depth (for limiting)
     * @returns Estimated size in bytes
     */
    estimate(value: unknown, depth: number = 0): number {
      // Prevent excessive recursion
      if (depth > 20) {
        return 1000; // Return a reasonable default for deeply nested structures
      }

      // Handle null and undefined
      if (value === null || value === undefined) {
        return this.SIZES.NULL_UNDEFINED;
      }

      const type = typeof value;

      // Handle primitives
      if (type === "boolean") {
        return this.SIZES.BOOLEAN;
      }

      if (type === "number") {
        return this.SIZES.NUMBER;
      }

      if (type === "string") {
        const str = value as string;
        // For very long strings, use length * char size + base
        return this.SIZES.STRING_BASE + str.length * this.SIZES.STRING_CHAR;
      }

      // Handle special objects
      if (value instanceof Date) {
        return this.SIZES.DATE;
      }

      if (value instanceof RegExp) {
        return this.SIZES.REGEX;
      }

      // Handle arrays - use sampling for large arrays
      if (Array.isArray(value)) {
        const array = value as unknown[];
        const length = array.length;

        if (length === 0) {
          return this.SIZES.ARRAY_BASE;
        }

        if (length > this.SAMPLING_THRESHOLD) {
          // For large arrays, sample items for better performance
          const sampleSize = Math.min(this.SAMPLE_SIZE, length);
          let sampledSize = 0;

          // Take samples at different parts of the array
          for (let i = 0; i < sampleSize; i++) {
            const index = Math.floor((i / sampleSize) * length);
            sampledSize += this.estimate(array[index], depth + 1);
          }

          // Extrapolate to the full array size
          const averageSampleSize = sampledSize / sampleSize;
          return (
            this.SIZES.ARRAY_BASE + length * this.SIZES.ARRAY_ITEM + length * averageSampleSize
          );
        } else {
          // For smaller arrays, measure each item
          let totalSize = this.SIZES.ARRAY_BASE;
          for (let i = 0; i < length; i++) {
            totalSize += this.SIZES.ARRAY_ITEM + this.estimate(array[i], depth + 1);
          }
          return totalSize;
        }
      }

      // Handle objects
      if (type === "object") {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        const keyCount = keys.length;

        if (keyCount === 0) {
          return this.SIZES.OBJECT_BASE;
        }

        if (keyCount > this.SAMPLING_THRESHOLD) {
          // For large objects, sample keys
          const sampleSize = Math.min(this.SAMPLE_SIZE, keyCount);
          let sampledSize = 0;
          let keySizeTotal = 0;

          for (let i = 0; i < sampleSize; i++) {
            const index = Math.floor((i / sampleSize) * keyCount);
            const key = keys[index];
            keySizeTotal += this.SIZES.KEY_BASE + key.length * this.SIZES.STRING_CHAR;
            sampledSize += this.estimate(obj[key], depth + 1);
          }

          // Extrapolate to full object
          const averageValueSize = sampledSize / sampleSize;
          const averageKeySize = keySizeTotal / sampleSize;
          return this.SIZES.OBJECT_BASE + keyCount * averageKeySize + keyCount * averageValueSize;
        } else {
          // For smaller objects, measure each property
          let totalSize = this.SIZES.OBJECT_BASE;
          for (const key of keys) {
            totalSize +=
              this.SIZES.KEY_BASE +
              key.length * this.SIZES.STRING_CHAR +
              this.estimate(obj[key], depth + 1);
          }
          return totalSize;
        }
      }

      // Handle functions and other types
      return 64; // Reasonable default for other types
    },

    /**
     * Get estimated size of a value - public API
     * @param value The value to measure
     * @returns Size in bytes
     */
    getSize(value: unknown): number {
      // For small strings, use the fast path
      if (typeof value === "string" && value.length < 1000) {
        return this.SIZES.STRING_BASE + value.length * this.SIZES.STRING_CHAR;
      }

      // For primitives, use direct sizing
      if (
        value === null ||
        value === undefined ||
        typeof value === "boolean" ||
        typeof value === "number"
      ) {
        return this.estimate(value);
      }

      // Try the structural analysis approach
      try {
        return this.estimate(value);
      } catch (err) {
        // Log in development but don't crash in production
        if (process.env.NODE_ENV === "development") {
          console.warn("Memory estimation failed, falling back to stringification:", err);
        }

        // Fallback to JSON.stringify for complex cases where our estimation fails
        try {
          const valueString = typeof value === "string" ? value : JSON.stringify(value || null);
          return valueString.length * 2; // Approximate UTF-16 encoding
        } catch (jsonErr) {
          // Log in development but don't crash in production
          if (process.env.NODE_ENV === "development") {
            console.warn("JSON stringify fallback failed, using default size:", jsonErr);
          }

          // If all else fails, return a conservative estimate
          return 1024; // 1KB default for unparseable objects
        }
      }
    },
  };

  /**
   * Create a cache service
   * @param maxSize Maximum number of entries to store
   * @param ttl Default TTL in milliseconds
   * @param maxMemoryMB Maximum memory usage in MB
   */
  constructor(
    maxSize: number = DEFAULT_MAX_SIZE,
    ttl: number = DEFAULT_TTL_MS,
    maxMemoryMB: number = DEFAULT_MAX_MEMORY_MB
  ) {
    this.cache = new Map();
    this.prefixIndex = new Map();
    this.defaultTTL = ttl;
    this.maxSize = maxSize;
    this.maxMemoryBytes = maxMemoryMB * 1024 * 1024;
    this.estimatedMemoryUsage = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      totalValueSize: 0,
      keyTypeCounts: new Map(),
      circuitBreaks: 0,
      recoveries: 0,
    };
    this.lastCleanup = Date.now();
    this.cleanupFrequency = DEFAULT_CLEANUP_FREQUENCY_MS;
    this.lastMonitoringCheck = Date.now();
    this.growthRate = 0;
    this.circuitStatus = new Map();
    this.hotKeys = new LRUMap<string, number>(100, {
      cleanupIntervalMs: 60000, // Clean up expired items every minute
    }); // Track top 100 hot keys

    // Auto-detect serverless environment
    this.isServerless = this.detectServerlessEnvironment();

    // Configure for serverless if detected
    if (this.isServerless) {
      this.configureForServerless();
    }
  }

  /**
   * Detect if running in a serverless environment
   * @returns True if in a serverless environment
   */
  private detectServerlessEnvironment(): boolean {
    // Cross-platform detection of serverless environment
    // Check for common environment variables across platforms
    if (typeof process !== "undefined" && process.env) {
      return !!(
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.VERCEL ||
        process.env.NETLIFY ||
        process.env.AZURE_FUNCTIONS_ENVIRONMENT ||
        process.env.FUNCTIONS_WORKER_RUNTIME || // Google Cloud Functions
        process.env.LAMBDA_TASK_ROOT ||
        process.env.AWS_EXECUTION_ENV
      );
    }
    return false; // Default to false in React Native
  }

  /**
   * Configure the cache for serverless environments
   * Adjusts settings to be more appropriate for request-scoped caching
   */
  public configureForServerless(
    options = {
      maxSize: SERVERLESS_MAX_SIZE,
      defaultTTL: SERVERLESS_TTL_MS,
      maxMemoryMB: SERVERLESS_MAX_MEMORY_MB,
    }
  ): void {
    this.isServerless = true;
    this.maxSize = options.maxSize;
    this.defaultTTL = options.defaultTTL;
    this.maxMemoryBytes = options.maxMemoryMB * 1024 * 1024;

    // Create a request ID if one doesn't exist
    if (!this.requestId) {
      this.requestId = generateSecureUUID();
    }

    if (process.env.NODE_ENV === "development") {
      console.info(`🔄 Cache configured for serverless environment (request: ${this.requestId})`);
    }
  }

  /**
   * Initialize cache for a new request in serverless environments
   * This should be called at the beginning of each request
   */
  public initializeForRequest(): void {
    if (!this.isServerless) {
      // Only applies to serverless environments
      return;
    }

    // Generate a new request ID
    this.requestId = generateSecureUUID();
    this.requestStartTime = Date.now();

    // Reset stats for this request
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.totalRequests = 0;

    if (process.env.NODE_ENV === "development") {
      console.info(`🔄 Cache initialized for new request (${this.requestId})`);
    }
  }

  /**
   * Smart cleanup with memory pressure awareness and adaptive frequency
   * @param force Force cleanup regardless of timing
   */
  private maybeCleanup(force: boolean = false): void {
    // Skip cleanup in serverless mode unless forced (to save resources)
    if (this.isServerless && !force) {
      return;
    }

    const now = Date.now();
    const memoryPressure = this.estimatedMemoryUsage / this.maxMemoryBytes;

    // Adjust cleanup frequency based on memory pressure
    const adjustedFrequency =
      memoryPressure > 0.8
        ? this.cleanupFrequency / 2 // More frequent when under pressure
        : this.cleanupFrequency;

    // Only run cleanup if it's been long enough or forced
    if (!force && now - this.lastCleanup < adjustedFrequency) {
      return;
    }

    this.lastCleanup = now;
    let expiredCount = 0;
    const keysToDelete: string[] = [];

    // Find expired entries
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt <= now) {
        keysToDelete.push(key);
      }
    });

    // Delete expired keys
    for (const key of keysToDelete) {
      const entry = this.cache.get(key);
      if (entry) {
        // Notify about expiration before removing
        this.notifyEviction(key, entry.value, "expired");
      }
      this.removeEntry(key);
      expiredCount++;
    }

    // Log cleanup activity in development
    if (expiredCount > 0 && process.env.NODE_ENV === "development") {
      console.info(
        `🧹 Cache cleanup: removed ${expiredCount} expired entries, memory: ${(
          this.estimatedMemoryUsage /
          1024 /
          1024
        ).toFixed(2)}MB`
      );
    }

    // Perform adaptive size enforcement based on memory pressure
    const shouldEnforce = memoryPressure > 0.9 || this.cache.size > this.maxSize;
    if (shouldEnforce) {
      this.enforceResourceLimits(memoryPressure);
    }

    // Reset circuit breakers that have timed out
    this.resetExpiredCircuitBreakers(now);

    // Update growth metrics
    this.monitorGrowth();
  }

  /**
   * Register an eviction callback
   * @param callback The function to call when an item is evicted
   */
  public onEviction<T>(callback: EvictionCallback<T>): void {
    this.evictionCallbacks.push(callback as EvictionCallback<unknown>);
  }

  /**
   * Notify all registered callbacks about an eviction
   * @param key The key being evicted
   * @param value The value being evicted
   * @param reason The reason for eviction
   */
  private notifyEviction<T>(
    key: string,
    value: T,
    reason: "expired" | "capacity" | "memory" | "manual"
  ): void {
    for (const callback of this.evictionCallbacks) {
      try {
        callback(key, value, reason);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error in eviction callback:", error);
        }
      }
    }
  }

  /**
   * Enforces both size and memory limits with adaptive strategy
   * @param memoryPressure Current memory pressure ratio (0-1)
   */
  private enforceResourceLimits(memoryPressure: number): void {
    // Skip if within limits
    if (this.cache.size <= this.maxSize && memoryPressure <= 0.9) {
      return;
    }

    // Calculate target reduction - more aggressive under high memory pressure
    const targetSize =
      memoryPressure > 0.95
        ? Math.floor(this.maxSize * 0.7) // Reduce to 70% when critical
        : Math.floor(this.maxSize * 0.85); // Reduce to 85% normally

    const entriesToRemove = Math.max(0, this.cache.size - targetSize);
    if (entriesToRemove <= 0) return;

    // Sort entries by priority, then by score (combination of hits and recency)
    const sortedEntries = Array.from(this.cache.entries()).sort((a, b) => {
      // First compare priority (if exists)
      const priorityA = a[1].priority || 0;
      const priorityB = b[1].priority || 0;
      if (priorityA !== priorityB) return priorityA - priorityB;

      // Then calculate a score based on hits and recency
      const accessScore = (entry: CacheEntry<unknown>) =>
        entry.hits * 0.6 + entry.lastAccessed * 0.4;

      return accessScore(a[1]) - accessScore(b[1]);
    });

    // Remove lowest-scoring entries
    const keysToRemove = sortedEntries.slice(0, entriesToRemove).map((entry) => entry[0]);

    let removedCount = 0;
    let memoryFreed = 0;

    for (const key of keysToRemove) {
      const entry = this.cache.get(key);
      if (entry) {
        memoryFreed += entry.size;
        // Notify about capacity-based eviction
        this.notifyEviction(key, entry.value, memoryPressure > 0.9 ? "memory" : "capacity");
        this.removeEntry(key);
        removedCount++;
      }
    }

    this.stats.evictions += removedCount;

    if (process.env.NODE_ENV === "development" && removedCount > 5) {
      console.info(
        `⚠️ Cache evicted ${removedCount} entries (${(memoryFreed / 1024 / 1024).toFixed(
          2
        )}MB), memory pressure: ${(memoryPressure * 100).toFixed(1)}%`
      );
    }
  }

  /**
   * Get a key that's appropriate for the current environment
   * In serverless mode, scopes keys to the current request
   * @param key Original cache key
   * @returns Modified key if in serverless mode, original key otherwise
   */
  private getEnvironmentAwareKey(key: string): string {
    if (this.isServerless && this.requestId) {
      return `req:${this.requestId}:${key}`;
    }
    return key;
  }

  /**
   * Consistent key type extraction with support for different patterns
   * @param key The cache key
   * @returns The key type identifier
   */
  private getKeyTypeFromKey(key: string): string {
    // For request-scoped keys, remove the prefix
    const cleanKey = key.startsWith("req:") ? key.split(":").slice(2).join(":") : key;

    // For Better Auth keys, use the prefix pattern
    if (cleanKey.includes(":")) {
      return cleanKey.split(":")[0];
    }

    // For other custom patterns
    if (cleanKey.startsWith("user_role:")) return "user_role";

    return "unknown";
  }

  /**
   * Index a key by prefix for fast prefix-based operations
   * @param key The cache key to index
   */
  private indexByPrefix(key: string): void {
    // Get clean key without request prefix for better indexing
    const cleanKey = key.startsWith("req:") ? key.split(":").slice(2).join(":") : key;

    // Index common prefixes for fast lookups
    const prefixes = ["auth:secondary:", "user_role:", "session:", "token:", "user_profile:"];

    for (const prefix of prefixes) {
      if (cleanKey.startsWith(prefix)) {
        let prefixSet = this.prefixIndex.get(prefix);
        if (!prefixSet) {
          prefixSet = new Set<string>();
          this.prefixIndex.set(prefix, prefixSet);
        }
        prefixSet.add(key);
        break;
      }
    }
  }

  /**
   * Remove a key from the prefix index
   * @param key The cache key to remove
   */
  private removeFromPrefixIndex(key: string): void {
    // Get clean key without request prefix for better indexing
    const cleanKey = key.startsWith("req:") ? key.split(":").slice(2).join(":") : key;

    this.prefixIndex.forEach((keySet, prefix) => {
      if (cleanKey.startsWith(prefix)) {
        keySet.delete(key);
        if (keySet.size === 0) {
          this.prefixIndex.delete(prefix);
        }
      }
    });
  }

  /**
   * Track key type statistics
   * @param keyType The key type to increment
   */
  private incrementKeyTypeCount(keyType: string): void {
    const currentCount = this.stats.keyTypeCounts.get(keyType) || 0;
    this.stats.keyTypeCounts.set(keyType, currentCount + 1);
  }

  /**
   * Decrement key type statistics
   * @param keyType The key type to decrement
   */
  private decrementKeyTypeCount(keyType: string): void {
    const currentCount = this.stats.keyTypeCounts.get(keyType) || 0;
    if (currentCount > 0) {
      this.stats.keyTypeCounts.set(keyType, currentCount - 1);
    }
  }

  /**
   * Complete entry removal with cleanup of all indexes
   * @param key The cache key to remove
   */
  private removeEntry(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    // Update memory tracking
    this.estimatedMemoryUsage -= entry.size;

    // Update key type counts
    const keyType = this.getKeyTypeFromKey(key);
    this.decrementKeyTypeCount(keyType);

    // Remove from prefix index
    this.removeFromPrefixIndex(key);

    // Remove from cache
    this.cache.delete(key);

    // Remove from hot keys if present
    this.hotKeys.delete(key);
  }

  /**
   * Reset circuit breakers that have expired
   * @param now Current timestamp
   */
  private resetExpiredCircuitBreakers(now: number): void {
    const expiredCircuits: string[] = [];

    this.circuitStatus.forEach((state, keyPattern) => {
      if (state.status !== "closed" && state.until <= now) {
        expiredCircuits.push(keyPattern);
      }
    });

    for (const keyPattern of expiredCircuits) {
      const state = this.circuitStatus.get(keyPattern);
      if (state?.status === "open") {
        // Move from open to half-open
        this.circuitStatus.set(keyPattern, {
          status: "half-open",
          until: now + 60000, // Test for 1 minute
        });
      } else if (state?.status === "half-open") {
        // Reset to closed if half-open period expired
        this.circuitStatus.delete(keyPattern);
        this.stats.recoveries++;

        if (process.env.NODE_ENV === "development") {
          console.info(`🔌 Circuit recovered for pattern: ${keyPattern}`);
        }
      }
    }
  }

  /**
   * Enhanced get with circuit breaker and jitter for cache stampede prevention
   * Implements stale-while-revalidate pattern
   *
   * @param key The cache key
   * @param options Optional configuration
   * @returns The cached value or undefined if not found
   */
  public get<T>(
    key: string,
    options?: {
      allowStale?: boolean;
      maxStaleAgeMs?: number;
    }
  ): T | undefined {
    // Default options
    const allowStale = options?.allowStale ?? false;
    const maxStaleAgeMs = options?.maxStaleAgeMs ?? 60000; // 1 minute

    // Modify key for serverless environment if needed
    const envKey = this.getEnvironmentAwareKey(key);

    // Try to clean up on each significant operation
    this.maybeCleanup();

    // Check circuit breaker status for this key or key pattern
    const circuitPattern = this.findMatchingCircuitPattern(key);
    if (circuitPattern) {
      const circuitState = this.circuitStatus.get(circuitPattern);
      if (circuitState?.status === "open") {
        // Circuit is open, fail fast
        this.stats.misses++;
        this.stats.totalRequests++;
        return undefined;
      }
    }

    this.stats.totalRequests++;
    const entry = this.cache.get(envKey);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    const now = Date.now();

    // Mark this as a hot key
    this.trackHotKey(envKey);

    // Check if entry is fresh
    if (entry.expiresAt > now) {
      // Entry is fresh
      this.updateEntryAccess(entry);
      this.stats.hits++;
      return entry.value as T;
    }

    // Entry is stale - check if we can return stale value
    if (allowStale && entry.expiresAt + maxStaleAgeMs > now) {
      this.stats.hits++; // Count as hit even though stale

      // Schedule async refresh if this is a hot key
      if (this.hotKeys.has(envKey)) {
        this.scheduleAsyncRefresh(envKey);
      }

      return entry.value as T;
    }

    // Entry is expired and cannot be served stale
    this.removeEntry(envKey);
    this.stats.misses++;
    return undefined;
  }

  /**
   * Check if a key exists in the cache without updating its LRU position
   * Similar to get() but doesn't count as a hit or update last access time
   * @param key The cache key to check
   * @returns The value if found and not expired, undefined otherwise
   */
  public peek<T>(key: string): T | undefined {
    const envKey = this.getEnvironmentAwareKey(key);
    const entry = this.cache.get(envKey);

    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    if (entry.expiresAt <= now) {
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key to check
   * @returns True if the key exists and is not expired
   */
  public has(key: string): boolean {
    const envKey = this.getEnvironmentAwareKey(key);
    const entry = this.cache.get(envKey);

    if (!entry) {
      return false;
    }

    return entry.expiresAt > Date.now();
  }

  /**
   * Race-safe asynchronous get with promise deduplication
   * Prevents the "cache stampede" problem where multiple concurrent
   * requests for the same missing key trigger multiple fetches
   *
   * @param key The cache key
   * @param fetchFn Function to fetch the value if not in cache
   * @param ttl TTL in milliseconds
   * @param options Additional options
   * @returns Promise resolving to the cached or fetched value
   */
  public async getAsync<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL,
    options?: {
      priority?: number;
      allowStale?: boolean;
      maxStaleAgeMs?: number;
    }
  ): Promise<T> {
    const envKey = this.getEnvironmentAwareKey(key);

    // First try to get from cache
    const cachedValue = this.get<T>(envKey, {
      allowStale: options?.allowStale,
      maxStaleAgeMs: options?.maxStaleAgeMs,
    });

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // Check if there's already an in-flight request for this key
    const existing = this.inFlightRequests.get(envKey) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    // Create a new request and track it
    const fetchPromise = fetchFn()
      .then((value) => {
        // Store the fetched value in cache
        this.set(envKey, value, ttl, { priority: options?.priority });
        // Remove from in-flight tracking
        this.inFlightRequests.delete(envKey);
        return value;
      })
      .catch((error) => {
        // Remove from in-flight tracking on error
        this.inFlightRequests.delete(envKey);
        throw error;
      });

    // Track this promise
    this.inFlightRequests.set(envKey, fetchPromise);

    return fetchPromise;
  }

  /**
   * Track hot keys for optimized handling
   * @param key The cache key to mark as hot
   */
  private trackHotKey(key: string): void {
    const currentHits = this.hotKeys.get(key) || 0;
    this.hotKeys.set(key, currentHits + 1, 1, 24 * 60 * 60 * 1000); // Keep hot key data for 24 hours
  }

  /**
   * Update entry access metadata
   * @param entry The cache entry to update
   */
  private updateEntryAccess(entry: CacheEntry<unknown>): void {
    entry.lastAccessed = Date.now();
    entry.hits++;
  }

  /**
   * Find a matching circuit breaker pattern for a key
   * @param key The cache key to check
   * @returns The matching pattern or undefined
   */
  private findMatchingCircuitPattern(key: string): string | undefined {
    // Clean key for pattern matching if in serverless mode
    const cleanKey = key.startsWith("req:") ? key.split(":").slice(2).join(":") : key;

    for (const pattern of this.circuitStatus.keys()) {
      if (cleanKey.includes(pattern)) {
        return pattern;
      }
    }
    return undefined;
  }

  /**
   * Schedule an async refresh for a hot key
   * @param key The cache key to refresh
   */
  private scheduleAsyncRefresh(key: string): void {
    // This would ideally use a worker or background process
    // For serverless, we'll use a simple timeout as a fallback
    setTimeout(() => {
      // This method would be implemented by the cache consumer
      // We'd expose a registerRefreshHandler method
      console.info(`Would refresh key ${key} in background`);
    }, 0);
  }

  /**
   * Calculate the size of a cache entry with improved efficiency
   * @param key The cache key
   * @param value The value to be stored
   * @returns Estimated size in bytes
   */
  private calculateEntrySize(key: string, value: unknown): number {
    // Base overhead for entry metadata
    const objectOverhead = 200;

    // Key size estimation
    const keySize = key.length * 2; // UTF-16 encoding

    // Value size estimation using our enhanced estimator
    const valueSize = this.sizeEstimator.getSize(value);

    // Total size
    return keySize + valueSize + objectOverhead;
  }

  /**
   * Enhanced set with memory tracking and intelligent indexing
   *
   * @param key The cache key
   * @param value The value to store
   * @param ttl TTL in milliseconds
   * @param options Optional configuration
   */
  public set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTTL,
    options?: {
      priority?: number; // Higher = more important to keep (0-10)
      swr?: boolean; // Enable stale-while-revalidate
    }
  ): void {
    // Modify key for serverless environment if needed
    const envKey = this.getEnvironmentAwareKey(key);

    // Try to clean up on each significant operation
    this.maybeCleanup();

    // Check if we're in circuit breaker mode for this key pattern
    const circuitPattern = this.findMatchingCircuitPattern(key);
    if (circuitPattern) {
      const circuitState = this.circuitStatus.get(circuitPattern);
      if (circuitState?.status === "open") {
        // Circuit is open, don't attempt to set
        return;
      }
    }

    // Calculate entry size with optimized estimation
    const entrySize = this.calculateEntrySize(envKey, value);

    // Remove old entry if exists
    if (this.cache.has(envKey)) {
      const oldEntry = this.cache.get(envKey)!;
      this.estimatedMemoryUsage -= oldEntry.size;
    }

    // In serverless mode, adapt TTL to be appropriate for request lifecycle
    let effectiveTtl = ttl;
    if (this.isServerless) {
      // Cap TTL to the expected function timeout with some margin
      // This prevents wasting memory on entries that will never be used
      effectiveTtl = Math.min(ttl, this.defaultTTL);
    } else {
      // Add jitter to prevent cache stampede (only in non-serverless mode)
      const jitter = Math.random() * 0.1 * ttl; // +/- 10% ttl
      effectiveTtl = ttl + jitter;
    }

    // Create new entry
    const expiresAt = Date.now() + effectiveTtl;
    this.cache.set(envKey, {
      value,
      expiresAt,
      lastAccessed: Date.now(),
      hits: 0,
      size: entrySize,
      priority: options?.priority,
    });

    // Update memory usage tracking
    this.estimatedMemoryUsage += entrySize;

    // Index by prefix for efficient operations
    this.indexByPrefix(envKey);

    // Track key type
    const keyType = this.getKeyTypeFromKey(envKey);
    this.incrementKeyTypeCount(keyType);

    // Ensure cache doesn't exceed size or memory limits
    if (this.estimatedMemoryUsage > this.maxMemoryBytes || this.cache.size > this.maxSize) {
      const memoryPressure = this.estimatedMemoryUsage / this.maxMemoryBytes;
      this.enforceResourceLimits(memoryPressure);
    }
  }

  /**
   * Memoize a function with caching
   * Particularly useful for expensive calculations within a request
   *
   * @param fn The function to memoize
   * @param options Caching options
   * @returns Memoized function
   */
  public memoize<T, Args extends unknown[]>(
    fn: (...args: Args) => T,
    options?: {
      keyPrefix?: string;
      ttl?: number;
      keyGenerator?: (...args: Args) => string;
      priority?: number;
    }
  ): (...args: Args) => T {
    const keyPrefix = options?.keyPrefix || "memo:";
    const ttl = options?.ttl || this.defaultTTL;
    const keyGenerator = options?.keyGenerator || ((...args: Args) => JSON.stringify(args));
    const priority = options?.priority || 5;

    return (...args: Args): T => {
      const cacheKey = `${keyPrefix}${keyGenerator(...args)}`;
      const cached = this.get<T>(cacheKey);

      if (cached !== undefined) {
        return cached;
      }

      const result = fn(...args);
      this.set(cacheKey, result, ttl, { priority });
      return result;
    };
  }

  /**
   * Memoize an async function with caching and race protection
   * @param fn The async function to memoize
   * @param options Caching options
   * @returns Memoized async function
   */
  public memoizeAsync<T, Args extends unknown[]>(
    fn: (...args: Args) => Promise<T>,
    options?: {
      keyPrefix?: string;
      ttl?: number;
      keyGenerator?: (...args: Args) => string;
      priority?: number;
    }
  ): (...args: Args) => Promise<T> {
    const keyPrefix = options?.keyPrefix || "memo:async:";
    const ttl = options?.ttl || this.defaultTTL;
    const keyGenerator = options?.keyGenerator || ((...args: Args) => JSON.stringify(args));
    const priority = options?.priority || 5;

    return async (...args: Args): Promise<T> => {
      const cacheKey = `${keyPrefix}${keyGenerator(...args)}`;
      return this.getAsync(cacheKey, () => fn(...args), ttl, { priority });
    };
  }

  /**
   * Delete a key with efficient cleanup
   * @param key The cache key to delete
   */
  public del(key: string): void {
    // Modify key for serverless environment if needed
    const envKey = this.getEnvironmentAwareKey(key);

    if (this.cache.has(envKey)) {
      const entry = this.cache.get(envKey);
      if (entry) {
        this.notifyEviction(envKey, entry.value, "manual");
      }
      this.removeEntry(envKey);
    }
  }

  /**
   * Complete cache reset
   */
  public flush(): void {
    // Notify about all entries being evicted
    this.cache.forEach((entry, key) => {
      this.notifyEviction(key, entry.value, "manual");
    });

    this.cache.clear();
    this.prefixIndex.clear();
    this.circuitStatus.clear();
    this.hotKeys.clear();
    this.inFlightRequests.clear(); // Clear in-flight requests
    this.estimatedMemoryUsage = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      totalValueSize: 0,
      keyTypeCounts: new Map(),
      circuitBreaks: 0,
      recoveries: 0,
    };
  }

  /**
   * Comprehensive statistics with health assessment
   * @returns Cache statistics and health metrics
   */
  public getStats(): CacheStats {
    const byKeyTypeCount: Record<string, number> = {};
    this.stats.keyTypeCounts.forEach((count, type) => {
      byKeyTypeCount[type] = count;
    });

    // Calculate health score
    const hitRateScore = this.calculateHitRateScore();
    const memoryScore = this.calculateMemoryScore();
    const evictionScore = this.calculateEvictionScore();
    const healthScore = Math.round((hitRateScore + memoryScore + evictionScore) / 3);

    return {
      size: this.cache.size,
      hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
      missRate: this.stats.totalRequests > 0 ? this.stats.misses / this.stats.totalRequests : 0,
      evictionCount: this.stats.evictions,
      totalRequests: this.stats.totalRequests,
      byKeyTypeCount,
      averageValueSize: this.cache.size > 0 ? this.estimatedMemoryUsage / this.cache.size : 0,
      memoryUsage: this.estimatedMemoryUsage,
      healthScore,
    };
  }

  /**
   * Calculate hit rate score component (0-100)
   * @returns Score based on hit rate
   */
  private calculateHitRateScore(): number {
    if (this.stats.totalRequests < 10) return 100; // Not enough data

    const hitRate = this.stats.hits / this.stats.totalRequests;
    if (hitRate > 0.9) return 100;
    if (hitRate > 0.8) return 90;
    if (hitRate > 0.7) return 80;
    if (hitRate > 0.6) return 70;
    if (hitRate > 0.5) return 60;
    if (hitRate > 0.4) return 50;
    if (hitRate > 0.3) return 40;
    if (hitRate > 0.2) return 30;
    if (hitRate > 0.1) return 20;
    return 10;
  }

  /**
   * Calculate memory usage score component (0-100)
   * @returns Score based on memory usage
   */
  private calculateMemoryScore(): number {
    const memoryUsageRatio = this.estimatedMemoryUsage / this.maxMemoryBytes;
    if (memoryUsageRatio < 0.5) return 100;
    if (memoryUsageRatio < 0.6) return 90;
    if (memoryUsageRatio < 0.7) return 80;
    if (memoryUsageRatio < 0.8) return 70;
    if (memoryUsageRatio < 0.85) return 60;
    if (memoryUsageRatio < 0.9) return 50;
    if (memoryUsageRatio < 0.95) return 30;
    return 10;
  }

  /**
   * Calculate eviction score component (0-100)
   * @returns Score based on eviction rate
   */
  private calculateEvictionScore(): number {
    // Compare evictions to cache size for a relative metric
    const evictionRatio = this.cache.size > 0 ? this.stats.evictions / this.cache.size : 0;

    if (evictionRatio < 0.1) return 100;
    if (evictionRatio < 0.2) return 90;
    if (evictionRatio < 0.3) return 80;
    if (evictionRatio < 0.5) return 70;
    if (evictionRatio < 0.7) return 60;
    if (evictionRatio < 1.0) return 50;
    if (evictionRatio < 2.0) return 40;
    if (evictionRatio < 5.0) return 30;
    return 20;
  }

  /**
   * Track growth rate for monitoring with improved stability
   * Avoids extreme values by using minimum time thresholds and capping
   */
  private monitorGrowth(): void {
    const now = Date.now();
    const timeDiffMs = now - this.lastMonitoringCheck;

    // Only calculate if at least 5 seconds have passed to avoid division by tiny numbers
    if (timeDiffMs > 5000) {
      // Calculate growth rate in entries per hour
      const currentSize = this.cache.size;

      // Ensure division by zero is avoided and prevent tiny denominators
      // that would result in astronomical growth rates
      const timeDiffHours = Math.max(timeDiffMs / (60 * 60 * 1000), 0.01);

      // Calculate raw growth rate
      const growthRate = currentSize / timeDiffHours;

      // Cap growth rate at reasonable maximum to avoid absurd values
      const cappedGrowthRate = Math.min(growthRate, 10000);

      // Update tracking variables
      this.growthRate = cappedGrowthRate;
      this.lastMonitoringCheck = now;

      // Log if growing quickly, but only with reasonable values
      if (process.env.NODE_ENV === "development" && cappedGrowthRate > 100) {
        console.info(
          `⚠️ Cache growing at ${cappedGrowthRate.toFixed(2)} entries/hour. Consider increasing maxSize.`
        );
      }
    }
  }

  /**
   * Get memory usage details
   * @returns Memory usage statistics
   */
  public getMemoryUsage(): {
    estimatedBytes: number;
    entryCount: number;
    averageEntrySize: number;
    utilizationPercentage: number;
  } {
    return {
      estimatedBytes: this.estimatedMemoryUsage,
      entryCount: this.cache.size,
      averageEntrySize: this.cache.size > 0 ? this.estimatedMemoryUsage / this.cache.size : 0,
      utilizationPercentage: (this.estimatedMemoryUsage / this.maxMemoryBytes) * 100,
    };
  }

  /**
   * Optimized prefix-based deletion using prefix index
   * @param prefix The prefix to match
   * @returns Number of deleted entries
   */
  public deleteByPrefix(prefix: string): number {
    let deletedCount = 0;

    // Handle request-scoped prefixes if in serverless mode
    const envPrefix =
      this.isServerless && this.requestId ? `req:${this.requestId}:${prefix}` : prefix;

    // Check if we have this prefix indexed for fast access
    const indexedKeys = this.prefixIndex.get(prefix);
    if (indexedKeys) {
      // Fast path - use indexed keys
      const keysToDelete = Array.from(indexedKeys);
      for (const key of keysToDelete) {
        const entry = this.cache.get(key);
        if (entry) {
          this.notifyEviction(key, entry.value, "manual");
        }
        this.removeEntry(key);
        deletedCount++;
      }

      // Clear the prefix set after deletion
      this.prefixIndex.delete(prefix);

      return deletedCount;
    }

    // Slow path - iterate through all keys
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      // Check for matches with both original and serverless prefixes
      if (key.startsWith(envPrefix) || (this.isServerless && key.includes(`:${prefix}`))) {
        keysToDelete.push(key);
      }
    });

    // Delete the collected keys
    for (const key of keysToDelete) {
      const entry = this.cache.get(key);
      if (entry) {
        this.notifyEviction(key, entry.value, "manual");
      }
      this.removeEntry(key);
      deletedCount++;
    }

    return deletedCount;
  }

  /**
   * Get all keys matching a prefix
   * @param prefix The prefix to match
   * @returns Array of matching keys
   */
  public getKeysByPrefix(prefix: string): string[] {
    const result: string[] = [];
    const envPrefix =
      this.isServerless && this.requestId ? `req:${this.requestId}:${prefix}` : prefix;

    // Check indexed prefixes first for efficiency
    const indexedKeys = this.prefixIndex.get(prefix);
    if (indexedKeys) {
      return Array.from(indexedKeys);
    }

    // Fallback to scanning all keys
    this.cache.forEach((_, key) => {
      if (key.startsWith(envPrefix) || (this.isServerless && key.includes(`:${prefix}`))) {
        result.push(key);
      }
    });

    return result;
  }

  /**
   * Apply circuit breaker pattern to prevent cascading failures
   * @param keyPattern Pattern to match for circuit breaking
   * @param durationMs Duration in milliseconds to keep circuit open
   */
  public openCircuit(keyPattern: string, durationMs: number = 30000): void {
    this.circuitStatus.set(keyPattern, {
      status: "open",
      until: Date.now() + durationMs,
    });

    this.stats.circuitBreaks++;

    if (process.env.NODE_ENV === "development") {
      console.info(`🔌 Circuit opened for pattern: ${keyPattern} for ${durationMs}ms`);
    }
  }

  /**
   * Clear circuit breaker for a key pattern
   * @param keyPattern Pattern to reset
   */
  public resetCircuit(keyPattern: string): void {
    if (this.circuitStatus.has(keyPattern)) {
      this.circuitStatus.delete(keyPattern);

      if (process.env.NODE_ENV === "development") {
        console.info(`🔌 Circuit manually reset for pattern: ${keyPattern}`);
      }
    }
  }

  /**
   * Perform a full cleanup - useful for scheduling periodic maintenance
   */
  public performMaintenance(): void {
    this.maybeCleanup(true);
  }

  /**
   * Get the top N most frequently accessed keys
   * @param limit Maximum number of keys to return
   * @returns Array of hot keys with hit counts
   */
  public getHotKeys(limit: number = 10): Array<{ key: string; hits: number }> {
    // Use the entries() method of our LRUMap which returns an iterator
    const entries = Array.from(this.hotKeys.entries());

    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, hits]) => ({ key, hits }));
  }

  /**
   * Check if the cache is operating in serverless mode
   * @returns True if in serverless mode
   */
  public isServerlessMode(): boolean {
    return this.isServerless;
  }

  /**
   * Get the current request ID if in serverless mode
   * @returns Current request ID or null if not in serverless mode
   */
  public getRequestId(): string | null {
    return this.requestId;
  }

  /**
   * Get request duration if in serverless mode
   * @returns Duration in milliseconds or null if not applicable
   */
  public getRequestDuration(): number | null {
    if (this.isServerless && this.requestStartTime) {
      return Date.now() - this.requestStartTime;
    }
    return null;
  }

  /**
   * Get all cache keys
   * @returns Array of all cache keys
   */
  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   * @returns Number of entries in the cache
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Export the cache entries as a serializable object
   * Useful for persisting cache between restarts or for debugging
   * @returns Object with serialized cache entries
   */
  public export(): Record<string, { value: unknown; expiresAt: number }> {
    const result: Record<string, { value: unknown; expiresAt: number }> = {};

    this.cache.forEach((entry, key) => {
      result[key] = {
        value: entry.value,
        expiresAt: entry.expiresAt,
      };
    });

    return result;
  }

  /**
   * Import serialized cache entries
   * @param entries The entries to import
   * @param options Import options
   */
  public import(
    entries: Record<string, { value: unknown; expiresAt: number }>,
    options?: {
      overwrite?: boolean;
      onlyIfFresh?: boolean;
    }
  ): number {
    const overwrite = options?.overwrite ?? true;
    const onlyIfFresh = options?.onlyIfFresh ?? true;
    const now = Date.now();
    let imported = 0;

    for (const [key, entry] of Object.entries(entries)) {
      // Skip expired entries if requested
      if (onlyIfFresh && entry.expiresAt <= now) {
        continue;
      }

      // Skip existing entries if not overwriting
      if (!overwrite && this.cache.has(key)) {
        continue;
      }

      // Import the entry
      this.set(key, entry.value, entry.expiresAt - now);
      imported++;
    }

    return imported;
  }
}

// Create optimized singleton instance
export const cache = new CacheService();

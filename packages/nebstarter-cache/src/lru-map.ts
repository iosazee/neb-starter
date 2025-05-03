/**
 * Item node in the linked list with value and optional weight
 */
interface LRUNode<K, V> {
  key: K;
  value: V;
  weight: number;
  expiresAt?: number; // Optional expiration timestamp
  prev: LRUNode<K, V> | null;
  next: LRUNode<K, V> | null;
}

/**
 * Reason for eviction
 */
type EvictionReason = "capacity" | "manual" | "weight" | "expired";

/**
 * Eviction callback type
 */
type EvictionCallback<K, V> = (key: K, value: V, reason: EvictionReason) => void | Promise<void>;

/**
 * Eviction statistics by reason
 */
interface EvictionStats {
  capacity: number;
  weight: number;
  manual: number;
  expired: number;
  total: number;
}

/**
 * Enhanced LRU (Least Recently Used) Map implementation with doubly linked list
 *
 * Provides a fixed-size map that automatically evicts the least recently used
 * items when it reaches capacity. This implementation adds weight-based limits,
 * eviction callbacks, time-to-live (TTL) expiration, and improved access methods.
 * 
 * Uses a doubly linked list for O(1) node removal and movement, addressing the
 * inefficiency concerns with frequent .delete() and .set() operations.
 */
export class LRUMap<K, V> {
  private capacity: number;
  private maxWeight: number | null = null;
  private currentWeight: number = 0;
  private cache: Map<K, LRUNode<K, V>>;
  private head: LRUNode<K, V> | null = null; // Most recently used
  private tail: LRUNode<K, V> | null = null; // Least recently used
  private evictionCallbacks: EvictionCallback<K, V>[] = [];
  private evictionStats: EvictionStats = {
    capacity: 0,
    weight: 0,
    manual: 0,
    expired: 0,
    total: 0
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Creates a new LRU Map with the specified capacity
   * @param capacity Maximum number of items to store
   * @param options Additional configuration options
   */
  constructor(
    capacity: number,
    options?: {
      maxWeight?: number;
      onEviction?: EvictionCallback<K, V>;
      cleanupIntervalMs?: number;
    }
  ) {
    this.capacity = capacity;
    this.cache = new Map<K, LRUNode<K, V>>();

    // Set optional max weight limit
    if (options?.maxWeight) {
      this.maxWeight = options.maxWeight;
    }

    // Register eviction callback if provided
    if (options?.onEviction) {
      this.evictionCallbacks.push(options.onEviction);
    }

    // Set up automatic cleanup interval for expired items if requested
    if (options?.cleanupIntervalMs) {
      this.cleanupInterval = setInterval(() => {
        this.removeExpiredItems();
      }, options.cleanupIntervalMs);
    }
  }

  /**
   * Clean up resources when no longer needed
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Register an eviction callback
   * @param callback Function to call when items are evicted
   */
  public onEviction(callback: EvictionCallback<K, V>): void {
    this.evictionCallbacks.push(callback);
  }

  /**
   * Notify all callbacks about an eviction
   * @param key The evicted key
   * @param value The evicted value
   * @param reason Why the item was evicted
   */
  private async notifyEviction(key: K, value: V, reason: EvictionReason): Promise<void> {
    // Update eviction statistics
    this.evictionStats[reason]++;
    this.evictionStats.total++;

    // Notify callbacks
    for (const callback of this.evictionCallbacks) {
      try {
        await Promise.resolve(callback(key, value, reason));
      } catch (error) {
        // Prevent callback errors from breaking the LRU map
        console.error("Error in LRU eviction callback:", error);
      }
    }
  }

  /**
   * Move a node to the front of the list (most recently used)
   */
  private moveToFront(node: LRUNode<K, V>): void {
    if (node === this.head) {
      // Already at front
      return;
    }

    // Remove from current position
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (node === this.tail) {
      // Update tail if we're moving the tail node
      this.tail = node.prev;
    }

    // Move to front
    node.prev = null;
    node.next = this.head;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    // If list was empty, this is also the tail
    if (!this.tail) {
      this.tail = node;
    }
  }

  /**
   * Add a new node to the front of the list
   */
  private addToFront(node: LRUNode<K, V>): void {
    if (!this.head) {
      // Empty list
      this.head = node;
      this.tail = node;
      node.prev = null;
      node.next = null;
    } else {
      // Add to head
      node.prev = null;
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
  }

  /**
   * Remove a node from the list
   */
  private removeFromList(node: LRUNode<K, V>): void {
    // Update neighbors
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // This was the head
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // This was the tail
      this.tail = node.prev;
    }

    // Clear references to help garbage collection
    node.prev = null;
    node.next = null;
  }

  /**
   * Gets a value from the map and updates its access order
   * @param key The key to look up
   * @returns The value or undefined if not found or expired
   */
  public get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    // Check if the item has expired
    if (node.expiresAt && node.expiresAt < Date.now()) {
      this.delete(key, "expired");
      return undefined;
    }

    // Move to front (most recently used)
    this.moveToFront(node);
    return node.value;
  }

  /**
   * Look up a value without affecting its position in the LRU order
   * @param key The key to look up
   * @returns The value or undefined if not found or expired
   */
  public peek(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    // Check if the item has expired
    if (node.expiresAt && node.expiresAt < Date.now()) {
      this.delete(key, "expired");
      return undefined;
    }

    return node.value;
  }

  /**
   * Check if an item has expired
   * @param key The key to check
   * @returns True if the item exists and has expired
   */
  private hasExpired(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }
    return !!(node.expiresAt && node.expiresAt < Date.now());
  }

  /**
   * Remove all expired items from the cache
   * @returns Number of items removed
   */
  public removeExpiredItems(): number {
    let removedCount = 0;
    const now = Date.now();
    
    // Create a list of keys to remove to avoid modifying while iterating
    const keysToRemove: K[] = [];
    
    for (const [key, node] of this.cache.entries()) {
      if (node.expiresAt && node.expiresAt < now) {
        keysToRemove.push(key);
      }
    }
    
    // Remove each expired item
    for (const key of keysToRemove) {
      this.delete(key, "expired");
      removedCount++;
    }
    
    return removedCount;
  }

  /**
   * Checks if a key exists in the map and is not expired
   * @param key The key to check
   * @returns True if the key exists and is not expired
   */
  public has(key: K): boolean {
    if (this.hasExpired(key)) {
      this.delete(key, "expired");
      return false;
    }
    return this.cache.has(key);
  }

  /**
   * Sets a value in the map with optional weight and TTL
   * @param key The key to set
   * @param value The value to store
   * @param weightOrTtl Optional weight for size-based limits (defaults to 1) or TTL in milliseconds
   * @param ttlMs Optional time-to-live in milliseconds
   */
  public set(key: K, value: V, weightOrTtl: number = 1, ttlMs?: number): void {
    // Determine if the third parameter is weight or TTL
    let weight = weightOrTtl;
    const expiresAt: number | undefined = ttlMs ? Date.now() + ttlMs : undefined;
    
    // Handle negative or zero weights
    if (weight <= 0) {
      weight = 1;
    }

    // Handle existing key
    if (this.cache.has(key)) {
      const node = this.cache.get(key)!;

      // Update the current weight
      this.currentWeight -= node.weight;
      this.currentWeight += weight;

      // Update the value, weight, and expiration
      node.value = value;
      node.weight = weight;
      node.expiresAt = expiresAt;

      // Move to front (most recently used)
      this.moveToFront(node);

      // Enforce weight limit if needed
      if (this.maxWeight !== null && this.currentWeight > this.maxWeight) {
        this.enforceWeightLimit();
      }

      return;
    }

    // Check if we need to make room for the new item (enforce one limit at a time)
    let evictionNeeded = false;
    
    // First check capacity
    if (this.cache.size >= this.capacity) {
      evictionNeeded = true;
      this.evictLeastRecentlyUsed("capacity");
    }
    
    // Then check weight limit
    if (this.maxWeight !== null && this.currentWeight + weight > this.maxWeight) {
      evictionNeeded = true;
      // Enforce weight limit until we have enough space
      while (this.tail && this.currentWeight + weight > this.maxWeight) {
        this.evictLeastRecentlyUsed("weight");
      }
      
      // If we still can't fit the item, don't add it
      if (this.currentWeight + weight > this.maxWeight) {
        console.warn(
          `LRUMap: Item with weight ${weight} exceeds remaining capacity of ${this.maxWeight - this.currentWeight}`
        );
        return;
      }
    }

    // Create new node
    const newNode: LRUNode<K, V> = {
      key,
      value,
      weight,
      expiresAt,
      prev: null,
      next: null
    };

    // Add to cache and list
    this.cache.set(key, newNode);
    this.addToFront(newNode);
    this.currentWeight += weight;
  }

  /**
   * Evict the least recently used item
   * @param reason The reason for eviction
   */
  private evictLeastRecentlyUsed(reason: EvictionReason): void {
    if (!this.tail) return; // Empty list

    const lruNode = this.tail;
    
    // Update weight
    this.currentWeight -= lruNode.weight;

    // Remove from cache
    this.cache.delete(lruNode.key);
    
    // Remove from linked list
    this.removeFromList(lruNode);
    
    // Notify about eviction (after removal to prevent race conditions)
    void this.notifyEviction(lruNode.key, lruNode.value, reason);
  }

  /**
   * Enforce the weight limit by evicting items until under the limit
   */
  private enforceWeightLimit(): void {
    if (this.maxWeight === null || this.currentWeight <= this.maxWeight) return;

    while (this.tail && this.currentWeight > this.maxWeight) {
      this.evictLeastRecentlyUsed("weight");
    }
  }

  /**
   * Removes a key from the map
   * @param key The key to delete
   * @param reason The reason for deletion (defaults to "manual")
   * @returns True if the key was found and removed
   */
  public delete(key: K, reason: EvictionReason = "manual"): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    // Update weight
    this.currentWeight -= node.weight;

    // Remove from cache
    this.cache.delete(key);
    
    // Remove from linked list
    this.removeFromList(node);

    // Notify about eviction (after removal to prevent race conditions)
    void this.notifyEviction(key, node.value, reason);

    return true;
  }

  /**
   * Clears all entries from the map
   */
  public clear(): void {
    // Notify about all evictions
    this.cache.forEach((node, key) => {
      void this.notifyEviction(key, node.value, "manual");
    });

    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.currentWeight = 0;
  }

  /**
   * Returns an iterator of all entries
   * @returns Iterator of [key, value] pairs
   */
  public entries(): IterableIterator<[K, V]> {
    const entries = Array.from(this.cache.entries()).map(([key, node]): [K, V] => [
      key,
      node.value,
    ]);

    return entries[Symbol.iterator]();
  }

  /**
   * Returns an array of all keys in order from least to most recently used
   * @returns Array of keys
   */
  public keys(): K[] {
    const keys: K[] = [];
    let current = this.tail;
    
    // Start from tail (least recently used) and work toward head
    while (current) {
      keys.push(current.key);
      current = current.prev;
    }
    
    return keys;
  }

  /**
   * Returns an array of all values in LRU order
   * @returns Array of values
   */
  public values(): V[] {
    const values: V[] = [];
    let current = this.tail;
    
    // Start from tail (least recently used) and work toward head
    while (current) {
      values.push(current.value);
      current = current.prev;
    }
    
    return values;
  }

  /**
   * Get eviction statistics
   * @returns Current eviction stats
   */
  public getEvictionStats(): EvictionStats {
    return { ...this.evictionStats };
  }
  
  /**
   * Record an eviction for a specific reason
   * This is primarily for testing and can be used to manually record evictions
   * @param reason The reason for the eviction
   */
  public recordEviction(reason: EvictionReason): void {
    this.evictionStats[reason]++;
    this.evictionStats.total++;
  }

  /**
   * Reset eviction statistics
   */
  public resetEvictionStats(): void {
    this.evictionStats = {
      capacity: 0,
      weight: 0,
      manual: 0,
      expired: 0,
      total: 0
    };
  }

  /**
   * Gets the current number of items in the map
   */
  public get size(): number {
    return this.cache.size;
  }

  /**
   * Gets the current total weight of all items
   */
  public get weight(): number {
    return this.currentWeight;
  }

  /**
   * Gets the maximum weight allowed (if set)
   */
  public get weightCapacity(): number | null {
    return this.maxWeight;
  }

  /**
   * Gets the maximum number of items allowed
   */
  public get itemCapacity(): number {
    return this.capacity;
  }

  /**
   * Debug helper to print the linked list structure
   * @returns String representation of the list from MRU to LRU
   */
  public debug(): string {
    const parts: string[] = [];
    let current = this.head;
    let index = 0;
    
    parts.push(`LRUMap: ${this.cache.size} items, ${this.currentWeight} weight`);
    parts.push('MRU ⟹ LRU:');
    
    while (current) {
      const expiresStr = current.expiresAt 
        ? ` (expires: ${new Date(current.expiresAt).toISOString()})` 
        : '';
      
      parts.push(`  ${index}: ${String(current.key)} [w:${current.weight}]${expiresStr}`);
      current = current.next;
      index++;
    }
    
    return parts.join('\n');
  }

  /**
   * Update the capacity of the LRU map
   * If the new capacity is smaller than the current size,
   * the least recently used items will be evicted.
   *
   * @param newCapacity The new maximum capacity
   */
  public setCapacity(newCapacity: number): void {
    if (newCapacity <= 0) {
      throw new Error("Capacity must be greater than zero");
    }

    this.capacity = newCapacity;

    // Evict if we're over capacity
    while (this.cache.size > this.capacity && this.tail) {
      this.evictLeastRecentlyUsed("capacity");
    }
  }

  /**
   * Update the maximum weight limit
   * If the new limit is smaller than the current total weight,
   * items will be evicted until under the limit.
   *
   * @param maxWeight The new maximum weight (null to remove the limit)
   */
  public setMaxWeight(maxWeight: number | null): void {
    if (maxWeight !== null && maxWeight <= 0) {
      throw new Error("Maximum weight must be greater than zero or null");
    }

    this.maxWeight = maxWeight;

    // Enforce the new limit if needed
    if (maxWeight !== null && this.currentWeight > maxWeight) {
      this.enforceWeightLimit();
    }
  }
}
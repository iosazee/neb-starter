# NEB Starter - Cache Package

## @nebstarter/cache

A lightweight caching solution designed for the NEB Starter Kit that provides memory-based caching with LRU (Least Recently Used) eviction policy.

## Overview

The @nebstarter/cache package provides a simple yet effective caching mechanism that can be used in both web and mobile applications. It implements an LRU (Least Recently Used) algorithm to efficiently manage memory usage.

## Features

- **LRU Algorithm** - Automatically evicts least recently used items when capacity is reached
- **Customizable** - Configurable cache size and TTL (Time To Live)
- **Type Safety** - Written in TypeScript with strong typing
- **Monitoring** - Built-in cache statistics and monitoring

## Usage

### Basic Usage

```typescript
import { Cache } from "nebstarter-cache";

// Create a new cache instance with default options
const cache = new Cache();

// Set a value in the cache
cache.set("key1", "value1");

// Get a value from the cache
const value = cache.get("key1");

// Check if a key exists
const exists = cache.has("key1");

// Delete a key
cache.delete("key1");

// Clear the entire cache
cache.clear();
```

## API Reference

### `Cache` Class

#### Constructor Options

- `maxSize`: Maximum number of items to store (default: 100)
- `ttl`: Default time-to-live in milliseconds (default: 5 minutes)
- `updateAgeOnGet`: Whether to reset TTL on access (default: true)
- `name`: Name for this cache instance (default: "default")

#### Methods

- `set(key, value, options?)`: Store a value in the cache
- `get(key)`: Retrieve a value from the cache
- `has(key)`: Check if a key exists in the cache
- `delete(key)`: Remove a key from the cache
- `clear()`: Remove all items from the cache
- `getStats()`: Get statistics for this cache instance

### Global Functions

- `getCacheStats()`: Get statistics for all cache instances
- `clearAllCaches()`: Clear all cache instances

## Best Practices

- **Appropriate Cache Size**: Choose a cache size based on memory constraints
- **Strategic TTL**: Set TTL values based on how frequently your data changes
- **Cache Invalidation**: Implement proper cache invalidation when data is updated
- **Monitoring**: Regularly check cache hit rates to ensure effectiveness

## Use Cases

- **API Response Caching**: Cache responses from external APIs
- **Database Query Results**: Store frequently accessed database queries
- **Computed Values**: Cache results of expensive computations
- **User Preferences**: Store user settings for quick access

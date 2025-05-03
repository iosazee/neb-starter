/// <reference types="node" />

// Import the existing cache "singleton" instance
import { cache as originalCache } from "@nebstarter/cache";

// Define the type for the cache instance
type CacheType = typeof originalCache;

declare global {
  // eslint-disable-next-line no-var
  var sharedCache: CacheType | undefined;
}

// Use the existing instance if available in global scope, otherwise use the imported one
export const cache = globalThis.sharedCache || originalCache;

// Store in global for persistence across hot reloads in development
if (process.env.NODE_ENV !== "production") {
  globalThis.sharedCache = cache;
}

// Log cache initialization status
// if (process.env.NODE_ENV === "development") {
//   console.log("📦 Shared cache wrapper initialized", {
//     isGlobalInstance: !!globalThis.sharedCache,
//     size: cache.size(),
//     keys: cache.keys().length > 0 ? cache.keys().slice(0, 5) : "empty",
//   });
// }

export default cache;

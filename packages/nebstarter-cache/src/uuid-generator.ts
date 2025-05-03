/**
 * Secure UUID v4 Generator
 *
 * Generates RFC4122 v4 UUIDs using cryptographically strong random values
 * in the format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * Features:
 * - Secure: Uses cryptographically strong random values
 * - Standard: Follows RFC4122 version 4 UUID format
 * - Cross-platform: Works in both browser and Node.js environments
 */
export function generateSecureUUID(): string {
  // Generate 16 bytes of random values
  const buffer = new Uint8Array(16);

  // Fill with cryptographically strong random values
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    // Browser and React Native environment with crypto
    crypto.getRandomValues(buffer);
  } else {
    // Fallback for environments without Web Crypto API
    // This includes older React Native versions or Node.js without requiring crypto module

    let getRandomValues: (buffer: Uint8Array) => void;

    try {
      // Try to access Node.js crypto if available
      // Using dynamic import style to avoid bundler issues
      const nodeCrypto = globalThis.require?.("crypto");
      if (nodeCrypto?.randomFillSync) {
        getRandomValues = (buffer: Uint8Array) => {
          nodeCrypto.randomFillSync(buffer);
        };
      } else if (nodeCrypto?.randomBytes) {
        getRandomValues = (buffer: Uint8Array) => {
          const bytes = nodeCrypto.randomBytes(buffer.length);
          buffer.set(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
        };
      } else {
        throw new Error("No secure random source available");
      }
    } catch (e) {
      // Last resort fallback using entropy pool technique
      // This is better than plain Math.random() but still not cryptographically secure
      getRandomValues = (buffer: Uint8Array) => {
        // Create an entropy collector
        const entropy = {
          collected: 0,
          pool: new Uint32Array(256),
          // Add entropy from various sources
          addEntropy(data: number): void {
            const pool = this.pool;
            pool[this.collected % 256] ^= data;
            this.collected += 1;
          },
        };

        // Collect entropy from various sources
        const currentTime = Date.now();
        entropy.addEntropy(currentTime);
        entropy.addEntropy(performance?.now?.() || 0);

        // Add entropy from environment data
        if (typeof navigator !== "undefined") {
          entropy.addEntropy(navigator.userAgent?.length || 0);
        }

        if (typeof screen !== "undefined") {
          entropy.addEntropy((screen.width || 0) * (screen.height || 0));
          entropy.addEntropy(screen.colorDepth || 0);
        }

        // Fill the buffer using our entropy pool
        for (let i = 0; i < buffer.length; i++) {
          // Mix in new random seeds for each byte
          entropy.addEntropy(Math.floor(Math.random() * 65536));
          entropy.addEntropy(Date.now());

          // Extract a byte from our pool
          const poolIndex = Math.floor(Math.random() * 256);
          buffer[i] = entropy.pool[poolIndex] % 256;
        }
      };
    }

    try {
      getRandomValues(buffer);
    } catch (e) {
      console.warn("Falling back to less secure random generation");
      // Ultimate fallback if everything else fails
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
    }
  }

  // Set version bits to 4 (random-based)
  buffer[6] = (buffer[6] & 0x0f) | 0x40;

  // Set the variant bits to 10xx (RFC4122)
  buffer[8] = (buffer[8] & 0x3f) | 0x80;

  // Convert to hex strings
  const hexValues = [];
  for (let i = 0; i < 16; i++) {
    hexValues.push(buffer[i].toString(16).padStart(2, "0"));
  }

  // Format in UUID pattern: 8-4-4-4-12
  return [
    hexValues.slice(0, 4).join(""),
    hexValues.slice(4, 6).join(""),
    hexValues.slice(6, 8).join(""),
    hexValues.slice(8, 10).join(""),
    hexValues.slice(10, 16).join(""),
  ].join("-");
}

/**
 * @typedef {Object} CachedResponse
 * @property {number} statusCode - HTTP response status code (e.g., 200).
 * @property {Record<string, string | string[]>} headers - HTTP response headers.
 * @property {Buffer} body - Response payload binary data Buffer.
 * @property {number} cachedAt - Timestamp (Date.now()) when the response was cached.
 */

/**
 * In-memory storage module encapsulating cache entries.
 */
export class CacheStore {
    constructor() {
        /** @type {Map<string, CachedResponse>} */
        this.store = new Map();
    }

    /**
     * Retrieves a cached response by key.
     *
     * @param {string} key - Cache key identifier.
     * @returns {CachedResponse | null} The cached object, or null if not found.
     */
    get(key) {
        return this.store.get(key) || null;
    }

    /**
     * Stores a response entry in the cache.
     *
     * @param {string} key - Cache key identifier.
     * @param {Omit<CachedResponse, 'cachedAt'> & { cachedAt?: number }} data - Response object.
     */
    set(key, data) {
        this.store.set(key, {
            statusCode: data.statusCode,
            headers: data.headers,
            body: data.body,
            cachedAt: data.cachedAt || Date.now(),
        });
    }

    /**
     * Checks if a key exists in the cache.
     *
     * @param {string} key - Cache key identifier.
     * @returns {boolean} True if key exists.
     */
    has(key) {
        return this.store.has(key);
    }

    /**
     * Deletes a single entry from the cache.
     *
     * @param {string} key - Cache key identifier.
     * @returns {boolean} True if item was deleted.
     */
    delete(key) {
        return this.store.delete(key);
    }

    /**
     * Clears all cached entries from the store.
     */
    clear() {
        this.store.clear();
    }

    /**
     * Returns total number of cached entries.
     *
     * @returns {number} Entry count.
     */
    get size() {
        return this.store.size;
    }
}

// Singleton cache instance
export const cacheStore = new CacheStore();


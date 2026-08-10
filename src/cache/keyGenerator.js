/**
 * Generates a deterministic cache key based on the incoming request properties.
 *
 * @param {import('http').IncomingMessage} req - Incoming HTTP request.
 * @returns {string} Unique cache key (e.g., "GET:/products?limit=10").
 */
export function generateCacheKey(req) {
    const method = (req.method || 'GET').toUpperCase();
    
    // Safely parse relative request URLs using a dummy base URL
    const url = new URL(req.url || '/', 'http://localhost');

    // Sort query parameter keys for deterministic lookups (?a=1&b=2 matches ?b=2&a=1)
    url.searchParams.sort();

    // Remove trailing slash for path normalization (unless path is '/')
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }

    return `${method}:${pathname}${url.search}`;
}
import http from 'http';
import https from 'https';
import { generateCacheKey } from '../cache/keyGenerator.js';
import { cacheStore } from '../cache/cacheStore.js';

/**
 * Handles incoming HTTP requests, checks cache store for existing responses,
 * proxies cache misses to the target origin server, and caches successful responses.
 *
 * @param {import('http').IncomingMessage} req - Incoming HTTP request.
 * @param {import('http').ServerResponse} res - Outgoing HTTP response.
 * @param {string} origin - Origin target URL (e.g., "https://dummyjson.com").
 */
export function requestHandler(req, res, origin) {
    // 1. Generate Cache Key
    const cacheKey = generateCacheKey(req);

    // 2. Check Cache
    const cachedResponse = cacheStore.get(cacheKey);

    // 3. Cache HIT
    if (cachedResponse) {
        const hitHeaders = {
            ...cachedResponse.headers,
            'X-Cache': 'HIT',
        };
        res.writeHead(cachedResponse.statusCode, hitHeaders);
        res.end(cachedResponse.body);
        return;
    }

    // 4. Cache MISS - Construct Target URL & Upstream Headers
    const targetUrl = new URL(req.url, origin);
    const headers = { ...req.headers };
    headers.host = targetUrl.host;

    const transport = targetUrl.protocol === 'https:' ? https : http;
    const requestOptions = {
        method: req.method,
        headers,
    };

    // 5. Fetch Upstream Origin
    const proxyReq = transport.request(targetUrl, requestOptions, (upstreamRes) => {
        const chunks = [];

        // Collect payload stream chunks into buffer array
        upstreamRes.on('data', (chunk) => {
            chunks.push(chunk);
        });

        // Store complete response in cache on stream end
        upstreamRes.on('end', () => {
            // Only cache successful GET responses (2xx status codes)
            if (req.method === 'GET' && upstreamRes.statusCode >= 200 && upstreamRes.statusCode < 300) {
                const fullBody = Buffer.concat(chunks);
                cacheStore.set(cacheKey, {
                    statusCode: upstreamRes.statusCode,
                    headers: upstreamRes.headers,
                    body: fullBody,
                });
            }
        });

        // Inject X-Cache: MISS header and relay response to client
        const missHeaders = {
            ...upstreamRes.headers,
            'X-Cache': 'MISS',
        };
        res.writeHead(upstreamRes.statusCode, missHeaders);
        upstreamRes.pipe(res);
    });

    // Handle upstream network / connection errors
    proxyReq.on('error', (error) => {
        console.error(`Error forwarding request to ${targetUrl.href}: ${error.message}`);
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Bad Gateway: Unable to reach origin server.\n');
        }
    });

    // Pipe client request payload to proxy request
    req.pipe(proxyReq);
}



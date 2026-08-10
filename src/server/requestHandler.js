import http from 'http';
import https from 'https';

/**
 * Handles incoming HTTP requests and proxies them to the target origin server.
 *
 * @param {import('http').IncomingMessage} req - Incoming HTTP request.
 * @param {import('http').ServerResponse} res - Outgoing HTTP response.
 * @param {string} origin - Origin target URL (e.g., "http://dummyjson.com").
 */
export function requestHandler(req, res, origin) {
    // 1. Construct Target URL
    const targetUrl = new URL(req.url, origin);

    // 2. Prepare headers (override host header to target origin host)
    const headers = { ...req.headers };
    headers.host = targetUrl.host;

    // 3. Choose HTTP or HTTPS transport module based on origin protocol
    const transport = targetUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
        method: req.method,
        headers,
    };

    // 4. Fetch Upstream Origin
    const proxyReq = transport.request(targetUrl, requestOptions, (upstreamRes) => {
        // 5. Relay Response Back (Status Code & Headers)
        res.writeHead(upstreamRes.statusCode, upstreamRes.headers);

        // Forward response payload stream back to client
        upstreamRes.pipe(res);
    });

    // Handle upstream errors (e.g., DNS resolution failure, connection timeout)
    proxyReq.on('error', (error) => {
        console.error(`Error forwarding request to ${targetUrl.href}: ${error.message}`);
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Bad Gateway: Unable to reach origin server.\n');
        }
    });

    // Pipe client request payload to the proxy request
    req.pipe(proxyReq);
}


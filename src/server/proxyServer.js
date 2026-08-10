import http from 'http';
import { requestHandler } from './requestHandler.js';

/**
 * Creates and starts an HTTP proxy server forwarding requests to the target origin.
 *
 * @param {number} port - The port number for the proxy server to listen on.
 * @param {string} origin - The origin server URL to proxy requests to.
 * @returns {http.Server} The created Node.js HTTP server instance.
 */
export function createProxyServer(port, origin) {
    const server = http.createServer((req, res) => {
        requestHandler(req, res, origin);
    });

    server.listen(port, () => {
        console.log(`Proxy server started on port ${port}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use by another application.`);
        } else if (error.code === 'EACCES') {
            console.error(`Permission denied to bind to port ${port}.`);
        } else {
            console.error(`Proxy server error: ${error.message}`);
        }
        process.exit(1);
    });

    const handleShutdown = (signal) => {
        console.log(`\nReceived ${signal}. Closing proxy server...`);
        server.close(() => {
            console.log('Proxy server closed.');
            process.exit(0);
        });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

    return server;
}
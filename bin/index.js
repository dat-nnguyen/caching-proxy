#!/usr/bin/env node

/**
 * @file Entrypoint script for the caching-proxy CLI application.
 */

import { parseOptions } from '../src/cli/optionParser.js';
import { createProxyServer } from '../src/server/proxyServer.js';
import { cacheStore } from '../src/cache/cacheStore.js';

/**
 * Main execution entrypoint for the CLI tool.
 * Parses command-line arguments, clears cache, or starts the proxy server.
 */
function main() {
    try {
        const options = parseOptions();

        if (options.clearCache) {
            cacheStore.clear();
            console.log('Cache cleared successfully.');
            process.exit(0);
        }

        createProxyServer(options.port, options.origin);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
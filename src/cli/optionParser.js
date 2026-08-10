import { Command } from 'commander';

/**
 * @typedef {Object} ParsedOptions
 * @property {number} [port] - The port number for the caching proxy server (1024-65535).
 * @property {string} [origin] - The origin server URL to proxy requests to.
 * @property {boolean} clearCache - Flag indicating whether to clear all cached responses.
 */

/**
 * Parses command-line arguments using Commander and validates the provided options.
 *
 * @param {string[]} [argv=process.argv] - Command-line arguments array.
 * @returns {ParsedOptions} The validated configuration object.
 */
export function parseOptions(argv = process.argv) {
    const program = new Command();

    program
        .name("caching-proxy")
        .description("A CLI tool for proxying requests")
        .version("1.0.0")
        .option("-p, --port <port>", "Port to listen on")
        .option("-o, --origin <url>", "Origin URL to proxy to")
        .option("-c, --clear-cache", "Clear all caches");

    program.parse(argv);

    const options = program.opts();
    if (options.clearCache) return { clearCache: true };

    const port = parseInt(options.port, 10);
    if (!options.port || isNaN(port) || port < 1024 || port > 65535) {
        console.error("Invalid --port. Must be a number between 1024 and 65535.");
        process.exit(1);
    } 

    if (!options.origin) {
        console.error("Invalid --origin. Must be a valid URL.");
        process.exit(1);
    } 

    try {
        new URL(options.origin);
    } catch(error) {
        console.error(`Invalid --origin: ${options.origin}. Must be a valid URL.`);
        process.exit(1);
    }

    return { port, origin: options.origin, clearCache: false };
}
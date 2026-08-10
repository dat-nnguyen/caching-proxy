# Caching Proxy Server CLI

A lightweight, high-performance CLI tool built with Node.js that proxies HTTP requests to an origin server while caching responses in memory. Subsequent identical requests are served directly from the cache, delivering faster response times and reducing upstream server load.

This project is inspired by the [roadmap.sh Caching Server project](https://roadmap.sh/projects/caching-server).

---

## 🚀 Features

- **Dynamic Request Proxying**: Forwards incoming HTTP/HTTPS requests to any target origin server seamlessly.
- **In-Memory Caching**: Caches successful `GET` responses to deliver instant responses on repeated requests.
- **Cache Header Inspection**: Automatically injects custom headers into response objects:
  - `X-Cache: MISS` - Request was fetched from the origin server and saved to cache.
  - `X-Cache: HIT` - Request was served directly from the in-memory cache.
- **Cache Management**: Easily clear all cached data using the `--clear-cache` flag.
- **Graceful Shutdown**: Properly handles process termination signals (`SIGINT` / `SIGTERM`) to close open socket connections smoothly.
- **Port Collision Protection**: Friendly error messages for port conflicts (`EADDRINUSE`) and invalid CLI options.

---

## 📐 Architecture & Workflow

```text
Client Request
      │
      ▼
┌──────────────────────────────────────────┐
│ Generate Cache Key (Method + URL Path)   │
└──────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────┐
│ Check In-Memory Cache Store              │
└──────────────────────────────────────────┘
             /            \
    [Found] /              \ [Not Found]
           /                \
          v                  v
     Cache HIT            Cache MISS
     ─────────            ──────────
     • Header:            • Forward Request to Upstream Origin
       X-Cache: HIT       • Accumulate Payload Chunks into Buffer
     • Return Saved       • Header: X-Cache: MISS
       Response           • Store in Cache Store
                          • Relay Response to Client
```

---

## 🛠️ Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/dat-nnguyen/caching-proxy.git
   cd caching-proxy
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Link CLI binary globally** *(Optional)*:

   ```bash
   npm link
   ```

---

## 💻 Usage

### 1. Start the Caching Proxy Server

Run the proxy server by specifying a listening port and a target origin URL:

```bash
caching-proxy --port 3000 --origin https://dummyjson.com
```

Or using Node directly without linking:

```bash
node bin/index.js --port 3000 --origin https://dummyjson.com
```

### 2. Test Proxy & Caching with `curl`

**First Request (Cache MISS)**:

```bash
curl -i http://localhost:3000/products/1
```

*Output snippet:*

```http
HTTP/1.1 200 OK
X-Cache: MISS
...
{"id":1,"title":"Essence Mascara Lash Princess",...}
```

**Second Request (Cache HIT)**:

```bash
curl -i http://localhost:3000/products/1
```

*Output snippet:*

```http
HTTP/1.1 200 OK
X-Cache: HIT
...
{"id":1,"title":"Essence Mascara Lash Princess",...}
```

### 3. Clear Cache

Clear all stored responses from memory:

```bash
caching-proxy --clear-cache
```

*Output:*

```text
Cache cleared successfully.
```

---

## 📂 Project Structure

```text
caching-proxy/
├── bin/
│   └── index.js              # Executable CLI entrypoint script
├── src/
│   ├── cli/
│   │   └── optionParser.js   # Commander options parser & validation logic
│   ├── server/
│   │   ├── proxyServer.js    # HTTP server lifecycle & signal handling
│   │   └── requestHandler.js # Proxy forwarding & cache HIT/MISS routing
│   └── cache/
│       ├── cacheStore.js     # In-memory Map cache store implementation
│       └── keyGenerator.js   # Deterministic cache key generator
├── package.json
└── README.md
```

---

## 📚 Function & Module Reference

### 1. `bin/index.js` (CLI Entrypoint)

- **`main()`**: The application bootstrapper. Invokes `parseOptions()`, handles the `--clear-cache` administrative action by flushing `cacheStore.clear()`, or launches the proxy server using `createProxyServer(options.port, options.origin)`.

---

### 2. `src/cli/optionParser.js` (CLI Parser)

- **`parseOptions(argv)`**: Configures Commander CLI option definitions (`--port`, `--origin`, `--clear-cache`), parses command-line arguments, and performs validation logic (ensuring integer port between 1024-65535 and valid origin URL format). Throws descriptive `Error` instances if validation fails.

---

### 3. `src/server/proxyServer.js` (Server Lifecycle)

- **`createProxyServer(port, origin)`**: Instantiates a Node.js `http.Server` configured with `requestHandler`. Binds network error handlers (e.g. `EADDRINUSE`, `EACCES`) for user-friendly diagnostics and registers process signal listeners for `SIGINT` (Ctrl+C) and `SIGTERM` to gracefully shutdown active connections.

---

### 4. `src/server/requestHandler.js` (Request Forwarding & Cache Router)

- **`requestHandler(req, res, origin)`**: The primary request processing function. Generates a cache key for incoming requests and checks `cacheStore`:
  - **Cache HIT**: Injects header `X-Cache: HIT` and returns the cached response status code, headers, and body payload immediately.
  - **Cache MISS**: Forwards request method, headers, and payload to the target origin via `http` or `https`. Injects `X-Cache: MISS`, streams response data back to client, and asynchronously accumulates payload chunks into a Buffer to store in `cacheStore`.

---

### 5. `src/cache/keyGenerator.js` (Cache Key Generator)

- **`generateCacheKey(req)`**: Creates a deterministic cache key string (e.g., `GET:/products?limit=10`) based on the request HTTP method, path name (normalized without trailing slashes), and alphabetically sorted search query parameters.

---

### 6. `src/cache/cacheStore.js` (In-Memory Storage)

The `CacheStore` class encapsulates a JavaScript `Map` to manage cached responses in memory:

- **`get(key)`**: Retrieves a cached entry (`{ statusCode, headers, body, cachedAt }`) or returns `null`.
- **`set(key, data)`**: Stores a response object payload Buffer, headers, status code, and current timestamp.
- **`has(key)`**: Returns `true` if a key exists in memory.
- **`delete(key)`**: Deletes a specific cached response from memory.
- **`clear()`**: Flushes all cached entries from memory.
- **`get size()`**: Returns the total count of items stored in the cache.

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).

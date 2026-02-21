# getting started

## prerequisites

- Node.js >= 20.0.0
- npm (ships with Node.js)
- Docker (optional, for containerized runs)

## install and run

```bash
git clone https://github.com/yigitkonur/example-mcp-stateless.git
cd example-mcp-stateless
npm install
npm run dev
```

`npm run dev` uses `tsx` to run `src/server.ts` directly without a build step.

for a production-style run:

```bash
npm run build
npm start
```

### Docker option

build and start:

```bash
docker-compose up -d
```

development mode with live source mounting:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## default endpoints

| method | path | status | description |
|---|---|---|---|
| POST | `/mcp` | 200 | MCP JSON-RPC request handler |
| GET | `/mcp` | 405 | method not allowed |
| DELETE | `/mcp` | 405 | method not allowed |
| GET | `/health` | 200 | liveness check with mode and SDK metadata |

## environment variables

| variable | default | description |
|---|---|---|
| `HOST` | `127.0.0.1` | bind address |
| `PORT` | `1071` | listen port |
| `CORS_ORIGIN` | `*` | allowed CORS origin (`*` allows all) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | rate limit window in milliseconds (15 minutes) |
| `RATE_LIMIT_MAX` | `600` | max requests per window on `/mcp` |

## quick verify

health check:

```bash
curl http://127.0.0.1:1071/health
```

expected response:

```json
{
  "status": "ok",
  "mode": "http-stateless",
  "sdkGeneration": "v2-pre-release",
  "time": "2026-02-21T00:00:00.000Z"
}
```

call the `calculate` tool directly:

```bash
curl -X POST http://127.0.0.1:1071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"calculate","arguments":{"a":8,"b":3,"op":"add"}}}'
```

## next steps

- [02-architecture.md](02-architecture.md) -- understand the stateless lifecycle and module layout
- [03-scaffold-cli.md](03-scaffold-cli.md) -- scaffold a new project from this boilerplate

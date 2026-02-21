# sdk v2 notes

this repo is built exclusively on MCP TypeScript SDK v2 pre-release APIs. it does not support or import any v1 packages.

## v2 packages used

| package | purpose |
|---|---|
| `@modelcontextprotocol/server` | `McpServer`, `registerTool`, `registerResource`, `registerPrompt`, `ResourceTemplate`, `ProtocolError`, `ProtocolErrorCode` |
| `@modelcontextprotocol/node` | `NodeStreamableHTTPServerTransport` |
| `@modelcontextprotocol/express` | `createMcpExpressApp` (Express app factory with host-header binding) |

all three are vendored as local tarballs in `vendor/mcp-sdk-v2/` and referenced via `file:` paths in `package.json`.

## v1 patterns removed

this repo intentionally avoids all v1-era patterns:

- no `@modelcontextprotocol/sdk` package
- no `.tool()`, `.prompt()`, `.resource()` variadic shorthand APIs
- no `McpError` or `ErrorCode` (replaced by `ProtocolError` and `ProtocolErrorCode`)
- no `SSEServerTransport` (server-side legacy SSE transport was removed in v2)
- no server-side auth helpers (removed from SDK scope in v2; use external middleware)

## vendoring strategy

SDK v2 tarballs are packed from a local checkout of `modelcontextprotocol/typescript-sdk` main branch using `pnpm pack`. the pinned commit is recorded in `vendor/mcp-sdk-v2/PINNED_SDK_COMMIT.txt`.

### refresh command

requires a local clone of the official SDK and `pnpm` installed:

```bash
npm run refresh:sdk-v2 -- /path/to/typescript-sdk
```

this runs `scripts/refresh-sdk-v2.sh`, which:

1. installs SDK dependencies with `pnpm`
2. packs `packages/server`, `packages/middleware/node`, `packages/middleware/express`
3. writes tarballs to `vendor/mcp-sdk-v2/`
4. updates `PINNED_SDK_COMMIT.txt` with the current commit hash and date

after refreshing, always run:

```bash
npm install
npm run ci
```

## migration checklist (v1 to v2)

| v1 pattern | v2 replacement |
|---|---|
| `import { McpServer } from '@modelcontextprotocol/sdk/server'` | `import { McpServer } from '@modelcontextprotocol/server'` |
| `server.tool(name, schema, handler)` | `server.registerTool(name, metadata, handler)` |
| `server.resource(name, uri, handler)` | `server.registerResource(name, uri, metadata, handler)` |
| `server.prompt(name, schema, handler)` | `server.registerPrompt(name, metadata, handler)` |
| `new McpError(ErrorCode.X, msg)` | `new ProtocolError(ProtocolErrorCode.X, msg)` |
| `SSEServerTransport` | `NodeStreamableHTTPServerTransport` |
| raw Zod shapes `{ field: z.string() }` | explicit `z.object({ field: z.string() })` |
| `zod` (v3) | `zod/v4` |

## official references

- [SDK readme](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/README.md)
- [server guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md)
- [migration guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration.md)
- [FAQ](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/faq.md)
- [stateless HTTP example](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/examples/server/src/simpleStatelessStreamableHttp.ts)

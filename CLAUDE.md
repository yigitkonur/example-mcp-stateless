# CLAUDE.md

## project

learning-first MCP HTTP stateless boilerplate using TypeScript SDK v2 pre-release APIs, with a scaffold CLI for generating new projects and primitive stubs.

## what's inside

- `src/server.ts` -- Express app, CORS, rate limiting, HTTP route handlers, per-request transport lifecycle
- `src/mcpServer.ts` -- MCP server factory with `calculate`, `describe_stateless_limits` tools, `boilerplate://limitations` and `boilerplate://topic/{topic}` resources, `design-next-tool` prompt
- `src/types.ts` -- Zod v4 schemas (`calculateInputSchema`, `calculateOutputSchema`, `topicSchema`, `planningPromptArgsSchema`), `AppConfig` type, `readAppConfig()` env parser
- `src/cli.ts` -- scaffold CLI with `init` (project bootstrap) and `generate` (tool/resource/prompt stubs) commands
- `scripts/smoke-http.mjs` -- end-to-end HTTP smoke test
- `scripts/refresh-sdk-v2.sh` -- repacks vendored SDK tarballs from a local SDK checkout
- `vendor/mcp-sdk-v2/` -- pinned SDK v2 pre-release tarballs

## transport

stateless mode. `NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined })`. fresh `McpServer` + transport instance per `POST /mcp` request. no sessions, no state, no coordination.

## sdk rules

- use `@modelcontextprotocol/server`, `@modelcontextprotocol/node`, `@modelcontextprotocol/express` -- never `@modelcontextprotocol/sdk`
- use `registerTool`, `registerResource`, `registerPrompt` -- never `.tool()`, `.resource()`, `.prompt()` shorthand
- use `ProtocolError` / `ProtocolErrorCode` -- never `McpError` / `ErrorCode`
- use `z.object(...)` from `zod/v4` for all schemas -- no raw shape objects
- `exactOptionalPropertyTypes` is disabled due to SDK v2 alpha typing friction

## commands

```bash
npm run dev              # run with tsx (no build needed)
npm run build            # clean + compile TypeScript
npm start                # run compiled server
npm run check            # typecheck + lint + format check
npm run smoke            # end-to-end HTTP smoke test
npm run ci               # build + check + smoke (full pipeline)
npm run cli -- init <name> [--install] [--force]   # scaffold new project
npm run create -- generate <tool|resource|prompt> <name> [--force]  # generate stub
npm run refresh:sdk-v2 -- /path/to/typescript-sdk  # refresh vendored tarballs
```

## endpoints

- `POST /mcp` -- MCP JSON-RPC handler (port 1071)
- `GET /mcp` -- 405
- `DELETE /mcp` -- 405
- `GET /health` -- liveness check

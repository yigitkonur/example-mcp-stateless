# MCP HTTP Stateless Boilerplate (TypeScript SDK v2) + Scaffold CLI

## Changelog (Latest First)

- **2026-02-21:** Major rewrite completed for upcoming MCP TypeScript SDK v2 (pre-release), including full v1 removal, stateless transport rewrite, starter CLI, smoke tests, and docs overhaul.
- Full historical details: `CHANGELOG.md`.

## What this repository is

This project is a learning-first boilerplate for building **HTTP stateless MCP servers** with the upcoming **TypeScript SDK v2 API model**.

It includes two things together:

1. A runnable stateless MCP server reference (`src/server.ts`, `src/mcpServer.ts`).
2. A scaffold CLI (`src/cli.ts`) to generate new starter projects and new primitive stubs.

## MCP SDK v2 context (important)

As of **February 21, 2026**, SDK v2 is still in pre-release/main-branch state in official docs context.

This repo intentionally follows v2 primitives now:

- `McpServer` from `@modelcontextprotocol/server`
- `NodeStreamableHTTPServerTransport` from `@modelcontextprotocol/node`
- `createMcpExpressApp` from `@modelcontextprotocol/express`
- `registerTool`, `registerResource`, `registerPrompt`
- `ProtocolError`, `ProtocolErrorCode`
- Zod v4 schemas (`zod/v4`)

Because v2 package publication/distribution is still evolving, this boilerplate pins known-good v2 tarballs in `vendor/mcp-sdk-v2` and tracks their source commit in `vendor/mcp-sdk-v2/PINNED_SDK_COMMIT.txt`.

## Quick start

```bash
git clone https://github.com/yigitkonur/example-mcp-stateless.git
cd example-mcp-stateless
npm install
npm run dev
```

Endpoints:

- MCP: `http://127.0.0.1:1071/mcp`
- Health: `http://127.0.0.1:1071/health`

## Scaffold creator CLI

The CLI is shipped in this repo as `mcp-stateless-starter` (`dist/cli.js` after build).

### Create a new project

```bash
npm run build
npm run cli -- init my-mcp-server --install
```

### Generate new stubs in an existing project

```bash
npm run create -- generate tool my_tool
npm run create -- generate resource my_resource
npm run create -- generate prompt my_prompt
```

### Verified status

This CLI flow was verified end-to-end during this rewrite:

1. `init --install` created a new project with v2 vendor artifacts.
2. Generated project built successfully.
3. Generated project was started and responded to a live MCP tool call (`hello`) on `/mcp`.

Generated project structure (excluding `node_modules`):

```text
my-mcp-generated/
  .gitignore
  README.md
  package.json
  tsconfig.json
  src/server.ts
  vendor/mcp-sdk-v2/
    PINNED_SDK_COMMIT.txt
    modelcontextprotocol-server-2.0.0-alpha.0.tgz
    modelcontextprotocol-node-2.0.0-alpha.0.tgz
    modelcontextprotocol-express-2.0.0-alpha.0.tgz
```

## Current example primitives in this repo

Tools:

- `calculate`
- `describe_stateless_limits`

Resources:

- `boilerplate://limitations`
- `boilerplate://topic/{topic}`

Prompt:

- `design-next-tool`

## Stateless-only scope and limitations

This boilerplate intentionally focuses on HTTP stateless mode:

- no session continuity across requests
- no resumability/event replay in this mode
- no in-memory session workflows
- long-running workflows should use durable external systems

Additional v2 constraints:

- server-side legacy SSE transport removed
- server-side auth helpers removed from SDK scope
- host header and DNS rebinding hardening should be handled by middleware/runtime policy
- `exactOptionalPropertyTypes` is disabled here due current v2 alpha typing friction around optional transport handler fields

## Validation commands

```bash
npm run build
npm run check
npm run smoke
npm run ci
```

`npm run smoke` runs a real MCP call against the built server.

### `mcp-cli` verification (manual)

Create `mcp_servers.json`:

```json
{
  "mcpServers": {
    "stateless-main": {
      "url": "http://127.0.0.1:1071/mcp"
    }
  }
}
```

Then run:

```bash
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json info stateless-main
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json info stateless-main calculate
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json call stateless-main calculate '{"a":8,"b":3,"op":"add","precision":2}'
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json call stateless-main calculate '{"a":"bad","b":3,"op":"add"}'
```

Notes:

- `mcp-cli` currently exposes tool-centric commands (`info`, `call`, `grep`).
- prompts/resources/templates can be validated using direct MCP JSON-RPC calls to `POST /mcp`.

## SDK tarball refresh

If you have a local checkout of official SDK `main`:

```bash
npm run refresh:sdk-v2 -- ../typescript-sdk
```

This repacks server/node/express tarballs and updates pinned commit metadata.

## Documentation index

- `docs/README.md`
- `docs/V2_SDK_OVERVIEW.md`
- `docs/CLI_SCAFFOLDER.md`
- `docs/HTTP_STATELESS_ARCHITECTURE.md`

## Official references

- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/README.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/migration.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/faq.md
- https://github.com/modelcontextprotocol/typescript-sdk/blob/main/examples/server/src/simpleStatelessStreamableHttp.ts

## License

MIT

# Changelog

## 2026-02-21 - Rename: example-mcp-server-http-stateless -> example-mcp-stateless

### Refactor

- Renamed repository and all internal identifiers from `example-mcp-server-http-stateless` / `mcp-http-stateless-v2-boilerplate` to `example-mcp-stateless`.
- Updated `package.json` `name` field.
- Updated `package-lock.json` `name` fields.
- Updated MCP server `name` identifier in `src/mcpServer.ts`.

## 2026-02-21 - Documentation IA and quality reorganization

### Documentation improvements

- Reorganized documentation into a clearer information architecture:
  - `README.md` as concise entry point
  - `docs/README.md` as docs hub with reading order and index
  - focused guides for SDK model, CLI workflow, and stateless architecture
- Standardized tone, section ordering, and navigation links across all docs pages.
- Tightened command examples and validation instructions for easier copy/paste usage.

## 2026-02-21 - Docs rewrite and scaffold CLI re-validation

### Documentation

- Rewrote `README.md` structure with changelog-first layout.
- Recreated docs from scratch:
  - `docs/README.md`
  - `docs/V2_SDK_OVERVIEW.md`
  - `docs/CLI_SCAFFOLDER.md`
  - `docs/HTTP_STATELESS_ARCHITECTURE.md`

### Validation updates

- Re-ran scaffold CLI end-to-end:
  - `init --install`
  - generated project build
  - live MCP tool call verification

## 2026-02-21 - Major rewrite for upcoming TypeScript SDK v2

### Rewritten

- Replaced v1 `@modelcontextprotocol/sdk` architecture with v2 package split:
  - `@modelcontextprotocol/server`
  - `@modelcontextprotocol/node`
  - `@modelcontextprotocol/express`
- Replaced legacy `.tool/.resource/.prompt` usage with:
  - `registerTool`
  - `registerResource`
  - `registerPrompt`
- Replaced `McpError`/`ErrorCode` style with `ProtocolError`/`ProtocolErrorCode`.

### Added

- New starter CLI (`src/cli.ts`) with:
  - `init <project-name> [--install] [--force]`
  - `generate <tool|resource|prompt> <name> [--force]`
- Learning docs:
  - `docs/README.md`
  - `docs/V2_SDK_OVERVIEW.md`
  - `docs/CLI_SCAFFOLDER.md`
  - `docs/HTTP_STATELESS_ARCHITECTURE.md`
- End-to-end smoke test for MCP call path:
  - `scripts/smoke-http.mjs`
- SDK v2 pre-release repack script:
  - `scripts/refresh-sdk-v2.sh`
- Vendored pinned v2 artifacts:
  - `vendor/mcp-sdk-v2/*`

### Cleaned up

- Removed old oversized runtime implementation and stale v1 behavior.
- Simplified compose files and removed unused runtime env entries.
- Added CI smoke step after build/lint/typecheck/format checks.

### Validation performed

- `npm run ci` in this repository (build + typecheck + lint + format + smoke).
- Generated starter project via CLI, installed dependencies, built it, and verified a live tool call over `/mcp`.
- `mcp-cli` verification flow on both main example server and scaffolded server:
  - connect
  - inventory + schema inspect
  - valid and invalid tool calls

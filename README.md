# example-mcp-stateless

learning-first MCP boilerplate for HTTP stateless servers using TypeScript SDK v2 pre-release.

> part of a series: [stdio](https://github.com/yigitkonur/example-mcp-stdio) · **stateless** (you are here) · [stateful](https://github.com/yigitkonur/example-mcp-stateful) · [sse](https://github.com/yigitkonur/example-mcp-sse)

## what it does

- runs a stateless MCP server where every request gets a fresh `McpServer` instance -- no sessions, no state, no coordination
- registers example tools (`calculate`, `describe_stateless_limits`), resources (`boilerplate://limitations`, `boilerplate://topic/{topic}`), and a prompt (`design-next-tool`)
- includes a scaffold CLI to bootstrap new projects and generate tool/resource/prompt stubs
- vendors SDK v2 pre-release tarballs for reproducible builds
- ships with Docker support, CI workflow, and a smoke test

## quick start

```bash
git clone https://github.com/yigitkonur/example-mcp-stateless.git
cd example-mcp-stateless
npm install
npm run dev
```

the server starts at `http://127.0.0.1:1071/mcp`. verify with:

```bash
curl http://127.0.0.1:1071/health
```

Docker alternative:

```bash
docker-compose up -d
```

## scaffold cli

build the CLI first, then scaffold a new project:

```bash
npm run build
npm run cli -- init my-mcp-server --install
```

generate stubs inside an existing project:

```bash
npm run create -- generate tool my_tool
npm run create -- generate resource my_resource
npm run create -- generate prompt my_prompt
```

full reference: [docs/03-scaffold-cli.md](docs/03-scaffold-cli.md)

## documentation

| document | description |
|---|---|
| [docs/01-getting-started.md](docs/01-getting-started.md) | install, run, configure, verify |
| [docs/02-architecture.md](docs/02-architecture.md) | module layout, stateless pattern, endpoint contract |
| [docs/03-scaffold-cli.md](docs/03-scaffold-cli.md) | `init` and `generate` command reference |
| [docs/04-sdk-v2-notes.md](docs/04-sdk-v2-notes.md) | v2 packages, vendoring, migration from v1 |
| [docs/05-validation.md](docs/05-validation.md) | CI breakdown, smoke test, mcp-cli verification |

## sdk v2 context

this repo tracks MCP TypeScript SDK v2 in pre-release form. it uses the split package model (`@modelcontextprotocol/server`, `@modelcontextprotocol/node`, `@modelcontextprotocol/express`) and the `registerTool`/`registerResource`/`registerPrompt` APIs with Zod v4 schemas. tarballs are vendored in `vendor/mcp-sdk-v2/` for reproducibility.

## license

MIT

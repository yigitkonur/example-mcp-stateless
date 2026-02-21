# architecture

## module layout

| file | purpose |
|---|---|
| `src/server.ts` | Express app setup, CORS, rate limiting, HTTP route handlers, transport lifecycle |
| `src/mcpServer.ts` | MCP server factory (`createStatelessLearningServer`) -- registers all tools, resources, and prompts |
| `src/types.ts` | Zod schemas for tool input/output, prompt args, topic params, and `AppConfig` with env parsing |
| `src/cli.ts` | scaffold CLI with `init` and `generate` commands |

### src/server.ts

creates the Express app via `createMcpExpressApp`, configures CORS and rate limiting, and defines four routes. the `POST /mcp` handler is the core: it creates a fresh `McpServer` and `NodeStreamableHTTPServerTransport` per request, connects them, handles the request, then tears down both on completion.

### src/mcpServer.ts

exports `createStatelessLearningServer()` which returns a configured `McpServer` instance with:

- **tools**: `calculate` (arithmetic with structured output and progress notifications), `describe_stateless_limits` (returns trade-off notes)
- **resources**: `boilerplate://limitations` (static markdown), `boilerplate://topic/{topic}` (parameterized via `ResourceTemplate`, topics: transport, tools, prompts, resources)
- **prompt**: `design-next-tool` (generates a tool design plan for a given domain)

### src/types.ts

defines all Zod schemas (`calculateInputSchema`, `calculateOutputSchema`, `topicSchema`, `planningPromptArgsSchema`), the `AppConfig` type, and `readAppConfig()` which parses environment variables with fallback defaults.

## the stateless pattern

the core idea: every `POST /mcp` request gets a completely independent server instance. no memory is shared between requests.

the per-request lifecycle:

```
create McpServer
  -> create NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    -> server.connect(transport)
      -> transport.handleRequest(req, res, req.body)
        -> response sent
          -> transport.close() + server.close()
```

`sessionIdGenerator: undefined` tells the SDK this is stateless mode -- no session IDs are generated or expected.

the `closeAll()` helper guarantees cleanup runs exactly once, triggered either by normal completion or by the response `close` event (client disconnect).

## endpoint contract

| method | path | behavior |
|---|---|---|
| `POST /mcp` | MCP JSON-RPC handler. accepts single or batch requests. returns `application/json` or `text/event-stream`. |
| `GET /mcp` | returns 405 with JSON-RPC error body (`-32000`, "Use POST /mcp") |
| `DELETE /mcp` | returns 405 with JSON-RPC error body (`-32000`, "Use POST /mcp") |
| `GET /health` | returns `{ status, mode, sdkGeneration, time }` |

rate limiting applies to all `/mcp` methods. CORS is configured globally with MCP-specific headers (`mcp-protocol-version`, `mcp-session-id`).

## trade-offs and mitigations

| trade-off | mitigation |
|---|---|
| no resumability or event replay across requests | use stateful mode with a durable event store if replay is needed |
| no in-memory session affinity | externalize session state to a database or cache |
| long-running operations are not request-bound | queue async work and poll via a task/status endpoint |
| no server-initiated push between requests | client polls or switches to stateful/SSE transport |

## design rationale

- **scaling**: no session affinity means any instance can handle any request. horizontal scaling and load balancing work without sticky sessions.
- **isolation**: request-scoped server instances prevent cross-request state leaks and simplify error recovery.
- **simplicity**: the create-connect-handle-teardown pattern is easy to reason about and debug.
- **`exactOptionalPropertyTypes` disabled**: current SDK v2 alpha typings have friction with optional transport handler fields. this flag should be revisited as upstream typings stabilize.

## next steps

- [03-scaffold-cli.md](03-scaffold-cli.md) -- use the CLI to scaffold projects that follow this pattern
- [04-sdk-v2-notes.md](04-sdk-v2-notes.md) -- SDK v2 package details and migration notes

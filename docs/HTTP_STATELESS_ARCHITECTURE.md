# HTTP Stateless Architecture Notes

## Runtime pattern in this repository

For each `POST /mcp` request:

1. create fresh `McpServer`
2. create fresh `NodeStreamableHTTPServerTransport` with `sessionIdGenerator: undefined`
3. connect server to transport
4. handle request
5. close transport and server

This avoids request-to-request server state coupling.

## Why stateless

- simple horizontal scaling model
- no session affinity requirements
- predictable request isolation

## Trade-offs

- no resumability or replay in stateless mode
- no in-memory multi-step session workflow
- durable background workflows require external systems

## Endpoint behavior in this repository

- `POST /mcp`: MCP request handling
- `GET /mcp`: explicit `405`
- `DELETE /mcp`: explicit `405`
- `GET /health`: health payload

## Current known constraint

`exactOptionalPropertyTypes` is disabled in this repository due current v2 alpha typing friction around optional transport handler fields.

Revisit this flag once upstream typings stabilize.

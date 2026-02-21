# validation

## root validation

the `ci` script runs the full validation pipeline:

```bash
npm run ci
```

this executes three stages in order:

| stage | command | what it checks |
|---|---|---|
| build | `npm run build` | clean compile via `tsc` (runs `rimraf dist .tsbuildinfo` first) |
| check | `npm run check` | type checking (`tsc --noEmit`), linting (`eslint .`), formatting (`prettier --check .`) |
| smoke | `npm run smoke` | end-to-end HTTP smoke test against a live server instance |

individual commands:

```bash
npm run build          # compile TypeScript to dist/
npm run typecheck      # type check without emitting
npm run lint           # lint with eslint
npm run format:check   # verify formatting with prettier
npm run smoke          # run scripts/smoke-http.mjs
```

### smoke test details

`scripts/smoke-http.mjs` starts the compiled server on a random port (`PORT=11971` by default), waits for the `/health` endpoint, then sends a `tools/call` request for the `calculate` tool (`8 + 3`). it verifies the response contains `= 11`. the server process is killed after the test.

## generated project validation

after scaffolding a project with `init`:

```bash
cd my-mcp-server
npm run build
npm start
```

verify the generated `hello` tool responds:

```bash
curl -X POST http://127.0.0.1:1071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"hello","arguments":{"name":"World"}}}'
```

## mcp-cli verification

create a config file `mcp_servers.json`:

```json
{
  "mcpServers": {
    "stateless-main": {
      "url": "http://127.0.0.1:1071/mcp"
    }
  }
}
```

start the server in one terminal, then run these commands in another:

```bash
# list server capabilities
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json info stateless-main

# inspect the calculate tool
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json info stateless-main calculate

# call calculate with valid input
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json call stateless-main calculate '{"a":8,"b":3,"op":"add","precision":2}'

# call calculate with invalid input (should return validation error)
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json call stateless-main calculate '{"a":"bad","b":3,"op":"add"}'
```

note: `mcp-cli` is currently tool-centric. for prompts and resources, use direct JSON-RPC calls to `POST /mcp`.

## primitive-level checks

### tools

```bash
# calculate -- valid
curl -s -X POST http://127.0.0.1:1071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"calculate","arguments":{"a":10,"b":5,"op":"multiply","precision":0}}}'

# describe_stateless_limits
curl -s -X POST http://127.0.0.1:1071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"describe_stateless_limits","arguments":{}}}'
```

### resources

```bash
# read boilerplate://limitations
curl -s -X POST http://127.0.0.1:1071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"resources/read","params":{"uri":"boilerplate://limitations"}}'

# read boilerplate://topic/transport
curl -s -X POST http://127.0.0.1:1071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"resources/read","params":{"uri":"boilerplate://topic/transport"}}'
```

### prompts

```bash
# get design-next-tool prompt
curl -s -X POST http://127.0.0.1:1071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"prompts/get","params":{"name":"design-next-tool","arguments":{"domain":"commerce"}}}'
```

## release checklist

1. `npm run ci` passes (build + check + smoke)
2. all example primitives respond correctly (tools, resources, prompts)
3. `init` generates a project that builds and starts without errors
4. `generate` creates valid stub files for each primitive type
5. Docker build succeeds: `docker-compose build`
6. vendored SDK tarballs match `PINNED_SDK_COMMIT.txt`
7. documentation reflects current API surface and endpoints

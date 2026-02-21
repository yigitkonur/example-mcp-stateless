# scaffold CLI

the CLI (`src/cli.ts`) bootstraps new MCP stateless projects and generates tool/resource/prompt stub files.

binary name after build: `mcp-stateless-starter` (mapped to `dist/cli.js` in `package.json` `bin`).

## `init` command

creates a new project directory with a working stateless MCP server.

```bash
npm run build
npm run cli -- init <project-name> [--install] [--force]
```

| flag | effect |
|---|---|
| `--install` | runs `npm install` in the generated project after scaffolding |
| `--force` | allows writing into a non-empty directory |

example:

```bash
npm run cli -- init my-mcp-server --install
```

### what `init` generates

```
my-mcp-server/
  .gitignore
  README.md
  package.json
  tsconfig.json
  src/
    server.ts
  vendor/
    mcp-sdk-v2/
```

- `src/server.ts` -- a single-file stateless MCP server with a sample `hello` tool, using the same create-connect-handle-teardown pattern as the reference server
- `package.json` -- pre-configured with SDK v2 vendored dependencies, `dev`/`build`/`start` scripts
- `vendor/mcp-sdk-v2/` -- copied from this boilerplate's vendored tarballs

## `generate` command

adds a stub file for a tool, resource, or prompt inside `src/tools/`, `src/resources/`, or `src/prompts/`.

```bash
npm run create -- generate <tool|resource|prompt> <name> [--force]
```

| flag | effect |
|---|---|
| `--force` | overwrites an existing file with the same name |

examples:

```bash
npm run create -- generate tool invoice_total
npm run create -- generate resource policy_docs
npm run create -- generate prompt onboarding_plan
```

### generated file patterns

**tool** (`src/tools/invoice-total.ts`):

```typescript
import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

export function registerInvoiceTotalTool(server: McpServer): void {
  server.registerTool(
    'invoice-total',
    {
      description: 'TODO: describe invoice-total',
      inputSchema: z.object({}),
    },
    async () => ({ content: [{ type: 'text', text: 'TODO' }] }),
  );
}
```

**resource** (`src/resources/policy-docs.ts`):

```typescript
import type { McpServer, ReadResourceResult } from '@modelcontextprotocol/server';

export function registerPolicyDocsResource(server: McpServer): void {
  server.registerResource(
    'policy-docs',
    'boilerplate://policy-docs',
    { title: 'PolicyDocs', description: 'TODO: describe resource policy-docs', mimeType: 'text/plain' },
    async (uri): Promise<ReadResourceResult> => ({
      contents: [{ uri: uri.href, text: 'TODO: implement policy-docs resource' }],
    }),
  );
}
```

**prompt** (`src/prompts/onboarding-plan.ts`):

```typescript
import type { GetPromptResult, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

export function registerOnboardingPlanPrompt(server: McpServer): void {
  server.registerPrompt(
    'onboarding-plan',
    { title: 'OnboardingPlan', description: 'TODO: describe prompt onboarding-plan', argsSchema: z.object({}) },
    (): GetPromptResult => ({
      messages: [{ role: 'user', content: { type: 'text', text: 'TODO: implement prompt body' } }],
    }),
  );
}
```

## validation workflow for generated projects

after running `init`:

```bash
cd my-mcp-server
npm run build
npm start
```

verify with curl:

```bash
curl -X POST http://127.0.0.1:1071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"hello","arguments":{"name":"World"}}}'
```

or with mcp-cli:

```bash
MCP_NO_DAEMON=1 mcp-cli -c mcp_servers.json call my-server hello '{"name":"World"}'
```

## extension guidance

1. generate stubs with the `generate` command
2. fill in the `TODO` placeholders with real logic and schemas
3. import and call the `register*` function from your server factory
4. rebuild and verify

## next steps

- [04-sdk-v2-notes.md](04-sdk-v2-notes.md) -- SDK v2 API details relevant to generated code
- [05-validation.md](05-validation.md) -- full validation and release workflow

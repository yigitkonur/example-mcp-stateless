import { randomUUID } from 'node:crypto';

import {
  McpServer,
  ProtocolError,
  ProtocolErrorCode,
  ResourceTemplate,
  type CallToolResult,
  type GetPromptResult,
  type ReadResourceResult,
} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import {
  calculateInputSchema,
  calculateOutputSchema,
  planningPromptArgsSchema,
  topicSchema,
} from './types.js';

const TOPIC_NOTES: Record<string, string> = {
  transport:
    '- Stateless mode: `sessionIdGenerator: undefined`\n- Handle each POST independently\n- Keep cleanup request-scoped',
  tools:
    '- Use `registerTool` (not `.tool`)\n- Use `z.object(...)` schemas\n- Throw `ProtocolError` for protocol-facing failures',
  prompts:
    '- Use `registerPrompt` with `argsSchema`\n- Keep prompts focused and reusable\n- Prefer explicit constraints in prompt args',
  resources:
    '- Use `registerResource` with required metadata object\n- Use `ResourceTemplate` for parameterized URIs\n- Keep resources side-effect free',
};

function calculate(a: number, b: number, op: 'add' | 'subtract' | 'multiply' | 'divide'): number {
  switch (op) {
    case 'add':
      return a + b;
    case 'subtract':
      return a - b;
    case 'multiply':
      return a * b;
    case 'divide': {
      if (b === 0) {
        throw new ProtocolError(
          ProtocolErrorCode.InvalidParams,
          'Division by zero is not allowed.',
        );
      }
      return a / b;
    }
  }
}

export function createStatelessLearningServer(): McpServer {
  const server = new McpServer(
    {
      name: 'example-mcp-stateless',
      version: '2.0.0-alpha.0',
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  server.registerTool(
    'calculate',
    {
      title: 'Calculator',
      description: 'Perform a stateless arithmetic operation.',
      inputSchema: calculateInputSchema,
      outputSchema: calculateOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ a, b, op, precision }, ctx): Promise<CallToolResult> => {
      const progressToken = randomUUID();

      await ctx.mcpReq.log('info', {
        tool: 'calculate',
        operation: op,
        requestId: ctx.mcpReq.id,
      });

      await ctx.mcpReq.notify({
        method: 'notifications/progress',
        params: { progressToken, progress: 30, total: 100 },
      });

      const raw = calculate(a, b, op);
      const result = Number.parseFloat(raw.toFixed(precision));
      const symbol = op === 'add' ? '+' : op === 'subtract' ? '-' : op === 'multiply' ? '×' : '÷';
      const expression = `${a} ${symbol} ${b}`;

      await ctx.mcpReq.notify({
        method: 'notifications/progress',
        params: { progressToken, progress: 100, total: 100 },
      });

      const output = { expression, result, precision };

      return {
        content: [
          {
            type: 'text',
            text: `${expression} = ${result}`,
          },
        ],
        structuredContent: output,
      };
    },
  );

  server.registerTool(
    'describe_stateless_limits',
    {
      description: 'Return practical trade-offs of stateless Streamable HTTP.',
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (_args, ctx): Promise<CallToolResult> => {
      await ctx.mcpReq.log('debug', {
        tool: 'describe_stateless_limits',
      });

      return {
        content: [
          {
            type: 'text',
            text: [
              'Stateless MCP trade-offs:',
              '1) No resumability/event replay across requests.',
              '2) No in-memory session affinity.',
              '3) Long-running operations should be externalized (tasks queue or durable store).',
            ].join('\n'),
          },
        ],
      };
    },
  );

  server.registerResource(
    'limitations',
    'boilerplate://limitations',
    {
      title: 'Stateless Limitations',
      description: 'Practical limits and design constraints of HTTP stateless MCP servers.',
      mimeType: 'text/markdown',
    },
    async (): Promise<ReadResourceResult> => ({
      contents: [
        {
          uri: 'boilerplate://limitations',
          mimeType: 'text/markdown',
          text: [
            '# Stateless MCP Limits',
            '',
            '- No server-managed session continuity across requests.',
            '- Resumability/event replay requires stateful mode + event store.',
            '- Server-side SSE transport was removed in v2; use Streamable HTTP.',
            '- Server auth is intentionally out-of-scope in SDK v2; use external auth middleware.',
          ].join('\n'),
        },
      ],
    }),
  );

  server.registerResource(
    'topic-notes',
    new ResourceTemplate('boilerplate://topic/{topic}', {
      list: async () => ({
        resources: Object.keys(TOPIC_NOTES).map((topic) => ({
          uri: `boilerplate://topic/${topic}`,
          name: topic,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    {
      title: 'Topic Notes',
      description: 'Focused notes for each MCP server building block.',
      mimeType: 'text/markdown',
    },
    async (uri, args): Promise<ReadResourceResult> => {
      const parsed = topicSchema.safeParse(args);
      const topicKey = parsed.success ? parsed.data.topic.toLowerCase() : '';
      const body =
        TOPIC_NOTES[topicKey] || '- Unknown topic. Try: transport, tools, prompts, resources.';

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: `# ${topicKey || 'unknown'}\n\n${body}`,
          },
        ],
      };
    },
  );

  server.registerPrompt(
    'design-next-tool',
    {
      title: 'Design Next Tool',
      description: 'Generate a concrete plan for the next tool in a stateless MCP server.',
      argsSchema: planningPromptArgsSchema,
    },
    ({ domain, constraints }): GetPromptResult => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Design one high-value MCP tool for the domain: ${domain}.`,
              'Keep it stateless and HTTP-first.',
              constraints ? `Constraints: ${constraints}` : 'Constraints: none provided.',
              'Return tool name, input schema, output schema, and failure cases.',
            ].join('\n'),
          },
        },
      ],
    }),
  );

  return server;
}

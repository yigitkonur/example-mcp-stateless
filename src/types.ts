import * as z from 'zod/v4';

export const calculateInputSchema = z.object({
  a: z.number().describe('First number'),
  b: z.number().describe('Second number'),
  op: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('Operation to execute'),
  precision: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe('Decimal precision for the numeric result'),
});

export const calculateOutputSchema = z.object({
  expression: z.string(),
  result: z.number(),
  precision: z.number().int(),
});

export const topicSchema = z.object({
  topic: z.string().min(2).describe('Topic key (for example: transport, tools, prompts)'),
});

export const planningPromptArgsSchema = z.object({
  domain: z.string().describe('Domain for the server (for example: CRM, commerce, docs)'),
  constraints: z
    .string()
    .optional()
    .describe('Optional constraints such as stateless-only, read-only tools, etc.'),
});

export type AppConfig = {
  host: string;
  port: number;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
};

const DEFAULTS: AppConfig = {
  host: '127.0.0.1',
  port: 1071,
  corsOrigin: '*',
  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 600,
};

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function readAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  return {
    host: env['HOST'] || DEFAULTS.host,
    port: parsePositiveInt(env['PORT'], DEFAULTS.port),
    corsOrigin: env['CORS_ORIGIN'] || DEFAULTS.corsOrigin,
    rateLimitWindowMs: parsePositiveInt(env['RATE_LIMIT_WINDOW_MS'], DEFAULTS.rateLimitWindowMs),
    rateLimitMax: parsePositiveInt(env['RATE_LIMIT_MAX'], DEFAULTS.rateLimitMax),
  };
}

export function methodNotAllowedBody(method: string): Record<string, unknown> {
  return {
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: `HTTP ${method} is not supported in stateless mode. Use POST /mcp.`,
    },
    id: null,
  };
}

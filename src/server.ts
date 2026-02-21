import { randomUUID } from 'node:crypto';
import type { Server as HttpServer } from 'node:http';

import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import cors from 'cors';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

import { createStatelessLearningServer } from './mcpServer.js';
import { methodNotAllowedBody, readAppConfig } from './types.js';

const config = readAppConfig(process.env);

const app = createMcpExpressApp({ host: config.host });

app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'mcp-protocol-version', 'mcp-session-id'],
    exposedHeaders: ['mcp-session-id', 'mcp-protocol-version'],
    maxAge: 86_400,
  }),
);

app.use(
  '/mcp',
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    mode: 'http-stateless',
    sdkGeneration: 'v2-pre-release',
    time: new Date().toISOString(),
  });
});

app.post('/mcp', async (req: Request, res: Response) => {
  const requestId = randomUUID();
  const server = createStatelessLearningServer();

  const transport = new NodeStreamableHTTPServerTransport();

  let closed = false;
  const closeAll = async (): Promise<void> => {
    if (closed) {
      return;
    }

    closed = true;
    await Promise.allSettled([transport.close(), server.close()]);
  };

  res.on('close', () => {
    void closeAll();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    await closeAll();

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[${requestId}] Failed to handle /mcp request: ${message}\n`);
  }
});

app.get('/mcp', (req: Request, res: Response) => {
  res.status(405).json(methodNotAllowedBody(req.method));
});

app.delete('/mcp', (req: Request, res: Response) => {
  res.status(405).json(methodNotAllowedBody(req.method));
});

const httpServer: HttpServer = app.listen(config.port, config.host, () => {
  process.stdout.write(
    `MCP stateless server ready at http://${config.host}:${String(config.port)}/mcp (SDK v2 pre-release)\n`,
  );
});

async function shutdown(signal: string): Promise<void> {
  process.stdout.write(`Received ${signal}. Shutting down...\n`);

  await new Promise<void>((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  process.stdout.write('Shutdown complete.\n');
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    void shutdown(signal).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Graceful shutdown failed: ${message}\n`);
      process.exitCode = 1;
    });
  });
}

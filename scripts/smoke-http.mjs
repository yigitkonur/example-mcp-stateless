import { spawn } from 'node:child_process';

const port = Number.parseInt(process.env.PORT || '11971', 10);
const host = '127.0.0.1';
const baseUrl = `http://${host}:${String(port)}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(timeoutMs = 15_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // server not ready yet
    }

    await sleep(200);
  }

  throw new Error('Timed out waiting for /health endpoint');
}

async function postRpc(payload) {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)} from /mcp`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  if (contentType.includes('text/event-stream')) {
    const raw = await response.text();
    const dataLines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trim())
      .filter(Boolean);

    const parsed = dataLines.map((line) => JSON.parse(line));
    if (parsed.length === 1) {
      return parsed[0];
    }

    return parsed;
  }

  throw new Error(`Unexpected content-type: ${contentType}`);
}

function assertCalculateResult(rpcResponse) {
  if (rpcResponse?.error) {
    throw new Error(`RPC error: ${JSON.stringify(rpcResponse.error)}`);
  }

  const text = rpcResponse?.result?.content?.[0]?.text;
  if (typeof text !== 'string' || !text.includes('= 11')) {
    throw new Error(`Unexpected tool result: ${JSON.stringify(rpcResponse)}`);
  }
}

async function runSmoke() {
  const directCall = {
    jsonrpc: '2.0',
    id: 'call-1',
    method: 'tools/call',
    params: {
      name: 'calculate',
      arguments: {
        a: 8,
        b: 3,
        op: 'add',
      },
    },
  };

  const directResponse = await postRpc(directCall);

  if (Array.isArray(directResponse)) {
    const callResult = directResponse.find((item) => item?.id === 'call-1');
    if (!callResult) {
      throw new Error(`Batch response missing call result: ${JSON.stringify(directResponse)}`);
    }
    assertCalculateResult(callResult);
    return;
  }

  if (!directResponse?.error) {
    assertCalculateResult(directResponse);
    return;
  }

  const batchResponse = await postRpc([
    {
      jsonrpc: '2.0',
      id: 'init-1',
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        clientInfo: { name: 'smoke-client', version: '0.1.0' },
        capabilities: {},
      },
    },
    {
      jsonrpc: '2.0',
      id: 'call-1',
      method: 'tools/call',
      params: {
        name: 'calculate',
        arguments: {
          a: 8,
          b: 3,
          op: 'add',
        },
      },
    },
  ]);

  if (!Array.isArray(batchResponse)) {
    throw new Error(`Expected batch response but got: ${JSON.stringify(batchResponse)}`);
  }

  const callResult = batchResponse.find((item) => item?.id === 'call-1');
  if (!callResult) {
    throw new Error(`Batch response missing call result: ${JSON.stringify(batchResponse)}`);
  }

  assertCalculateResult(callResult);
}

const serverProcess = spawn('node', ['dist/server.js'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(port),
    HOST: host,
  },
});

const shutdown = () => {
  if (!serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

try {
  await waitForHealth();
  await runSmoke();
  process.stdout.write('Smoke test passed.\n');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Smoke test failed: ${message}\n`);
  process.exitCode = 1;
} finally {
  shutdown();
  await sleep(300);
}

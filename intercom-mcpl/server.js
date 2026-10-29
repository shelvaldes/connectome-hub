#!/usr/bin/env node
/**
 * intercom-mcpl
 * Servidor MCP local para que los companions se envíen mensajes entre sí
 * sin salir del VPS. Expone la herramienta `send_message`.
 */

const http = require('http');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const PORT = process.env.INTERCOM_PORT || 3999;

// Cola simple de mensajes pendientes por agente
const inbox = {};

const httpServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { to, from, message } = JSON.parse(body);
        if (!to || !from || !message) {
          res.writeHead(400).end(JSON.stringify({ ok: false, error: 'missing fields' }));
          return;
        }
        if (!inbox[to]) inbox[to] = [];
        inbox[to].push({ from, message, ts: Date.now() });
        res.writeHead(200).end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400).end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
  } else if (req.method === 'GET' && req.url.startsWith('/poll/')) {
    const agent = req.url.split('/')[2];
    const messages = inbox[agent] || [];
    inbox[agent] = [];
    res.writeHead(200).end(JSON.stringify({ ok: true, messages }));
  } else {
    res.writeHead(404).end('not found');
  }
});

httpServer.listen(PORT, '127.0.0.1', () => {
  console.error(`[intercom] listening on http://127.0.0.1:${PORT}`);
});

// MCP stdio transport para integrarse con connectome-host
const server = new Server({
  name: 'intercom-mcpl',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler('tools/list', async () => ({
  tools: [{
    name: 'send_message',
    description: 'Envía un mensaje privado a otro companion dentro del VPS',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Nombre del companion destinatario' },
        message: { type: 'string', description: 'Mensaje a enviar' }
      },
      required: ['to', 'message']
    }
  }]
}));

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name !== 'send_message') {
    return { content: [{ type: 'text', text: 'Unknown tool' }], isError: true };
  }
  const { to, message } = request.params.arguments;
  const from = process.env.INTERCOM_FROM || 'unknown';

  return new Promise((resolve) => {
    const req2 = http.request({
      method: 'POST',
      hostname: '127.0.0.1',
      port: PORT,
      path: '/send',
      headers: { 'Content-Type': 'application/json' }
    }, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => {
        const result = JSON.parse(data);
        resolve({
          content: [{ type: 'text', text: result.ok ? `Mensaje enviado a ${to}` : `Error: ${result.error}` }]
        });
      });
    });
    req2.on('error', (err) => resolve({
      content: [{ type: 'text', text: `Error de red: ${err.message}` }],
      isError: true
    }));
    req2.write(JSON.stringify({ to, from, message }));
    req2.end();
  });
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);

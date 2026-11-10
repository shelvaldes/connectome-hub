#!/usr/bin/env bun
// gemini-bridge.ts — native Gemini bridge for Connectome Hub.
// Translates OpenAI-compatible /v1/chat/completions into the native Gemini
// generateContent API with safetySettings: BLOCK_NONE, so the Connectome host
// can run Gemini without Google's content filters.

import { serve } from 'bun';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const port = Number(process.env.GEMINI_BRIDGE_PORT || 4200);
const base = 'https://generativelanguage.googleapis.com/v1beta';

const SAFETY = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

type Msg = { role?: string; content?: unknown; tool_calls?: any[]; tool_call_id?: string };

function contentParts(content: unknown): any[] {
  if (typeof content === 'string') return [{ text: content }];
  if (Array.isArray(content)) {
    return content
      .map((p: any) => {
        if (!p) return null;
        if (p.type === 'text') return { text: p.text };
        if (p.type === 'image_url' && p.image_url?.url?.startsWith('data:')) {
          const [head, data] = p.image_url.url.split(',');
          return { inlineData: { mimeType: (head.split(';')[0].split(':')[1] || 'image/png'), data } };
        }
        return null;
      })
      .filter(Boolean);
  }
  return [{ text: '' }];
}

function buildContents(messages: Msg[], system: string) {
  const contents: any[] = [];
  let curRole = '';
  let curParts: any[] = [];
  const flush = () => {
    if (curParts.length) contents.push({ role: curRole, parts: curParts });
    curParts = [];
  };
  for (const m of messages || []) {
    if (m.role === 'system') {
      const t = typeof m.content === 'string' ? m.content : '';
      system += system ? '\n\n' + t : t;
      continue;
    }
    if (m.role === 'tool') {
      const name = m.tool_call_id || 'tool';
      const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? {});
      contents.push({ role: 'function', parts: [{ functionResponse: { name, response: { result: text } } }] });
      continue;
    }
    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts = contentParts(m.content);
    if (role !== curRole) flush();
    curRole = role;
    curParts.push(...parts);
  }
  flush();
  return { contents, system };
}

function sse(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

async function handle(req: Request): Promise<Response> {
  if (!apiKey) {
    return Response.json({ error: { message: 'GEMINI_API_KEY not set' } }, { status: 500 });
  }
  const url = new URL(req.url);
  if (url.pathname === '/health') return new Response('ok');
  if (url.pathname !== '/v1/chat/completions') return new Response('not found', { status: 404 });

  const body: any = await req.json().catch(() => ({}));
  const model = (body.model || 'gemini-3.7-flash').replace(/^models\//, '');
  const { contents, system } = buildContents(body.messages || [], '');

  const payload: any = {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
    generationConfig: { maxOutputTokens: body.max_tokens || 4096, temperature: body.temperature ?? 0.7 },
    safetySettings: SAFETY,
  };

  if (body.tools?.length) {
    payload.tools = [{
      functionDeclarations: body.tools
        .filter((t: any) => t?.type === 'function')
        .map((t: any) => ({ name: t.function.name, description: t.function.description, parameters: t.function.parameters })),
    }];
  }

  const headers = { 'content-type': 'application/json', 'x-goog-api-key': apiKey };

  if (body.stream) {
    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        const id = 'chatcmpl-' + Date.now();
        const finish = (reason: string) => {
          try {
            controller.enqueue(enc.encode(sse({ id, object: 'chat.completion.chunk', choices: [{ index: 0, delta: {}, finish_reason: reason }] })));
            controller.enqueue(enc.encode('data: [DONE]\n\n'));
            controller.close();
          } catch { /* already closed */ }
        };
        try {
          const res = await fetch(`${base}/models/${model}:streamGenerateContent?alt=sse`, {
            method: 'POST', headers, body: JSON.stringify(payload),
          });
          if (!res.ok || !res.body) {
            await res.text().catch(() => '');
            finish('stop');
            return;
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buf.indexOf('\n')) >= 0) {
              const line = buf.slice(0, idx).trim();
              buf = buf.slice(idx + 1);
              if (!line.startsWith('data:')) continue;
              const raw = line.slice(5).trim();
              if (!raw) continue;
              let obj: any = {};
              try { obj = JSON.parse(raw); } catch { continue; }
              const delta = (obj.candidates?.[0]?.content?.parts || []).map((p: any) => p.text ?? '').join('');
              if (delta) {
                controller.enqueue(enc.encode(sse({ id, object: 'chat.completion.chunk', choices: [{ index: 0, delta: { content: delta }, finish_reason: null }] })));
              }
            }
          }
          finish('stop');
        } catch {
          finish('stop');
        }
      },
    });
    return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
  }

  const res = await fetch(`${base}/models/${model}:generateContent`, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) return Response.json({ error: data }, { status: res.status });
  const text = (data.candidates?.[0]?.content?.parts || []).map((p: any) => p.text ?? '').join('');
  const finish = data.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'length';
  return Response.json({ id: 'chatcmpl-' + Date.now(), object: 'chat.completion', choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: finish }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });
}

console.log(`gemini-bridge listening on http://127.0.0.1:${port} (key ${apiKey ? 'set' : 'MISSING'})`);
serve({ hostname: '127.0.0.1', port, idleTimeout: 0, fetch: handle });

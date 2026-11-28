import type { Plugin } from 'vite';

export function sseProbePlugin(): Plugin {
  return {
    name: 'test-sse-probe',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.pathname === '/__sse-probe') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(
            `<!doctype html><html lang="zh-CN"><title>SSE传输验证</title><output id="events"></output><output id="fallback"></output><script type="module">import { subscribeEvents } from '/src/shared/api/events.ts';import { zTaskEvent } from '/src/generated/zod.gen.ts';const seen=new Set();const stop=subscribeEvents('/__sse-probe/events',{schema:zTaskEvent,eventName:'task',maxFailures:3,onData:(data,id)=>{if(!seen.has(id)){seen.add(id);document.querySelector('#events').textContent+='#'+id+':'+data.message;}},onFallback:()=>document.querySelector('#fallback').textContent='polling'});</script></html>`,
          );
          return;
        }
        if (url.pathname !== '/api/v1/__sse-probe/events') {
          next();
          return;
        }
        const last = req.headers['last-event-id'];
        if (last === '2') {
          res.statusCode = 503;
          res.end();
          return;
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.flushHeaders();
        const seq = last === '1' ? 2 : 1;
        const data = {
          taskId: '00000000-0000-4000-8000-000000000002',
          seq,
          stage: 'MATCH',
          counts: { schemaVersion: 1, planned: 2, completed: seq, failed: 0 },
          message: last === '1' ? 'resumed-with-last-id' : 'first',
          createdAt: '2026-11-28T00:00:00.000Z',
        };
        res.end(
          'retry: 100\n' + 'event: task\nid: ' + seq + '\ndata: ' + JSON.stringify(data) + '\n\n',
        );
      });
    },
  };
}

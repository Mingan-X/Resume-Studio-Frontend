import type { Plugin } from 'vite';

// 仅E2E模式装载的传输层本地服务器；不是后端接口或MSW业务契约。
export function transportProbePlugin(): Plugin {
  return {
    name: 'test-transport-probe',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.pathname === '/__transport-probe') {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(`<!doctype html><html lang="zh-CN"><title>传输测试</title>
          <button id="send">发送合成文件</button><button id="cancel">取消传输</button>
          <output id="progress"></output><output id="result"></output>
          <script type="module">
          import { uploadRequest } from '/src/shared/api/upload.ts';
          import { healthSchema } from '/src/features/system/model/health.ts';
          let controller;
          document.querySelector('#send').onclick = async () => {
            controller = new AbortController();
            const body = new FormData();body.append('file',new Blob(['x'.repeat(2*1024*1024)]),'synthetic.txt');
            const kind = new URL(location.href).searchParams.get('kind') || 'ok';
            try {
              const value = await uploadRequest('/__transport-probe/upload?kind='+encodeURIComponent(kind),body,healthSchema,{
                idempotencyKey:'00000000-0000-4000-8000-000000000001',signal:controller.signal,
                onProgress:(loaded,total)=>document.querySelector('#progress').textContent=loaded+'/'+total
              });
              document.querySelector('#result').textContent=value.status;
            } catch (error) { document.querySelector('#result').textContent=error.kind+':'+error.code; }
          };
          document.querySelector('#cancel').onclick=()=>controller?.abort();
          </script></html>`);
          return;
        }
        if (url.pathname !== '/api/v1/__transport-probe/upload') {
          next();
          return;
        }
        req.resume();
        req.on('end', () => {
          const send = () => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('x-request-id', '00000000-0000-4000-8000-000000000001');
            if (url.searchParams.get('kind') === 'error') {
              res.statusCode = 413;
              res.end(
                JSON.stringify({
                  code: 'HTTP_ERROR',
                  message: '合成文件过大',
                  retryable: false,
                  requestId: '00000000-0000-4000-8000-000000000001',
                }),
              );
            } else res.end(JSON.stringify({ status: 'ok', service: 'api', environment: 'test' }));
          };
          if (url.searchParams.get('kind') === 'slow') {
            const timer = setTimeout(send, 5000);
            res.on('close', () => clearTimeout(timer));
          } else send();
        });
      });
    },
  };
}

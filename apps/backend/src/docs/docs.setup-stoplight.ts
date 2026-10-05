import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'path';
import * as expressStatic from 'express';
import { AppConfigService } from '../config/app-config.service';

/**
 * Setup API documentation (OpenAPI JSON + UI)
 *
 * - Exposes OpenAPI JSON at `/docs-json`
 * - Serves Stoplight Elements UI at `/docs` (self-hosted from node_modules/@stoplight/elements)
 * - Protects `/docs` with HTTP Basic in production when credentials provided
 */
export async function setupDocs(app: INestApplication, configService: AppConfigService) {
  const swaggerUser = configService.getSwaggerUser();
  const swaggerPass = configService.getSwaggerPass();

  const builder = new DocumentBuilder()
    .setTitle('PP02 API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, builder);

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance();

  // Expose raw OpenAPI JSON
  expressApp.get('/docs-json', (_req: any, res: any) => res.json(document));

  // Production protection for docs route
  if (configService.getNodeEnv() === 'production' && swaggerUser && swaggerPass) {
    expressApp.use('/docs', (req: any, res: any, next: any) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Docs"');
        return res.status(401).send('Authentication required');
      }

      const creds = Buffer.from(auth.split(' ')[1], 'base64').toString();
      const [user, pass] = creds.split(':');
      if (user === swaggerUser && pass === swaggerPass) return next();

      res.setHeader('WWW-Authenticate', 'Basic realm="Docs"');
      return res.status(401).send('Unauthorized');
    });
  }

  // Serve Elements static from node_modules
  const elementsDist = path.resolve(process.cwd(), 'node_modules', '@stoplight', 'elements');
  try {
    expressApp.use('/static/elements', expressStatic.static(elementsDist));
  } catch (err) {
    console.warn('Stoplight Elements static assets not found at', elementsDist);
  }

  // Simple favicon for docs
  expressApp.get('/docs-favicon.ico', (_req: any, res: any) => {
    const primaryColor = process.env.SWAGGER_PRIMARY_COLOR || '#0069ff';
    const svg =
      '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">\n  <rect width="48" height="48" rx="8" fill="' +
      primaryColor +
      '"/>\n  <text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" alignment-baseline="central" font-family="Arial, Helvetica, sans-serif">PP</text>\n</svg>';
    res.type('image/svg+xml').send(svg);
  });

  // Serve the UI HTML
  const elementsHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PP02 API</title>
    <link rel="icon" href="/docs-favicon.ico" />
    <link rel="stylesheet" href="/static/elements/styles.min.css" />
    <style>
      :root { --pp09base-primary: ${process.env.SWAGGER_PRIMARY_COLOR || '#0069ff'}; }
      html, body, #elements-root { height: 100%; margin: 0; }
      .sl-elements, elements-api { --sl-color-primary: var(--pp09base-primary); }
      #pp09base-set-token { background: var(--pp09base-primary); }
    </style>
  </head>
  <body>
    <div style="position:fixed;top:8px;right:16px;z-index:9999;background:#fff;padding:8px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <label style="font-size:12px;color:#333;margin-right:8px;">Authorize:</label>
      <input id="pp09base-token" placeholder="Bearer <token>" style="width:320px;padding:6px;border:1px solid #ddd;border-radius:4px;margin-right:6px;" />
      <button id="pp09base-set-token" style="padding:6px 10px;border:none;background:var(--pp09base-primary);color:#fff;border-radius:4px;">Set</button>
      <button id="pp09base-clear-token" style="padding:6px 10px;border:none;background:#e0e0e0;color:#333;border-radius:4px;margin-left:4px;">Clear</button>
    </div>

    <div id="elements-root">
      <elements-api
        apiDescriptionUrl="/docs-json"
        router="hash"
        layout="sidebar"
        tryItCredentialsPolicy="omit"
      ></elements-api>
    </div>

    <script src="/static/elements/web-components.min.js"></script>
    <script>
      document.documentElement.setAttribute('theme', 'dark');
      const STORAGE_KEY = 'pp09base:auth_token';
      function getToken() { return localStorage.getItem(STORAGE_KEY) || ''; }
      function setToken(v) { if (v) { const normalized = v.startsWith('Bearer ') ? v : 'Bearer ' + v; localStorage.setItem(STORAGE_KEY, normalized); } else localStorage.removeItem(STORAGE_KEY); }
      document.addEventListener('DOMContentLoaded', () => {
        const input = document.getElementById('pp09base-token');
        const btn = document.getElementById('pp09base-set-token');
        const clearBtn = document.getElementById('pp09base-clear-token');
        if (input) input.value = getToken();
        btn.addEventListener('click', () => { const v = input.value.trim(); setToken(v); input.value = getToken(); alert('Authorization token saved for Try-it requests'); });
        clearBtn.addEventListener('click', () => { setToken(''); input.value = ''; alert('Authorization token cleared'); });
      });
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init = {}) => { const token = getToken(); try { const url = typeof input === 'string' ? input : input.url; const isSameOrigin = url.startsWith(window.location.origin) || url.startsWith('/'); if (token && isSameOrigin) { init.headers = init.headers || {}; if (init.headers instanceof Headers) { if (!init.headers.has('Authorization')) init.headers.set('Authorization', token); } else if (Array.isArray(init.headers)) { const hasAuth = init.headers.find(([k]) => k.toLowerCase() === 'authorization'); if (!hasAuth) init.headers.push(['Authorization', token]); } else { if (!Object.keys(init.headers).some(h => h.toLowerCase() === 'authorization')) { init.headers['Authorization'] = token; } } console.debug('Docs UI: injecting Authorization header for', url, token); } } catch (e) {} return originalFetch(input, init); };
      (function () { const OriginalXHR = window.XMLHttpRequest; function XHRProxy() { const xhr = new OriginalXHR(); const open = xhr.open; const send = xhr.send; let url = ''; xhr.open = function (method, requestUrl) { url = typeof requestUrl === 'string' ? requestUrl : requestUrl?.toString?.() || ''; return open.apply(xhr, arguments); }; xhr.send = function (body) { try { const token = getToken(); const isSameOrigin = url.startsWith(window.location.origin) || url.startsWith('/'); if (token && isSameOrigin) { xhr.setRequestHeader('Authorization', token); console.debug('Docs UI XHR: set Authorization header for', url, token); } } catch (e) {} return send.apply(xhr, arguments); }; return xhr; } XHRProxy.prototype = OriginalXHR.prototype; // @ts-ignore
      window.XMLHttpRequest = XHRProxy; })();
    </script>
  </body>
</html>`;

  expressApp.get('/docs', (_req: any, res: any) => res.type('html').send(elementsHtml));
}

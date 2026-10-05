import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppConfigService } from '../config/app-config.service';
import * as express from 'express';
import { filterOpenApiByScope } from './scope-filter';
import type { ApiScopeName } from '../common/decorators/api-scope.decorator';

/**
 * Cấu hình OpenAPI dùng chung (cho cả runtime docs lẫn script export specs).
 */
export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('PP02 API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token (Bearer <your_token_here>)',
      },
      'bearerAuth',
    )
    .addSecurityRequirements({ bearerAuth: [] })
    .build();
}

/**
 * Tạo OpenAPI document đầy đủ (chứa mọi endpoint, kèm vendor extension `x-scope`).
 */
export function buildFullDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, buildSwaggerConfig());
}

/** Mount Scalar UI tại `basePath` cho một OpenAPI document. */
function mountScalarUI(
  app: INestApplication,
  basePath: string,
  content: OpenAPIObject,
  title: string,
  primaryColor: string,
) {
  app.use(
    basePath,
    apiReference({
      content,
      title,
      theme: 'elysiajs',
      hideClientButton: true,
      hideTestRequestButton: false,
      customCss: `
      :root {
        --scalar-color-primary: ${primaryColor};
        --scalar-color-accent: ${primaryColor}cc;
        --scalar-font: 'Inter', system-ui, -apple-system, sans-serif;
      }
      body, .scalar-api-reference { font-family: 'Inter', system-ui, sans-serif; }
    `,
      persistAuth: true,
      authentication: { preferredSecurityScheme: 'bearerAuth' },
    }),
  );
}

/**
 * Setup API documentation với Scalar.
 *
 * 3 luồng độc lập (lọc theo @ApiScope):
 *   - /docs/app    + /docs/app-json    -> mobile
 *   - /docs/admin  + /docs/admin-json  -> web-admin
 *   - /docs/user   + /docs/user-json   -> web-user
 * Ngoài ra giữ /docs (đầy đủ, nội bộ) + /docs-json như cũ.
 *
 * Lưu ý thứ tự mount: các route /docs/<scope> phải đăng ký TRƯỚC /docs (catch-all prefix).
 */
export async function setupDocs(app: INestApplication, configService: AppConfigService) {
  const swaggerUser = configService.getSwaggerUser();
  const swaggerPass = configService.getSwaggerPass();
  const primaryColor = process.env.SWAGGER_PRIMARY_COLOR || '#0069ff';

  const fullDocument = buildFullDocument(app);

  const scopes: ApiScopeName[] = ['app', 'admin', 'user'];
  const scopedDocs: Record<ApiScopeName, OpenAPIObject> = {
    app: filterOpenApiByScope(fullDocument, 'app'),
    admin: filterOpenApiByScope(fullDocument, 'admin'),
    user: filterOpenApiByScope(fullDocument, 'user'),
  };

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance() as express.Express;

  // Production protection: bọc toàn bộ /docs* bằng Basic Auth khi có credentials.
  if (configService.getNodeEnv() === 'production' && swaggerUser && swaggerPass) {
    expressApp.use(
      '/docs',
      (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
      },
    );
  }

  // Raw JSON cho từng nhóm (đăng ký trước UI).
  for (const scope of scopes) {
    expressApp.get(`/docs/${scope}-json`, (_req, res) => res.json(scopedDocs[scope]));
  }
  // Raw JSON đầy đủ (giữ nguyên đường cũ).
  expressApp.get('/docs-json', (_req, res) => res.json(fullDocument));

  // Favicon cho docs.
  expressApp.get('/docs-favicon.ico', (_req, res) => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="8" fill="${primaryColor}"/>
  <text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" alignment-baseline="central" font-family="Arial, Helvetica, sans-serif">PP</text>
</svg>`;
    res.type('image/svg+xml').send(svg);
  });

  // UI 3 nhóm — PHẢI mount trước /docs (catch-all).
  mountScalarUI(app, '/docs/app', scopedDocs.app, 'PP02 API – App (mobile)', primaryColor);
  mountScalarUI(app, '/docs/admin', scopedDocs.admin, 'PP02 API – Admin', primaryColor);
  mountScalarUI(app, '/docs/user', scopedDocs.user, 'PP02 API – User', primaryColor);

  // UI đầy đủ (nội bộ) tại /docs.
  mountScalarUI(app, '/docs', fullDocument, 'PP02 API – Full (internal)', primaryColor);

  console.log('Scalar API docs ready: /docs (full), /docs/app, /docs/admin, /docs/user');
}

/**
 * Export 3 OpenAPI spec tách theo nhóm @ApiScope ra packages/api-contract/specs/.
 *
 * Chạy:  pnpm --filter @cloudpulse/backend docs:export
 *        (hoặc: ts-node src/docs/export-specs.ts)
 *
 * Dùng "preview mode" của Nest để KHÔNG khởi tạo provider (không kết nối DB/Redis),
 * chỉ quét metadata route để dựng OpenAPI document.
 */
import { NestFactory } from '@nestjs/core';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';
import { buildFullDocument } from './docs.setup';
import { filterOpenApiByScope } from './scope-filter';
import type { ApiScopeName } from '../common/decorators/api-scope.decorator';

async function exportSpecs() {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: ['error', 'warn'],
  });

  // Áp global prefix giống main.ts để path trong spec khớp endpoint thật (/api/v1/...).
  const apiPrefix = process.env.API_PREFIX || 'api';
  const apiVersion = process.env.API_VERSION || 'v1';
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  await app.init();

  const fullDocument = buildFullDocument(app);

  // Mặc định ghi vào packages/api-contract/specs (relative repo root). Cho phép override bằng env.
  const outDir =
    process.env.API_CONTRACT_SPECS_DIR ||
    join(process.cwd(), '..', '..', 'packages', 'api-contract', 'specs');
  mkdirSync(outDir, { recursive: true });

  const scopes: ApiScopeName[] = ['app', 'admin', 'user'];
  for (const scope of scopes) {
    const doc = filterOpenApiByScope(fullDocument, scope);
    const file = join(outDir, `swagger-${scope}.json`);
    writeFileSync(file, JSON.stringify(doc, null, 2), 'utf-8');
    const pathCount = Object.keys(doc.paths ?? {}).length;
    console.log(`✓ ${scope.padEnd(5)} -> ${file}  (${pathCount} paths)`);
  }

  await app.close();
}

exportSpecs()
  .then(() => {
    console.log('Done exporting scoped OpenAPI specs.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to export specs:', err);
    process.exit(1);
  });

import type { OpenAPIObject } from '@nestjs/swagger';
import type { ApiScopeName } from '../common/decorators/api-scope.decorator';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const;

/**
 * Lọc một OpenAPI document theo nhóm scope.
 *
 * Giữ lại operation khi `operation['x-scope']` (do @ApiScope nhúng) CHỨA `scope`.
 * Operation KHÔNG có `x-scope` -> bị loại khỏi mọi nhóm (vd debug, system-setting, health).
 * Path không còn operation nào -> bị bỏ.
 *
 * Sau khi lọc path, prune `components.schemas`: chỉ giữ schema còn được tham chiếu
 * (đệ quy qua $ref) từ các operation còn lại -> spec mỗi nhóm KHÔNG lẫn DTO nhóm khác.
 *
 * Trả về document MỚI (clone sâu) — không đụng document gốc.
 */
export function filterOpenApiByScope(document: OpenAPIObject, scope: ApiScopeName): OpenAPIObject {
  const cloned: OpenAPIObject = JSON.parse(JSON.stringify(document));
  const paths = cloned.paths ?? {};

  for (const pathKey of Object.keys(paths)) {
    const pathItem = paths[pathKey] as Record<string, any>;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const scopes = operation['x-scope'] as ApiScopeName[] | undefined;
      if (!Array.isArray(scopes) || !scopes.includes(scope)) {
        delete pathItem[method];
      }
    }

    // Nếu path không còn operation HTTP nào -> bỏ path
    const stillHasOps = HTTP_METHODS.some((m) => pathItem[m]);
    if (!stillHasOps) {
      delete paths[pathKey];
    }
  }

  cloned.paths = paths;

  pruneUnusedSchemas(cloned);

  return cloned;
}

const SCHEMA_REF_PREFIX = '#/components/schemas/';

/** Thu thập tên schema xuất hiện trong một $ref (chỉ quan tâm components/schemas). */
function collectRefName(ref: unknown, into: Set<string>) {
  if (typeof ref === 'string' && ref.startsWith(SCHEMA_REF_PREFIX)) {
    into.add(decodeURIComponent(ref.slice(SCHEMA_REF_PREFIX.length)));
  }
}

/** Duyệt đệ quy một node bất kỳ, gom mọi `$ref` tới components/schemas. */
function walkForRefs(node: unknown, into: Set<string>) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) walkForRefs(item, into);
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === '$ref') {
      collectRefName(value, into);
    } else {
      walkForRefs(value, into);
    }
  }
}

/**
 * Xoá các `components.schemas` không còn được tham chiếu sau khi lọc path.
 *
 * Bắt đầu từ refs trong `paths`, mở rộng đệ quy qua chính các schema được tham chiếu
 * (schema có thể $ref tới schema khác) cho tới khi không phát sinh thêm.
 */
function pruneUnusedSchemas(document: OpenAPIObject) {
  const schemas = document.components?.schemas;
  if (!schemas) return;

  const reachable = new Set<string>();

  // Hạt giống: refs dùng trực tiếp trong paths.
  walkForRefs(document.paths, reachable);

  // Mở rộng đệ quy: schema được giữ có thể tham chiếu schema khác.
  const queue = [...reachable];
  while (queue.length > 0) {
    const name = queue.shift() as string;
    const schema = (schemas as Record<string, unknown>)[name];
    if (!schema) continue;
    const childRefs = new Set<string>();
    walkForRefs(schema, childRefs);
    for (const child of childRefs) {
      if (!reachable.has(child)) {
        reachable.add(child);
        queue.push(child);
      }
    }
  }

  for (const name of Object.keys(schemas)) {
    if (!reachable.has(name)) {
      delete (schemas as Record<string, unknown>)[name];
    }
  }
}

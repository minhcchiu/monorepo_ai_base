import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Document response bọc chuẩn: { success, message, data: <model> }.
 * Dùng để @ApiResponse khai báo đúng shape backend (BaseResponseDto) → spec có schema response
 * → openapi-typescript / swagger_parser sinh được model response cho client.
 */
export const ApiOkData = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );

/**
 * Document response danh sách phân trang: { success, message, data: { data: <model>[], meta } }.
 */
export const ApiOkPaginated = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: getSchemaPath(model) } },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'number' },
                      limit: { type: 'number' },
                      total: { type: 'number' },
                      totalPages: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );

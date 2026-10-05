import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { RequestIdMiddleware } from './request-id.middleware';

// Export của @sentry/node là getter không ghi đè được nên jest.spyOn thất bại
// ("Cannot redefine property"). Mock cả module để kiểm soát scope trả về.
jest.mock('@sentry/node', () => ({
  getIsolationScope: jest.fn(),
}));

/**
 * Sentry v8 đã gỡ `configureScope`. Middleware gọi nó trên MỌI request nên
 * mỗi request ném TypeError, bị try/catch nuốt rồi log warn — log rác liên tục
 * ở production. Test này chốt: middleware không được log warn, và tag/extra
 * phải thực sự vào scope của Sentry.
 */
describe('RequestIdMiddleware — làm giàu Sentry scope', () => {
  let middleware: RequestIdMiddleware;
  let warnSpy: jest.SpyInstance;
  let setTag: jest.Mock;
  let setExtra: jest.Mock;
  let setUser: jest.Mock;

  const makeReq = (headers: Record<string, unknown> = {}) =>
    ({
      headers,
      method: 'GET',
      path: '/api/v1/health',
      socket: { remoteAddress: '127.0.0.1' },
    }) as any;

  const makeRes = () =>
    ({
      set: jest.fn(),
      on: jest.fn(),
      header: jest.fn(),
      statusCode: 200,
    }) as any;

  beforeEach(() => {
    setTag = jest.fn();
    setExtra = jest.fn();
    setUser = jest.fn();
    (Sentry.getIsolationScope as jest.Mock).mockReturnValue({ setTag, setExtra, setUser });

    middleware = new RequestIdMiddleware();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('không log cảnh báo nào khi làm giàu scope', () => {
    middleware.use(makeReq(), makeRes(), jest.fn());

    const messages = warnSpy.mock.calls.map((c) => String(c[0]));
    expect(messages).not.toContain('Sentry scope enrichment failed');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('đặt tag requestId cùng extra method/path lên scope của Sentry', () => {
    middleware.use(makeReq({ 'x-request-id': 'req-abc' }), makeRes(), jest.fn());

    expect(setTag).toHaveBeenCalledWith('requestId', 'req-abc');
    expect(setExtra).toHaveBeenCalledWith('method', 'GET');
    expect(setExtra).toHaveBeenCalledWith('path', '/api/v1/health');
  });

  it('gọi next() để chuỗi middleware chạy tiếp', () => {
    const next = jest.fn();
    middleware.use(makeReq(), makeRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

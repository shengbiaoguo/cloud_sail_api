import { Params } from 'nestjs-pino';

type RequestLogShape = {
  method: string;
  url: string;
  params?: unknown;
  query?: unknown;
  body?: unknown;
};

function pickRequestShape(req: unknown): RequestLogShape {
  const request = req as {
    method?: string;
    url?: string;
    params?: unknown;
    query?: unknown;
    body?: unknown;
    headers?: Record<string, string | string[] | undefined>;
  };
  const contentType = String(request.headers?.['content-type'] ?? '').toLowerCase();
  const isJsonBody = contentType.includes('application/json');

  return {
    method: request.method ?? '',
    url: request.url ?? '',
    params: request.params,
    query: request.query,
    body: isJsonBody ? request.body : undefined
  };
}

export const pinoHttpConfig: Params['pinoHttp'] = {
  autoLogging: true,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  serializers: {
    req: () => undefined,
    res: () => undefined
  },
  customSuccessObject: (req, res) => ({
    ...pickRequestShape(req),
    statusCode: res.statusCode
  }),
  customErrorObject: (req, res) => ({
    ...pickRequestShape(req),
    statusCode: res.statusCode
  }),
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        },
  redact: ['req.headers.authorization']
};

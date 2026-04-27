import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { requestContextStorage } from './request-context.storage';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipFromHeader = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim();
    const ip = ipFromHeader || req.ip || req.socket.remoteAddress || '';
    const userAgent = req.get('user-agent') || '';

    requestContextStorage.run(
      {
        ip,
        userAgent
      },
      next
    );
  }
}

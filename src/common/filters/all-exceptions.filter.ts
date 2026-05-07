import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 50000;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseMessage = (exceptionResponse as Record<string, unknown>).message;
        message = Array.isArray(responseMessage) ? responseMessage.join(', ') : String(responseMessage || message);
      }

      code = this.mapStatusToCode(status);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      {
        err: exception instanceof Error ? exception : undefined,
        method: request.method,
        url: request.url,
        statusCode: status
      },
      'Unhandled exception'
    );

    response.status(status).json({
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }

  private mapStatusToCode(status: number) {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 40000;
      case HttpStatus.UNAUTHORIZED:
        return 40100;
      case HttpStatus.FORBIDDEN:
        return 40300;
      case HttpStatus.NOT_FOUND:
        return 40400;
      case HttpStatus.CONFLICT:
        return 40900;
      default:
        return 50000;
    }
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../../logging/logging.service';
import { ErrorLog, ErrorResponse } from '../../types/logging';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errorResponse = {
          statusCode: status,
          message: exceptionResponse,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, string>;
        message = responseObj.message || exception.message;
        errorResponse = {
          statusCode: status,
          message,
          ...responseObj,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else {
        message = exception.message;
        errorResponse = {
          statusCode: status,
          message: exception.message,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorResponse = {
        statusCode: status,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    const errorLog: ErrorLog = {
      method: request.method,
      url: request.url,
      statusCode: status,
      message,
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      timestamp: new Date().toISOString(),
    };

    if (exception instanceof Error) {
      this.loggingService.error(
        `${request.method} ${request.url} - ${status} ${message} - ${JSON.stringify(errorLog)}`,
        exception.stack,
        'ExceptionFilter',
      );
    } else {
      this.loggingService.error(
        `${request.method} ${request.url} - ${status} ${message} - ${JSON.stringify(errorLog)}`,
        String(exception),
        'ExceptionFilter',
      );
    }

    response.status(status).json(errorResponse);
  }

  private getClientIp(request: Request): string | undefined {
    return (
      request.ip ||
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.socket?.remoteAddress
    );
  }
}

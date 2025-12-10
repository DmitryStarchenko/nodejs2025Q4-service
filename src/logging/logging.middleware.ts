import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggingService } from './logging.service';
import {
  RequestLog,
  RequestWithStartTime,
  ResponseLog,
} from 'src/types/logging';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly loggingService: LoggingService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, query, body, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const ip = this.getClientIp(req);

    const requestLog: RequestLog = {
      method,
      url: originalUrl,
      query: query,
      body: this.sanitizeBody(body),
      userAgent,
      ip,
      timestamp: new Date().toISOString(),
    };

    this.loggingService.log(
      `Incoming ${method} ${originalUrl} - ${JSON.stringify(requestLog)}`,
      'HTTP',
    );

    const originalSend = res.send.bind(res);

    res.send = (body) => {
      return originalSend(body);
    };

    res.on('finish', () => {
      const requestWithTime = req as RequestWithStartTime;
      const startTime = requestWithTime.startTime || Date.now();
      const responseLog: ResponseLog = {
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        responseTime: Date.now() - startTime,
        responseSize: res.get('content-length') || 0,
        timestamp: new Date().toISOString(),
      };

      const logLevel = res.statusCode >= 400 ? 'error' : 'log';
      const message = `${method} ${originalUrl} - ${res.statusCode} ${res.statusMessage} - ${JSON.stringify(responseLog)}`;

      if (logLevel === 'error') {
        this.loggingService.error(message, undefined, 'HTTP');
      } else {
        this.loggingService.log(message, 'HTTP');
      }
    });

    (req as RequestWithStartTime).startTime = Date.now();
    next();
  }

  private sanitizeBody(body) {
    if (!body || typeof body !== 'object' || body === null) {
      return body;
    }

    const sanitized = { ...(body as Record<string, string>) };

    const sensitiveFields = [
      'password',
      'oldPassword',
      'newPassword',
      'token',
      'secret',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
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

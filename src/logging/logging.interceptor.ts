import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggingService } from './logging.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.loggingService.log(
          `${method} ${url} - Response sent in ${duration}ms - Status: ${response.statusCode}`,
          'HTTP-Interceptor',
        );
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.loggingService.error(
          `${method} ${url} - Error occurred in ${duration}ms - ${error.message}`,
          error.stack,
          'HTTP-Interceptor',
        );

        throw error;
      }),
    );
  }
}

import { Global, Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingMiddleware } from './logging.middleware';
import { LoggingInterceptor } from './logging.interceptor';
import { AllExceptionsFilter } from '../common/utils/allExceptionsFilter';

@Global()
@Module({
  providers: [
    LoggingService,
    LoggingMiddleware,
    LoggingInterceptor,
    AllExceptionsFilter,
  ],
  exports: [
    LoggingService,
    LoggingMiddleware,
    LoggingInterceptor,
    AllExceptionsFilter,
  ],
})
export class LoggingModule {}

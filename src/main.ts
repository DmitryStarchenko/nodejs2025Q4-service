import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingService } from './logging/logging.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const loggingService = app.get(LoggingService);

  setupGlobalErrorHandlers(loggingService);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  loggingService.log(`🚀 Server is running on http://localhost:${port}`);
}

function setupGlobalErrorHandlers(loggingService: LoggingService): void {
  process.on('uncaughtException', (error: Error) => {
    loggingService.error(
      `Uncaught Exception: ${error.message}`,
      error.stack,
      'UncaughtException',
    );

    loggingService.error(
      `Process will exit due to uncaught exception. PID: ${process.pid}`,
      undefined,
      'UncaughtException',
    );

    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on(
    'unhandledRejection',
    (reason: unknown, promise: Promise<unknown>) => {
      const errorMessage =
        reason instanceof Error ? reason.message : String(reason);
      const errorStack = reason instanceof Error ? reason.stack : undefined;
      const reasonType = typeof reason;
      const isError = reason instanceof Error;

      loggingService.error(
        `Unhandled Promise Rejection detected - Reason: ${errorMessage}`,
        errorStack,
        'UnhandledRejection',
      );

      loggingService.error(
        `Unhandled Rejection Details - Type: ${reasonType}, IsError: ${isError}, PID: ${process.pid}`,
        undefined,
        'UnhandledRejection',
      );

      try {
        loggingService.error(
          `Promise state information - Promise: ${String(promise)}`,
          undefined,
          'UnhandledRejection',
        );
      } catch (promiseLogError) {
        loggingService.error(
          'Failed to log promise information',
          promiseLogError instanceof Error
            ? promiseLogError.stack
            : String(promiseLogError),
          'UnhandledRejection',
        );
      }

      const exitOnUnhandledRejection =
        process.env.EXIT_ON_UNHANDLED_REJECTION === 'true';
      if (exitOnUnhandledRejection) {
        loggingService.error(
          'Process will exit due to unhandled rejection (EXIT_ON_UNHANDLED_REJECTION=true)',
          undefined,
          'UnhandledRejection',
        );

        setTimeout(() => {
          process.exit(1);
        }, 1000);
      }
    },
  );

  process.on('SIGTERM', () => {
    loggingService.log(
      'SIGTERM signal received. Starting graceful shutdown...',
      'ProcessSignal',
    );
  });

  process.on('SIGINT', () => {
    loggingService.log(
      'SIGINT signal received. Starting graceful shutdown...',
      'ProcessSignal',
    );
  });
}

bootstrap();

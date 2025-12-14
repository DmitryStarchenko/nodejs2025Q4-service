import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export enum CustomLogLevel {
  ERROR = 0,
  WARN = 1,
  LOG = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

@Injectable()
export class LoggingService {
  private readonly logLevel: CustomLogLevel;
  private readonly logToFile: boolean;
  private readonly logDir: string;
  private readonly maxLogFileSizeKb: number;

  constructor(private readonly configService: ConfigService) {
    const level = this.configService.get<string>('LOG_LEVEL', 'LOG');
    this.logLevel = this.getLogLevelFromString(level);
    this.logToFile = this.configService.get<boolean>('LOG_TO_FILE', false);
    this.logDir = this.configService.get<string>('LOG_DIR', 'logs');
    this.maxLogFileSizeKb = this.configService.get<number>(
      'MAX_LOG_FILE_SIZE_KB',
      1024,
    );

    if (this.logToFile) {
      this.ensureLogDirectory();
    }
  }

  private getLogLevelFromString(level: string): CustomLogLevel {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return CustomLogLevel.ERROR;
      case 'WARN':
        return CustomLogLevel.WARN;
      case 'LOG':
        return CustomLogLevel.LOG;
      case 'DEBUG':
        return CustomLogLevel.DEBUG;
      case 'VERBOSE':
        return CustomLogLevel.VERBOSE;
      default:
        return CustomLogLevel.LOG;
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private shouldLog(level: CustomLogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    return `${timestamp} [${level}]${contextStr} ${message}`;
  }

  private writeLog(level: string, message: string, context?: string): void {
    const formattedMessage = this.formatMessage(level, message, context);

    console.log(formattedMessage);

    if (this.logToFile) {
      const isError = level === 'ERROR';
      this.writeToFile(formattedMessage, isError);

      // Also write errors to common log file
      if (isError) {
        this.writeToFile(formattedMessage, false);
      }
    }
  }

  private writeToFile(message: string, isError = false): void {
    const fileName = isError ? 'error.log' : 'app.log';
    const logFile = path.join(this.logDir, fileName);

    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      const fileSizeKb = stats.size / 1024;

      if (fileSizeKb >= this.maxLogFileSizeKb) {
        this.rotateLogFile(logFile);
      }
    }

    fs.appendFileSync(logFile, message + '\n');
  }

  private rotateLogFile(logFile: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);

    try {
      fs.renameSync(logFile, rotatedFile);
      this.log(
        `Log file rotated: ${path.basename(rotatedFile)}`,
        'LogRotation',
      );
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  error(message: string, trace?: string, context?: string): void {
    if (this.shouldLog(CustomLogLevel.ERROR)) {
      const fullMessage = trace ? `${message}\n${trace}` : message;
      this.writeLog('ERROR', fullMessage, context);
    }
  }

  warn(message: string, context?: string): void {
    if (this.shouldLog(CustomLogLevel.WARN)) {
      this.writeLog('WARN', message, context);
    }
  }

  log(message: string, context?: string): void {
    if (this.shouldLog(CustomLogLevel.LOG)) {
      this.writeLog('LOG', message, context);
    }
  }

  debug(message: string, context?: string): void {
    if (this.shouldLog(CustomLogLevel.DEBUG)) {
      this.writeLog('DEBUG', message, context);
    }
  }

  verbose(message: string, context?: string): void {
    if (this.shouldLog(CustomLogLevel.VERBOSE)) {
      this.writeLog('VERBOSE', message, context);
    }
  }
}

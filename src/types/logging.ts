import { Request } from 'express';

export interface RequestLog {
  method: string;
  url: string;
  query: Record<string, unknown>;
  body: unknown;
  userAgent: string;
  ip: string | undefined;
  timestamp: string;
}

export interface ResponseLog {
  method: string;
  url: string;
  statusCode: number;
  statusMessage: string;
  responseTime: number;
  responseSize: string | number;
  timestamp: string;
}

export interface ErrorLog {
  method: string;
  url: string;
  statusCode: number;
  message: string;
  userAgent: string | undefined;
  ip: string | undefined;
  timestamp: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  [key: string]: unknown;
}

export interface RequestWithStartTime extends Request {
  startTime: number;
}

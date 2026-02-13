import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Standardized API error response.
 * Never leaks stack traces or internal details to the client.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(400, message, code);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }
  static tooMany(retryAfterSec: number) {
    return new ApiError(429, 'Too many requests', 'RATE_LIMITED');
  }
}

/**
 * Wrap an API handler with standardized error handling.
 * 
 * Usage:
 *   export const GET = withErrorHandler(async (req) => {
 *     // ... your handler
 *     return NextResponse.json({ data });
 *   });
 */
export function withErrorHandler(
  handler: (req: Request, ctx?: any) => Promise<NextResponse>
) {
  return async (req: Request, ctx?: any): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: error.statusCode }
        );
      }

      // Unexpected error — log full details, return generic message
      logger.error('Unhandled API error', {
        path: new URL(req.url).pathname,
        method: req.method,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

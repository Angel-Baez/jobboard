import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const hostType = host.getType<GqlContextType>();
    
    // Generate a unique request ID for tracing
    const requestId = uuidv4();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as any).message || exception.message
        : 'Internal server error';

    const code = this.getErrorCode(status, exception);

    const errorResponse = {
      error: {
        code,
        message: Array.isArray(message) ? message[0] : message,
        requestId,
        details: Array.isArray(message) ? message : {},
      },
    };

    // Log the error with context
    this.logger.error(
      `${status} - ${code} - ${requestId} - ${exception.message}`,
      exception.stack,
    );

    if (hostType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      return response.status(status).json(errorResponse);
    } else if (hostType === 'graphql') {
      // GraphQL handled via GqlExceptionFilter usually, 
      // but NestJS global filters also catch GQL errors if rethrown correctly.
      // For now, we return the error object which Apollo will wrap.
      return exception; 
    }
  }

  private getErrorCode(status: number, exception: any): string {
    if (exception.response?.code) return exception.response.code;
    
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 429: return 'RATE_LIMIT_EXCEEDED';
      default: return 'INTERNAL_SERVER_ERROR';
    }
  }
}

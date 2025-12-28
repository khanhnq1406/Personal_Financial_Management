import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse, ErrorDetail } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: HttpStatus;
    let message: string;
    let errors: ErrorDetail[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message =
          responseObj.message || responseObj.error || 'An error occurred';

        // Handle validation errors
        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message.map((msg: string) => {
            const parts = msg.split(' ');
            return {
              field: parts.length > 1 ? parts[0] : undefined,
              message: msg,
            };
          });
          message = 'Validation failed';
        }
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      this.logger.error(
        `Unhandled exception: ${exception}`,
        (exception as Error).stack,
      );
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (errors && errors.length > 0) {
      (errorResponse as any).errors = errors;
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
    );

    response.status(status).json(errorResponse);
  }
}

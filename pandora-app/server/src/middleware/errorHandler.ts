import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Error handling middleware
 */
const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error(`Error ${statusCode}: ${message} - ${req.method} ${req.path}`);

  // Don't leak error details in production
  const errorResponse: any = {
    error: message,
  };

  if (process.env.DEBUG === 'true') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;

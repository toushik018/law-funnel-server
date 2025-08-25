import { Request, Response, NextFunction } from 'express';
import { AppError } from './customErrors';

/**
 * Error Response Interface
 */
interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    details?: any;
    stack?: string;
    timestamp: string;
    path: string;
    method: string;
}

/**
 * Logger utility for errors
 */
const logError = (err: any, req: Request): void => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode || 500,
        path: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        body: req.method !== 'GET' ? req.body : undefined,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        params: Object.keys(req.params).length > 0 ? req.params : undefined
    };

    console.error('🔴 Error Details:', JSON.stringify(errorLog, null, 2));
};

/**
 * Create standardized error response
 */
const createErrorResponse = (err: any, req: Request): ErrorResponse => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
        success: false,
        error: err.code || err.name || 'UNKNOWN_ERROR',
        message: isProduction && !err.isOperational
            ? 'Something went wrong on our end.'
            : err.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        ...(isDevelopment && {
            stack: err.stack,
            details: {
                statusCode: err.statusCode,
                isOperational: err.isOperational,
                originalError: err
            }
        })
    };
};

/**
 * Handle specific error types
 */
const handleSpecificErrors = (err: any, req: Request, res: Response): boolean => {
    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
            success: false,
            error: 'FILE_TOO_LARGE',
            message: 'The uploaded file exceeds the maximum allowed size.',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
            details: {
                maxSize: process.env.MAX_FILE_SIZE || '10MB'
            }
        });
        return true;
    }

    // JSON parsing errors
    if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
        res.status(400).json({
            success: false,
            error: 'INVALID_JSON',
            message: 'Invalid JSON format in request body',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        });
        return true;
    }

    // Network errors
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        res.status(503).json({
            success: false,
            error: 'SERVICE_UNAVAILABLE',
            message: 'External service is currently unavailable',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        });
        return true;
    }

    // Timeout errors
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        res.status(408).json({
            success: false,
            error: 'REQUEST_TIMEOUT',
            message: 'Request timeout - please try again',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        });
        return true;
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: err.message,
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method,
            details: err.errors || null
        });
        return true;
    }

    return false;
};

/**
 * Global Error Handler Middleware
 * This should be the last middleware in your app
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    // Log the error
    logError(err, req);

    // Handle specific error types first
    if (handleSpecificErrors(err, req, res)) {
        return;
    }

    // Handle custom AppError instances
    if (err instanceof AppError) {
        res.status(err.statusCode).json(createErrorResponse(err, req));
        return;
    }

    // Default error handling
    const statusCode = err.statusCode || err.status || 500;
    const errorResponse = createErrorResponse({
        ...err,
        statusCode,
        code: err.code || 'INTERNAL_SERVER_ERROR',
        isOperational: false
    }, req);

    res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    const error = new AppError(
        `Endpoint ${req.originalUrl} not found`,
        404,
        'NOT_FOUND'
    );
    next(error);
};

/**
 * Async Route Handler Wrapper
 * Use this to wrap async route handlers to catch errors automatically
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
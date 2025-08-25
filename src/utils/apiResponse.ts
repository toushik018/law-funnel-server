import { Response } from 'express';

/**
 * Standard API Response Interface
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    timestamp: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        [key: string]: any;
    };
}

/**
 * Success Response Helper
 */
export const sendSuccess = <T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200,
    meta?: any
): Response => {
    const response: ApiResponse<T> = {
        success: true,
        timestamp: new Date().toISOString(),
        ...(message && { message }),
        ...(data !== undefined && { data }),
        ...(meta && { meta })
    };

    return res.status(statusCode).json(response);
};

/**
 * Created Response Helper (201)
 */
export const sendCreated = <T>(
    res: Response,
    data?: T,
    message: string = 'Resource created successfully'
): Response => {
    return sendSuccess(res, data, message, 201);
};

/**
 * No Content Response Helper (204)
 */
export const sendNoContent = (res: Response): Response => {
    return res.status(204).send();
};

/**
 * Error Response Helper
 */
export const sendError = (
    res: Response,
    message: string,
    statusCode: number = 500,
    error: string = 'INTERNAL_ERROR',
    details?: any
): Response => {
    const response: ApiResponse = {
        success: false,
        error,
        message,
        timestamp: new Date().toISOString(),
        ...(details && { details })
    };

    return res.status(statusCode).json(response);
};

/**
 * Validation Error Response Helper
 */
export const sendValidationError = (
    res: Response,
    message: string = 'Validation failed',
    errors?: any
): Response => {
    return sendError(res, message, 400, 'VALIDATION_ERROR', errors);
};

/**
 * Not Found Response Helper
 */
export const sendNotFound = (
    res: Response,
    message: string = 'Resource not found'
): Response => {
    return sendError(res, message, 404, 'NOT_FOUND');
};

/**
 * Unauthorized Response Helper
 */
export const sendUnauthorized = (
    res: Response,
    message: string = 'Unauthorized access'
): Response => {
    return sendError(res, message, 401, 'UNAUTHORIZED');
};

/**
 * Forbidden Response Helper
 */
export const sendForbidden = (
    res: Response,
    message: string = 'Access forbidden'
): Response => {
    return sendError(res, message, 403, 'FORBIDDEN');
};

/**
 * Paginated Response Helper
 */
export const sendPaginated = <T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
): Response => {
    const meta = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
    };

    return sendSuccess(res, data, message, 200, meta);
};
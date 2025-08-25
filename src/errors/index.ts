/**
 * Error Handling Module
 * Centralized error handling for the Law Funnel Server
 */

// Export custom error classes
export {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    InternalServerError,
    ServiceUnavailableError,
    TimeoutError,
    RateLimitError
} from './customErrors';

// Export error handlers
export {
    globalErrorHandler,
    notFoundHandler,
    asyncHandler
} from './errorHandlers';

// Export process handlers
export {
    setupProcessErrorHandlers
} from './processHandlers';
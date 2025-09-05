import { Response, NextFunction } from 'express';
import { AuthUtils, AuthenticatedRequest } from '../utils/auth';
import { UnauthorizedError } from '../errors';

/**
 * Authentication Middleware with Bearer Token Support
 * Protects routes by verifying JWT tokens from Authorization header
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        let token: string | undefined;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (!token) {
            // Enhanced debugging for token issues
            const debugInfo = {
                hasAuthHeader: !!authHeader,
                authHeaderValue: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
                userAgent: req.headers['user-agent'],
                origin: req.headers.origin,
                host: req.headers.host
            };
            console.log('🚨 No token found. Debug info:', debugInfo);
            throw new UnauthorizedError('Access token required');
        }

        const payload = AuthUtils.verifyToken(token);
        req.user = payload;

        next();
    } catch (error: any) {
        next(new UnauthorizedError(error.message || 'Invalid token'));
    }
};

/**
 * Optional Authentication Middleware
 * Adds user info if token is present, but doesn't require it
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = AuthUtils.extractTokenFromHeader(authHeader);

        if (token) {
            const payload = AuthUtils.verifyToken(token);
            req.user = payload;
        }

        next();
    } catch (error) {
        // Ignore errors for optional auth
        next();
    }
};
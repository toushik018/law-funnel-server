import { Response, NextFunction } from 'express';
import { AuthUtils, AuthenticatedRequest } from '../utils/auth';
import { UnauthorizedError } from '../errors';

/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens from httpOnly cookies
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        // Get token from httpOnly cookie
        const token = req.cookies['auth-token'];

        if (!token) {
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
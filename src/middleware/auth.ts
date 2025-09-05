import { Response, NextFunction } from 'express';
import { AuthUtils, AuthenticatedRequest } from '../utils/auth';
import { UnauthorizedError } from '../errors';

/**
 * Authentication Middleware with Fallback Support
 * Protects routes by verifying JWT tokens from httpOnly cookies
 * Includes fallback cookie support for Safari and strict browsers
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
        // Try to get token from primary cookie first
        let token = req.cookies['auth-token'];

        // If primary cookie fails, try fallback cookie (for Safari compatibility)
        if (!token) {
            token = req.cookies['auth-token-fallback'];
        }

        // If neither cookie is present, try Authorization header as last resort
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

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
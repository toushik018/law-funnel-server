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
        // Try multiple cookie strategies for better browser compatibility
        let token = req.cookies['auth-token']; // Primary cookie

        // Safari fallback strategies
        if (!token) {
            token = req.cookies['auth-token-safari']; // Safari-specific cookie
        }

        if (!token) {
            token = req.cookies['auth-token-fallback']; // Original fallback
        }

        if (!token) {
            token = req.cookies['auth-token-dev']; // Development fallback
        }

        // Authorization header fallback (for manual testing)
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            // Enhanced debugging for Safari issues
            const debugInfo = {
                cookies: Object.keys(req.cookies || {}),
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
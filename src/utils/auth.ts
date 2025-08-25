import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { EmailValidationService } from '../services/emailValidationService';

/**
 * User payload for JWT
 */
export interface JwtPayload {
    userId: string;
    email: string;
    name: string;
}

/**
 * Extended Request interface with user
 */
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

/**
 * Authentication Utilities
 */
export class AuthUtils {
    private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    private static readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

    /**
     * Hash password using bcrypt
     */
    static async hashPassword(password: string): Promise<string> {
        try {
            return await bcrypt.hash(password, this.BCRYPT_ROUNDS);
        } catch (error) {
            throw new Error('Error hashing password');
        }
    }

    /**
     * Compare password with hash
     */
    static async comparePassword(password: string, hash: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            throw new Error('Error comparing password');
        }
    }

    /**
     * Generate JWT token
     */
    static generateToken(payload: JwtPayload): string {
        try {
            return jwt.sign(
                payload,
                this.JWT_SECRET,
                {
                    expiresIn: this.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
                    issuer: 'law-funnel-server',
                    audience: 'law-funnel-client'
                }
            );
        } catch (error) {
            throw new Error('Error generating token');
        }
    }

    /**
     * Verify JWT token
     */
    static verifyToken(token: string): JwtPayload {
        try {
            const options: jwt.VerifyOptions = {
                issuer: 'law-funnel-server',
                audience: 'law-funnel-client'
            };
            return jwt.verify(token, this.JWT_SECRET, options) as JwtPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            throw new Error('Token verification failed');
        }
    }

    /**
     * Extract token from Authorization header
     */
    static extractTokenFromHeader(authHeader?: string): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    /**
     * Validate password strength
     */
    static validatePassword(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate email format
     */
    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Comprehensive email validation using EmailValidationService
     */
    static async validateEmailComprehensive(email: string) {
        return await EmailValidationService.validateEmail(email);
    }
}
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../services/userService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { ValidationError } from '../errors';
import { AuthenticatedRequest } from '../utils/auth';

/**
 * Validation rules for user registration
 */
export const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),

    body('acceptedTerms')
        .isBoolean()
        .withMessage('Terms acceptance must be a boolean')
        .custom((value) => {
            if (value !== true) {
                throw new Error('You must accept the Terms and Conditions to create an account');
            }
            return true;
        })
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

/**
 * Validation rules for profile update
 */
export const profileUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

    body('company')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Company name cannot exceed 200 characters'),

    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Address cannot exceed 500 characters'),

    body('phone')
        .optional()
        .trim()
        .isLength({ max: 20 })
        .withMessage('Phone number cannot exceed 20 characters')
        .matches(/^[+]?[0-9\s\-\(\)]{7,20}$/)
        .withMessage('Invalid phone number format'),

    body('bankName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Bank name cannot exceed 100 characters'),

    body('iban')
        .optional()
        .trim()
        .isLength({ max: 34 })
        .withMessage('IBAN cannot exceed 34 characters')
        .matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/i)
        .withMessage('Invalid IBAN format'),

    body('bic')
        .optional()
        .trim()
        .isLength({ max: 11 })
        .withMessage('BIC cannot exceed 11 characters')
        .matches(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i)
        .withMessage('Invalid BIC format'),

    body('lawFirm')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Law firm name cannot exceed 200 characters')
];

/**
 * Authentication Controller
 * Handles user registration, login, and profile operations
 */
export class AuthController {
    /**
     * Register a new user
     */
    static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError('Validation failed', undefined, errors.array());
            }

            const { name, email, password, acceptedTerms } = req.body;

            // Additional check for terms acceptance
            if (!acceptedTerms) {
                throw new ValidationError('You must accept the Terms and Conditions to create an account');
            }

            // Create user
            const user = await UserService.createUser({ name, email, password });

            sendCreated(res, user, 'User registered successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Login user
     */
    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError('Validation failed', undefined, errors.array());
            }

            const { email, password } = req.body;

            // Authenticate user
            const result = await UserService.loginUser({ email, password });

            // Set JWT token as httpOnly cookie
            res.cookie('auth-token', result.token, {
                httpOnly: true, // Cannot be accessed via JavaScript
                secure: process.env.NODE_ENV === 'production', // Only over HTTPS in production
                sameSite: 'lax', // CSRF protection
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/' // Available on all paths
            });

            // Return user data without token (token is in cookie)
            sendSuccess(res, { user: result.user }, 'Login successful');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get current user profile
     */
    static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const user = await UserService.getUserById(req.user.userId);

            sendSuccess(res, user, 'Profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError('Validation failed', undefined, errors.array());
            }

            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { name, email, company, address, phone, bankName, iban, bic, lawFirm } = req.body;
            const updateData: any = {};

            // Only include fields that are provided in the request
            if (name !== undefined) updateData.name = name;
            if (email !== undefined) updateData.email = email;
            if (company !== undefined) updateData.company = company;
            if (address !== undefined) updateData.address = address;
            if (phone !== undefined) updateData.phone = phone;
            if (bankName !== undefined) updateData.bankName = bankName;
            if (iban !== undefined) updateData.iban = iban;
            if (bic !== undefined) updateData.bic = bic;
            if (lawFirm !== undefined) updateData.lawFirm = lawFirm;

            const user = await UserService.updateUser(req.user.userId, updateData);

            sendSuccess(res, user, 'Profile updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Logout user by clearing the httpOnly cookie
     */
    static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Clear the auth-token cookie
            res.clearCookie('auth-token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });

            // Also set cookie with past expiry date for better compatibility
            res.cookie('auth-token', '', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                expires: new Date(0)
            });

            sendSuccess(res, {}, 'Logout successful');
        } catch (error) {
            next(error);
        }
    }
}
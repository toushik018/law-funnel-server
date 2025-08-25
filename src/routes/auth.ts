import { Router } from 'express';
import { AuthController, registerValidation, loginValidation, profileUpdateValidation } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../errors';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register',
    registerValidation,
    asyncHandler(AuthController.register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, asyncHandler(AuthController.login));

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, asyncHandler(AuthController.getProfile));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
    authenticateToken,
    profileUpdateValidation,
    asyncHandler(AuthController.updateProfile)
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user by clearing cookies
 * @access  Public
 */
router.post('/logout', asyncHandler(AuthController.logout));

export default router;
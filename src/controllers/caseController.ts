import { Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CaseService, CreateCaseData } from '../services/caseService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { ValidationError } from '../errors';
import { AuthenticatedRequest } from '../utils/auth';
import { CaseStatus } from '../models/Case';

/**
 * Validation rules for case creation
 */
export const createCaseValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Case title cannot exceed 200 characters')
];

/**
 * Validation rules for legal qualification answers update
 */
export const legalQualificationValidation = [
    body('contractSituation')
        .trim()
        .notEmpty()
        .withMessage('Contract situation is required')
        .isLength({ max: 1000 })
        .withMessage('Contract situation cannot exceed 1000 characters'),
    body('invoiceSentDate')
        .notEmpty()
        .withMessage('Invoice sent date is required')
        .isISO8601()
        .withMessage('Invoice sent date must be a valid date')
        .custom((value) => {
            const invoiceDate = new Date(value);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (invoiceDate > thirtyDaysAgo) {
                throw new Error('Invoice sent date must be at least 30 days ago');
            }

            return true;
        })
];

/**
 * Validation rules for digital signature status update
 */
export const digitalSignatureValidation = [
    body('isCompleted')
        .isBoolean()
        .withMessage('isCompleted must be a boolean')
];

/**
 * Validation rules for client type update
 */
export const clientTypeValidation = [
    body('clientType')
        .isIn(['company', 'private'])
        .withMessage('Client type must be either "company" or "private"')
];

/**
 * Validation rules for payment notice status update
 */
export const paymentNoticeValidation = [
    body('isGenerated')
        .isBoolean()
        .withMessage('isGenerated must be a boolean')
];

/**
 * Case Controller
 * Handles HTTP requests for case management
 */
export class CaseController {

    /**
     * Create a new case
     * POST /api/cases
     */
    static async createCase(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError('Validation failed', undefined, errors.array());
            }

            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { title } = req.body;

            const caseData: CreateCaseData = {
                userId: req.user.userId,
                title,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            };

            const newCase = await CaseService.createCase(caseData);

            sendCreated(res, newCase, 'Case created successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all cases for the authenticated user
     * GET /api/cases
     */
    static async getUserCases(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Max 50 per page
            const status = req.query.status as CaseStatus;

            const result = await CaseService.getUserCases(req.user.userId, page, limit, status);

            sendSuccess(res, result, 'Cases retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific case by ID
     * GET /api/cases/:caseId
     */
    static async getCaseById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { caseId } = req.params;
            const caseData = await CaseService.getCaseById(caseId, req.user.userId);

            sendSuccess(res, caseData, 'Case retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update legal qualification answers for a case
     * PUT /api/cases/:caseId/legal-qualification
     */
    static async updateLegalQualification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError('Validation failed', undefined, errors.array());
            }

            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { caseId } = req.params;
            const { contractSituation, invoiceSentDate } = req.body;

            const answersData = {
                contractSituation,
                invoiceSentDate
            };

            const updatedCase = await CaseService.updateLegalQualificationAnswers(caseId, req.user.userId, answersData);

            sendSuccess(res, updatedCase, 'Legal qualification answers updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update digital signature status for a case
     * PUT /api/cases/:caseId/digital-signature
     */
    static async updateDigitalSignature(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError('Validation failed', undefined, errors.array());
            }

            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { caseId } = req.params;
            const { isCompleted } = req.body;

            const updatedCase = await CaseService.updateDigitalSignatureStatus(caseId, req.user.userId, isCompleted);

            sendSuccess(res, updatedCase, 'Digital signature status updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update client type for a case
     * PUT /api/cases/:caseId/client-type
     */
    static async updateClientType(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError('Validation failed', undefined, errors.array());
            }

            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { caseId } = req.params;
            const { clientType } = req.body;

            const updatedCase = await CaseService.updateClientType(caseId, req.user.userId, clientType);

            sendSuccess(res, updatedCase, 'Client type updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update payment notice generation status
     * PUT /api/cases/:caseId/payment-notice
     */
    static async updatePaymentNoticeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new ValidationError('Validation failed', undefined, errors.array());
            }

            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { caseId } = req.params;
            const { isGenerated } = req.body;

            const updatedCase = await CaseService.updatePaymentNoticeStatus(caseId, req.user.userId, isGenerated);

            sendSuccess(res, updatedCase, 'Payment notice status updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Complete a case
     * PUT /api/cases/:caseId/complete
     */
    static async completeCase(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { caseId } = req.params;
            const updatedCase = await CaseService.completeCase(caseId, req.user.userId);

            sendSuccess(res, updatedCase, 'Case completed successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cancel a case
     * PUT /api/cases/:caseId/cancel
     */
    static async cancelCase(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { caseId } = req.params;
            const updatedCase = await CaseService.cancelCase(caseId, req.user.userId);

            sendSuccess(res, updatedCase, 'Case cancelled successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a case
     * DELETE /api/cases/:caseId
     */
    static async deleteCase(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const { caseId } = req.params;
            await CaseService.deleteCase(caseId, req.user.userId);

            sendSuccess(res, {}, 'Case deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get case statistics for dashboard
     * GET /api/cases/statistics
     */
    static async getCaseStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user) {
                throw new ValidationError('User not found in request');
            }

            const statistics = await CaseService.getCaseStatistics(req.user.userId);

            sendSuccess(res, statistics, 'Case statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}
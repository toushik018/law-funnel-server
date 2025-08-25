import { Router } from 'express';
import {
    CaseController,
    createCaseValidation,
    legalQualificationValidation,
    digitalSignatureValidation,
    clientTypeValidation,
    paymentNoticeValidation
} from '../controllers/caseController';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../errors';

const router = Router();

/**
 * All case routes require authentication
 */
router.use(authenticateToken);

/**
 * @route   POST /api/cases
 * @desc    Create a new case
 * @access  Private
 */
router.post('/',
    createCaseValidation,
    asyncHandler(CaseController.createCase)
);

/**
 * @route   GET /api/cases
 * @desc    Get all cases for the authenticated user
 * @access  Private
 * @query   ?page=1&limit=20&status=draft
 */
router.get('/',
    asyncHandler(CaseController.getUserCases)
);

/**
 * @route   GET /api/cases/statistics
 * @desc    Get case statistics for dashboard
 * @access  Private
 */
router.get('/statistics',
    asyncHandler(CaseController.getCaseStatistics)
);

/**
 * @route   GET /api/cases/:caseId
 * @desc    Get a specific case by ID
 * @access  Private
 */
router.get('/:caseId',
    asyncHandler(CaseController.getCaseById)
);

/**
 * @route   PUT /api/cases/:caseId/legal-qualification
 * @desc    Update legal qualification answers for a case
 * @access  Private
 */
router.put('/:caseId/legal-qualification',
    legalQualificationValidation,
    asyncHandler(CaseController.updateLegalQualification)
);

/**
 * @route   PUT /api/cases/:caseId/digital-signature
 * @desc    Update digital signature status for a case
 * @access  Private
 */
router.put('/:caseId/digital-signature',
    digitalSignatureValidation,
    asyncHandler(CaseController.updateDigitalSignature)
);

/**
 * @route   PUT /api/cases/:caseId/client-type
 * @desc    Update client type for a case
 * @access  Private
 */
router.put('/:caseId/client-type',
    clientTypeValidation,
    asyncHandler(CaseController.updateClientType)
);

/**
 * @route   PUT /api/cases/:caseId/payment-notice
 * @desc    Update payment notice generation status
 * @access  Private
 */
router.put('/:caseId/payment-notice',
    paymentNoticeValidation,
    asyncHandler(CaseController.updatePaymentNoticeStatus)
);

/**
 * @route   PUT /api/cases/:caseId/complete
 * @desc    Mark a case as completed
 * @access  Private
 */
router.put('/:caseId/complete',
    asyncHandler(CaseController.completeCase)
);

/**
 * @route   PUT /api/cases/:caseId/cancel
 * @desc    Cancel a case
 * @access  Private
 */
router.put('/:caseId/cancel',
    asyncHandler(CaseController.cancelCase)
);

/**
 * @route   DELETE /api/cases/:caseId
 * @desc    Delete a case (with restrictions)
 * @access  Private
 */
router.delete('/:caseId',
    asyncHandler(CaseController.deleteCase)
);

export default router;
import { Case, ICase, CaseStatus, ILegalQualificationAnswers } from '../models/Case';
import { NotFoundError, ValidationError, ForbiddenError } from '../errors';
import mongoose from 'mongoose';

/**
 * Case creation data
 */
export interface CreateCaseData {
    userId: string;
    title?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Simplified Case response interface
 * Only includes protocol compliance data
 */
export interface CaseResponse {
    id: string;
    userId: string;
    caseNumber: string;
    status: CaseStatus;
    title?: string;
    legalQualificationAnswers?: ILegalQualificationAnswers;
    isDigitalSignatureCompleted: boolean;
    clientType?: 'company' | 'private';
    isNoticeGenerated: boolean;
    workflowStartedAt: Date;
    lastUpdatedAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Case Service
 * Handles all case-related database operations and business logic
 */
export class CaseService {

    /**
     * Create a new case for a user
     */
    static async createCase(caseData: CreateCaseData): Promise<CaseResponse> {
        const { userId, title, ipAddress, userAgent } = caseData;

        // Validate user ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ValidationError('Invalid user ID');
        }

        const newCase = await Case.create({
            userId: new mongoose.Types.ObjectId(userId),
            title,
            status: CaseStatus.DRAFT,
            ipAddress,
            userAgent,
            consentGiven: true,
            consentGivenAt: new Date(),
            // Set data retention to 7 years for legal compliance
            dataRetentionDate: new Date(Date.now() + (7 * 365 * 24 * 60 * 60 * 1000))
        });

        return this.toCaseResponse(newCase);
    }

    /**
     * Get case by ID (with user ownership check)
     */
    static async getCaseById(caseId: string, userId: string): Promise<CaseResponse> {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new ValidationError('Invalid case ID');
        }

        const caseDoc = await Case.findOne({
            _id: caseId,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!caseDoc) {
            throw new NotFoundError('Case not found or access denied');
        }

        return this.toCaseResponse(caseDoc);
    }

    /**
     * Get all cases for a user with pagination
     */
    static async getUserCases(
        userId: string,
        page: number = 1,
        limit: number = 20,
        status?: CaseStatus
    ): Promise<{ cases: CaseResponse[]; total: number; page: number; totalPages: number }> {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ValidationError('Invalid user ID');
        }

        const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;

        const [cases, total] = await Promise.all([
            Case.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Case.countDocuments(filter)
        ]);

        return {
            cases: cases.map(this.toCaseResponse),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Update legal qualification answers
     */
    static async updateLegalQualificationAnswers(
        caseId: string,
        userId: string,
        answersData: {
            contractSituation: string;
            fulfillmentDate: string;
            invoiceWrittenDate: string;
            invoiceSentDate: string;
        }
    ): Promise<CaseResponse> {
        const caseDoc = await this.getCaseAndValidateOwnership(caseId, userId);

        caseDoc.legalQualificationAnswers = {
            ...answersData,
            completedAt: new Date()
        };

        if (caseDoc.status === CaseStatus.DRAFT) {
            caseDoc.status = CaseStatus.QUALIFICATION_COMPLETE;
        }

        await caseDoc.save();
        return this.toCaseResponse(caseDoc);
    }

    /**
     * Update digital signature status
     */
    static async updateDigitalSignatureStatus(
        caseId: string,
        userId: string,
        isCompleted: boolean
    ): Promise<CaseResponse> {
        const caseDoc = await this.getCaseAndValidateOwnership(caseId, userId);

        caseDoc.isDigitalSignatureCompleted = isCompleted;

        if (isCompleted && caseDoc.status === CaseStatus.QUALIFICATION_COMPLETE) {
            caseDoc.status = CaseStatus.SIGNATURE_COMPLETE;
        }

        await caseDoc.save();
        return this.toCaseResponse(caseDoc);
    }

    /**
     * Update client type
     */
    static async updateClientType(
        caseId: string,
        userId: string,
        clientType: 'company' | 'private'
    ): Promise<CaseResponse> {
        const caseDoc = await this.getCaseAndValidateOwnership(caseId, userId);

        caseDoc.clientType = clientType;

        if (caseDoc.status === CaseStatus.SIGNATURE_COMPLETE) {
            caseDoc.status = CaseStatus.CLIENT_TYPE_SELECTED;
        }

        await caseDoc.save();
        return this.toCaseResponse(caseDoc);
    }

    /**
     * Update payment notice generation status
     */
    static async updatePaymentNoticeStatus(
        caseId: string,
        userId: string,
        isGenerated: boolean
    ): Promise<CaseResponse> {
        const caseDoc = await this.getCaseAndValidateOwnership(caseId, userId);

        caseDoc.isNoticeGenerated = isGenerated;

        if (isGenerated && caseDoc.status === CaseStatus.CLIENT_TYPE_SELECTED) {
            caseDoc.status = CaseStatus.NOTICE_GENERATED;
        }

        await caseDoc.save();
        return this.toCaseResponse(caseDoc);
    }

    /**
     * Mark case as completed
     */
    static async completeCase(caseId: string, userId: string): Promise<CaseResponse> {
        const caseDoc = await this.getCaseAndValidateOwnership(caseId, userId);

        caseDoc.status = CaseStatus.COMPLETED;
        caseDoc.completedAt = new Date();

        await caseDoc.save();
        return this.toCaseResponse(caseDoc);
    }

    /**
     * Cancel a case
     */
    static async cancelCase(caseId: string, userId: string): Promise<CaseResponse> {
        const caseDoc = await this.getCaseAndValidateOwnership(caseId, userId);

        caseDoc.status = CaseStatus.CANCELLED;

        await caseDoc.save();
        return this.toCaseResponse(caseDoc);
    }

    /**
     * Delete a case (with legal compliance checks)
     */
    static async deleteCase(caseId: string, userId: string): Promise<void> {
        const caseDoc = await this.getCaseAndValidateOwnership(caseId, userId);

        // Check if case can be deleted (business rules)
        if (caseDoc.status === CaseStatus.NOTICE_GENERATED || caseDoc.status === CaseStatus.COMPLETED) {
            throw new ForbiddenError('Cannot delete case after notice has been generated - legal retention required');
        }

        await Case.findByIdAndDelete(caseId);
    }

    /**
     * Get case statistics for user dashboard
     */
    static async getCaseStatistics(userId: string): Promise<{
        total: number;
        byStatus: Record<CaseStatus, number>;
        recentActivity: number; // Cases in last 30 days
    }> {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ValidationError('Invalid user ID');
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

        const [total, statusCounts, recentActivity] = await Promise.all([
            Case.countDocuments({ userId: userObjectId }),
            Case.aggregate([
                { $match: { userId: userObjectId } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Case.countDocuments({
                userId: userObjectId,
                createdAt: { $gte: thirtyDaysAgo }
            })
        ]);

        // Initialize all statuses with 0
        const byStatus: Record<CaseStatus, number> = Object.values(CaseStatus).reduce((acc, status) => {
            acc[status] = 0;
            return acc;
        }, {} as Record<CaseStatus, number>);

        // Fill in actual counts
        statusCounts.forEach(({ _id, count }) => {
            byStatus[_id as CaseStatus] = count;
        });

        return {
            total,
            byStatus,
            recentActivity
        };
    }

    /**
     * Helper: Get case and validate user ownership
     */
    private static async getCaseAndValidateOwnership(caseId: string, userId: string): Promise<ICase> {
        if (!mongoose.Types.ObjectId.isValid(caseId)) {
            throw new ValidationError('Invalid case ID');
        }

        const caseDoc = await Case.findOne({
            _id: caseId,
            userId: new mongoose.Types.ObjectId(userId)
        });

        if (!caseDoc) {
            throw new NotFoundError('Case not found or access denied');
        }

        return caseDoc;
    }

    /**
     * Convert Case document to simplified response format
     */
    private static toCaseResponse(caseDoc: ICase): CaseResponse {
        return {
            id: caseDoc._id.toString(),
            userId: caseDoc.userId.toString(),
            caseNumber: caseDoc.caseNumber,
            status: caseDoc.status,
            title: caseDoc.title,
            legalQualificationAnswers: caseDoc.legalQualificationAnswers,
            isDigitalSignatureCompleted: caseDoc.isDigitalSignatureCompleted,
            clientType: caseDoc.clientType,
            isNoticeGenerated: caseDoc.isNoticeGenerated,
            workflowStartedAt: caseDoc.workflowStartedAt,
            lastUpdatedAt: caseDoc.lastUpdatedAt,
            completedAt: caseDoc.completedAt,
            createdAt: caseDoc.createdAt,
            updatedAt: caseDoc.updatedAt
        };
    }
}
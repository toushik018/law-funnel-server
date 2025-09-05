import mongoose, { Document, Schema } from 'mongoose';

/**
 * Legal Qualification Answers Interface
 * Based on the 2 questions from the frontend
 */
export interface ILegalQualificationAnswers {
    contractSituation: string; // What is the situation with the contract?
    invoiceSentDate: string; // When was the invoice sent?
    completedAt: Date;
}

/**
 * Case Status Enum
 */
export enum CaseStatus {
    DRAFT = 'draft',
    QUALIFICATION_COMPLETE = 'qualification_complete',
    SIGNATURE_COMPLETE = 'signature_complete',
    CLIENT_TYPE_SELECTED = 'client_type_selected',
    NOTICE_GENERATED = 'notice_generated',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

/**
 * Simplified Case Document Interface
 * Only stores protocol compliance data, no heavy documents
 */
export interface ICase extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;

    // Case metadata
    caseNumber: string; // Auto-generated unique case number
    status: CaseStatus;
    title?: string; // Optional case title/description

    // Protocol compliance data only
    legalQualificationAnswers?: ILegalQualificationAnswers; // The 4 answers
    isDigitalSignatureCompleted: boolean; // Just status, not signature data
    clientType?: 'company' | 'private'; // Company or private client
    isNoticeGenerated: boolean; // Payment notice generation status

    // Timestamps for workflow tracking
    workflowStartedAt: Date;
    lastUpdatedAt: Date;
    completedAt?: Date;

    // Legal compliance tracking
    dataRetentionDate?: Date; // When to delete per GDPR
    consentGiven: boolean;
    consentGivenAt: Date;

    createdAt: Date;
    updatedAt: Date;
}

/**
 * Simplified Case Schema
 * Only stores protocol compliance data, no heavy documents
 */
const CaseSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        caseNumber: {
            type: String,
            unique: true
        },

        status: {
            type: String,
            enum: Object.values(CaseStatus),
            default: CaseStatus.DRAFT,
            index: true
        },

        title: {
            type: String,
            trim: true,
            maxlength: [200, 'Case title cannot exceed 200 characters']
        },

        // Legal Qualification Answers - The 2 questions
        legalQualificationAnswers: {
            contractSituation: { type: String, trim: true },
            invoiceSentDate: { type: String },
            completedAt: { type: Date }
        },

        // Digital Signature Status - Just boolean, no signature data
        isDigitalSignatureCompleted: {
            type: Boolean,
            default: false
        },

        // Client Type
        clientType: {
            type: String,
            enum: ['company', 'private']
        },

        // Payment Notice Status - Just boolean, no document content
        isNoticeGenerated: {
            type: Boolean,
            default: false
        },

        // Workflow timestamps
        workflowStartedAt: {
            type: Date,
            default: Date.now
        },

        lastUpdatedAt: {
            type: Date,
            default: Date.now
        },

        completedAt: {
            type: Date
        },

        // GDPR compliance
        dataRetentionDate: {
            type: Date
        },

        consentGiven: {
            type: Boolean,
            required: true,
            default: true
        },

        consentGivenAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        collection: 'cases'
    }
);

// Indexes for performance
CaseSchema.index({ userId: 1, status: 1 });
CaseSchema.index({ userId: 1, createdAt: -1 });

// Auto-generate case number before saving
CaseSchema.pre('save', async function (next) {
    if (this.isNew && !this.caseNumber) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Create a unique case number with timestamp: LF-YYYYMMDD-HHMMSS
        this.caseNumber = `LF-${year}${month}${day}-${hours}${minutes}${seconds}`;

        // If still duplicate (very rare), add milliseconds
        const existingCase = await mongoose.model('Case').findOne({ caseNumber: this.caseNumber });
        if (existingCase) {
            const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
            this.caseNumber = `LF-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
        }
    }

    this.lastUpdatedAt = new Date();
    next();
});

/**
 * Convert _id to id when converting to JSON
 */
CaseSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete (ret as any).__v;
        return ret;
    }
});

/**
 * Case Model
 */
export const Case = mongoose.model<ICase>('Case', CaseSchema);
export default Case;
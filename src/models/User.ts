import mongoose, { Document, Schema } from 'mongoose';

/**
 * User interface for TypeScript
 */
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password: string;

    // Profile completion tracking
    profileCompleted: boolean;

    // Company Information
    company?: string;

    // Contact Information
    address?: string;
    phone?: string;

    // Banking Information
    bankName?: string;
    iban?: string;
    bic?: string;

    // Legal Information
    lawFirm?: string;

    createdAt: Date;
    updatedAt: Date;
}

/**
 * User Schema
 */
const UserSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters']
        },

        // Profile completion tracking
        profileCompleted: {
            type: Boolean,
            default: false
        },

        // Company Information
        company: {
            type: String,
            trim: true,
            maxlength: [200, 'Company name cannot exceed 200 characters']
        },

        // Contact Information
        address: {
            type: String,
            trim: true,
            maxlength: [500, 'Address cannot exceed 500 characters']
        },
        phone: {
            type: String,
            trim: true,
            maxlength: [20, 'Phone number cannot exceed 20 characters']
        },

        // Banking Information
        bankName: {
            type: String,
            trim: true,
            maxlength: [100, 'Bank name cannot exceed 100 characters']
        },
        iban: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: [34, 'IBAN cannot exceed 34 characters'],
            validate: {
                validator: function (v: string) {
                    // Basic IBAN format validation (optional field)
                    if (!v) return true; // Allow empty
                    return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(v);
                },
                message: 'Please enter a valid IBAN format'
            }
        },
        bic: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: [11, 'BIC cannot exceed 11 characters'],
            validate: {
                validator: function (v: string) {
                    // Basic BIC format validation (optional field)
                    if (!v) return true; // Allow empty
                    return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v);
                },
                message: 'Please enter a valid BIC format'
            }
        },

        // Legal Information
        lawFirm: {
            type: String,
            trim: true,
            maxlength: [200, 'Law firm name cannot exceed 200 characters']
        }
    },
    {
        timestamps: true,
        collection: 'users'
    }
);

/**
 * Convert _id to id when converting to JSON
 */
UserSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete (ret as any).__v;
        delete ret.password;
        return ret;
    }
});

/**
 * User Model
 */
export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
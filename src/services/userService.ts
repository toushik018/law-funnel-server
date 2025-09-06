import { User, IUser } from '../models/User';
import { AuthUtils } from '../utils/auth';
import { ConflictError, NotFoundError, ValidationError } from '../errors';

/**
 * User creation data
 */
export interface CreateUserData {
    name: string;
    email: string;
    password: string;
}

/**
 * User login data
 */
export interface LoginData {
    email: string;
    password: string;
}

/**
 * User response (without password)
 */
export interface UserResponse {
    id: string;
    name: string;
    email: string;

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
 * User profile update data
 */
export interface UpdateProfileData {
    name?: string;
    email?: string;
    company?: string;
    address?: string;
    phone?: string;
    bankName?: string;
    iban?: string;
    bic?: string;
    lawFirm?: string;
}

/**
 * User Service
 * Handles all user-related database operations
 */
export class UserService {
    /**
     * Create a new user
     */
    static async createUser(userData: CreateUserData): Promise<UserResponse> {
        const { name, email, password } = userData;

        // Comprehensive email validation
        const emailValidation = await AuthUtils.validateEmailComprehensive(email);
        if (!emailValidation.isValid) {
            const errorMessage = emailValidation.errors.join('; ');
            throw new ValidationError(`Email validation failed: ${errorMessage}`, undefined, {
                errors: emailValidation.errors,
                warnings: emailValidation.warnings,
                suggestions: emailValidation.suggestions
            });
        }

        // Show warnings if any (but don't block registration)
        if (emailValidation.warnings.length > 0) {
            console.warn('Email validation warnings for', email, ':', emailValidation.warnings);
        }

        // Validate password strength
        const passwordValidation = AuthUtils.validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new ValidationError('Password validation failed', undefined, {
                errors: passwordValidation.errors
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            throw new ConflictError('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await AuthUtils.hashPassword(password);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            profileCompleted: false
        });

        return this.toUserResponse(user);
    }

    /**
     * Authenticate user login
     */
    static async loginUser(loginData: LoginData): Promise<{ user: UserResponse; token: string }> {
        const { email, password } = loginData;

        // Find user by email
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            throw new NotFoundError('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await AuthUtils.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new NotFoundError('Invalid email or password');
        }

        // Generate token
        const token = AuthUtils.generateToken({
            userId: user.id,
            email: user.email,
            name: user.name
        });

        return {
            user: this.toUserResponse(user),
            token
        };
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<UserResponse> {
        const user = await User.findById(userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.toUserResponse(user);
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(email: string): Promise<UserResponse> {
        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.toUserResponse(user);
    }

    /**
     * Update user information
     */
    static async updateUser(userId: string, updateData: UpdateProfileData): Promise<UserResponse> {
        const { name, email, company, address, phone, bankName, iban, bic, lawFirm } = updateData;

        // Validate email if provided
        if (email) {
            const emailValidation = await AuthUtils.validateEmailComprehensive(email);
            if (!emailValidation.isValid) {
                const errorMessage = emailValidation.errors.join('; ');
                throw new ValidationError(`Email validation failed: ${errorMessage}`, undefined, {
                    errors: emailValidation.errors,
                    warnings: emailValidation.warnings,
                    suggestions: emailValidation.suggestions
                });
            }
        }

        // Check if email is already taken by another user
        if (email) {
            const existingUser = await User.findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: userId }
            });

            if (existingUser) {
                throw new ConflictError('Email is already in use');
            }
        }

        // Validate IBAN format if provided
        if (iban && iban.trim()) {
            const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
            if (!ibanRegex.test(iban.toUpperCase().replace(/\s/g, ''))) {
                throw new ValidationError('Invalid IBAN format');
            }
        }

        // Validate BIC format if provided
        if (bic && bic.trim()) {
            const bicRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
            if (!bicRegex.test(bic.toUpperCase().replace(/\s/g, ''))) {
                throw new ValidationError('Invalid BIC format');
            }
        }

        // Validate phone number format if provided (basic validation)
        if (phone && phone.trim()) {
            const phoneRegex = /^[+]?[0-9\s\-\(\)]{7,25}$/;
            if (!phoneRegex.test(phone.trim())) {
                throw new ValidationError('Invalid phone number format');
            }
        }

        const updateFields: any = {};
        if (name !== undefined) updateFields.name = name.trim();
        if (email !== undefined) updateFields.email = email.toLowerCase().trim();
        if (company !== undefined) updateFields.company = company.trim();
        if (address !== undefined) updateFields.address = address.trim();
        if (phone !== undefined) updateFields.phone = phone.trim();
        if (bankName !== undefined) updateFields.bankName = bankName.trim();
        if (iban !== undefined) updateFields.iban = iban.toUpperCase().replace(/\s/g, '');
        if (bic !== undefined) updateFields.bic = bic.toUpperCase().replace(/\s/g, '');
        if (lawFirm !== undefined) updateFields.lawFirm = lawFirm.trim();

        // Get current user to check for profile completion
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            throw new NotFoundError('User not found');
        }

        // Check if profile should be marked as completed
        // Required fields: company, address, phone, bankName, iban, bic, lawFirm
        const requiredFields = {
            company: updateFields.company !== undefined ? updateFields.company : currentUser.company,
            address: updateFields.address !== undefined ? updateFields.address : currentUser.address,
            phone: updateFields.phone !== undefined ? updateFields.phone : currentUser.phone,
            bankName: updateFields.bankName !== undefined ? updateFields.bankName : currentUser.bankName,
            iban: updateFields.iban !== undefined ? updateFields.iban : currentUser.iban,
            bic: updateFields.bic !== undefined ? updateFields.bic : currentUser.bic,
            lawFirm: updateFields.lawFirm !== undefined ? updateFields.lawFirm : currentUser.lawFirm
        };

        // Mark profile as completed if all required fields are filled
        const isProfileComplete = Object.values(requiredFields).every(field => field && field.trim().length > 0);
        if (isProfileComplete && !currentUser.profileCompleted) {
            updateFields.profileCompleted = true;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.toUserResponse(user);
    }

    /**
     * Delete user
     */
    static async deleteUser(userId: string): Promise<void> {
        await User.findByIdAndDelete(userId);
    }

    /**
     * Convert User model to UserResponse (removes password)
     */
    private static toUserResponse(user: IUser): UserResponse {
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            profileCompleted: user.profileCompleted || false,
            company: user.company,
            address: user.address,
            phone: user.phone,
            bankName: user.bankName,
            iban: user.iban,
            bic: user.bic,
            lawFirm: user.lawFirm,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}
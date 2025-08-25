import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

/**
 * Email validation result interface
 */
export interface EmailValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions?: string[];
}

/**
 * Professional Email Validation Service
 * Implements industry-standard email validation techniques used by major companies
 */
export class EmailValidationService {

    // Common disposable email domains that should be blocked
    private static readonly DISPOSABLE_DOMAINS = new Set([
        '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.org',
        'mailinator.com', 'tempmail.org', 'temp-mail.org', 'yopmail.com', 'dispostable.com',
        'throwaway.email', 'fakemailgenerator.com', 'maildrop.cc', 'mailnesia.com',
        'example.com', 'example.org', 'example.net', 'test.com', 'localhost',
        'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
        'grr.la', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamailblock.com'
    ]);

    // Common role-based email prefixes that companies often block
    private static readonly ROLE_BASED_PREFIXES = new Set([
        'admin', 'administrator', 'support', 'help', 'info', 'contact', 'sales',
        'marketing', 'noreply', 'no-reply', 'donotreply', 'do-not-reply',
        'webmaster', 'postmaster', 'hostmaster', 'abuse', 'security',
        'privacy', 'legal', 'compliance', 'billing', 'accounts', 'hr',
        'careers', 'jobs', 'newsletter', 'news', 'notification', 'notifications'
    ]);

    // Common domain typos and their corrections
    private static readonly DOMAIN_CORRECTIONS = new Map([
        ['gmial.com', 'gmail.com'],
        ['gmai.com', 'gmail.com'],
        ['gmail.co', 'gmail.com'],
        ['gmail.cm', 'gmail.com'],
        ['hotmial.com', 'hotmail.com'],
        ['hotmai.com', 'hotmail.com'],
        ['hotmail.co', 'hotmail.com'],
        ['yahoo.co', 'yahoo.com'],
        ['yahooo.com', 'yahoo.com'],
        ['yaho.com', 'yahoo.com'],
        ['outlok.com', 'outlook.com'],
        ['outlook.co', 'outlook.com'],
        ['outloo.com', 'outlook.com'],
        ['icloud.co', 'icloud.com'],
        ['icluod.com', 'icloud.com']
    ]);

    /**
     * Comprehensive email validation
     */
    static async validateEmail(email: string): Promise<EmailValidationResult> {
        const result: EmailValidationResult = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: []
        };

        const trimmedEmail = email.trim().toLowerCase();

        // 1. Basic format validation
        if (!this.validateBasicFormat(trimmedEmail)) {
            result.isValid = false;
            result.errors.push('Invalid email format');
            return result;
        }

        const [localPart, domain] = trimmedEmail.split('@');

        // 2. Local part validation
        const localPartValidation = this.validateLocalPart(localPart);
        if (!localPartValidation.isValid) {
            result.isValid = false;
            result.errors.push(...localPartValidation.errors);
        }

        // 3. Domain validation
        const domainValidation = await this.validateDomain(domain);
        if (!domainValidation.isValid) {
            result.isValid = false;
            result.errors.push(...domainValidation.errors);
        }
        result.warnings.push(...domainValidation.warnings);

        // 4. Check for disposable email domains
        if (this.isDisposableEmail(domain)) {
            result.isValid = false;
            result.errors.push('Disposable email addresses are not allowed. Please use a permanent email address.');
        }

        // 5. Check for role-based emails (warning, not blocking)
        if (this.isRoleBasedEmail(localPart)) {
            result.warnings.push('Role-based email addresses are not recommended for personal accounts');
        }

        // 6. Check for common typos and suggest corrections
        const suggestion = this.suggestDomainCorrection(domain);
        if (suggestion) {
            if (!result.suggestions) {
                result.suggestions = [];
            }
            result.suggestions.push(`Did you mean: ${localPart}@${suggestion}?`);
        }

        return result;
    }

    /**
     * Basic format validation using regex
     */
    private static validateBasicFormat(email: string): boolean {
        // More comprehensive regex for email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email);
    }

    /**
     * Validate the local part (before @) of the email
     */
    private static validateLocalPart(localPart: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (localPart.length === 0) {
            errors.push('Email address cannot be empty');
        }

        if (localPart.length > 64) {
            errors.push('Local part of email address is too long (maximum 64 characters)');
        }

        if (localPart.startsWith('.') || localPart.endsWith('.')) {
            errors.push('Email address cannot start or end with a dot');
        }

        if (localPart.includes('..')) {
            errors.push('Email address cannot contain consecutive dots');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate the domain part and check if it exists
     */
    private static async validateDomain(domain: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (domain.length === 0) {
            errors.push('Domain cannot be empty');
            return { isValid: false, errors, warnings };
        }

        if (domain.length > 253) {
            errors.push('Domain name is too long (maximum 253 characters)');
        }

        // Check if domain has valid TLD
        if (!domain.includes('.') || domain.endsWith('.')) {
            errors.push('Invalid domain format');
            return { isValid: false, errors, warnings };
        }

        // Check for localhost and IP addresses
        if (domain === 'localhost' || this.isIPAddress(domain)) {
            errors.push('Email addresses with localhost or IP addresses are not allowed');
            return { isValid: false, errors, warnings };
        }

        // Verify domain exists by checking MX records
        try {
            await resolveMx(domain);
        } catch (error) {
            // If MX lookup fails, try A record lookup as fallback
            try {
                const resolveA = promisify(dns.resolve4);
                await resolveA(domain);
                warnings.push('Domain exists but has no MX record for email delivery');
            } catch (aError) {
                errors.push('Domain does not exist or cannot receive emails');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Check if domain is a disposable email service
     */
    private static isDisposableEmail(domain: string): boolean {
        return this.DISPOSABLE_DOMAINS.has(domain);
    }

    /**
     * Check if email uses a role-based prefix
     */
    private static isRoleBasedEmail(localPart: string): boolean {
        return this.ROLE_BASED_PREFIXES.has(localPart);
    }

    /**
     * Suggest domain correction for common typos
     */
    private static suggestDomainCorrection(domain: string): string | null {
        return this.DOMAIN_CORRECTIONS.get(domain) || null;
    }

    /**
     * Check if a string is an IP address
     */
    private static isIPAddress(str: string): boolean {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(str) || ipv6Regex.test(str);
    }

    /**
     * Quick validation for basic format checking (synchronous)
     */
    static validateEmailFormat(email: string): boolean {
        return this.validateBasicFormat(email.trim().toLowerCase());
    }
}
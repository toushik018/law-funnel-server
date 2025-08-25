import mongoose from 'mongoose';

/**
 * Mongoose Database Connection
 */

/**
 * Connect to database
 */
export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.DATABASE_URL || 'mongodb://localhost:27017/law-funnel';

        await mongoose.connect(mongoUri);

        console.log('✅ Database connected successfully');
        console.log(`🗄️  Connected to: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
};

/**
 * Disconnect from database
 */
export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('✅ Database disconnected successfully');
    } catch (error) {
        console.error('❌ Database disconnection failed:', error);
        throw error;
    }
};

/**
 * Simple database health check
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
    try {
        // Check if mongoose is connected
        if (mongoose.connection.readyState !== 1) {
            return false;
        }

        // Simple ping to database
        if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
        }
        return true;
    } catch (error) {
        console.error('❌ Database health check failed:', error);
        return false;
    }
};

// Export mongoose for direct access if needed
export { mongoose };
export default mongoose;
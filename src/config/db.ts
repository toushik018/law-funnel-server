import mongoose from 'mongoose';

/**
 * Mongoose Database Connection
 */

/**
 * Connect to database
 */
export const connectDatabase = async (): Promise<void> => {
    try {
        // Don't reconnect if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Database already connected');
            return;
        }

        const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/law-funnel';

        if (!mongoUri || mongoUri === 'mongodb://localhost:27017/law-funnel') {
            console.warn('⚠️  Using default MongoDB URI. Make sure to set DATABASE_URL or MONGODB_URI in production.');
        }

        await mongoose.connect(mongoUri, {
            // These options help with serverless environments
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000, // 45 seconds
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverApi: { version: '1', strict: true, deprecationErrors: true }
        });

        console.log('✅ Database connected successfully');
        console.log(`🗄️  Connected to: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        // Don't throw in production to allow the app to start
        if (process.env.NODE_ENV !== 'production') {
            throw error;
        }
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
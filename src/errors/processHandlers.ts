/**
 * Process Error Handlers
 * Handles uncaught exceptions and unhandled promise rejections
 */

/**
 * Logger for process-level errors
 */
const logProcessError = (type: string, err: any): void => {
    console.error(`\n🔴 ${type.toUpperCase()}! 💥 Shutting down...`);
    console.error('Error Details:', {
        timestamp: new Date().toISOString(),
        type,
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: err.code,
        signal: err.signal
    });
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = (server: any, signal: string): void => {
    console.log(`\n🔄 ${signal} received. Shutting down gracefully...`);

    server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
    });

    // Force close server after 10 seconds
    setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

/**
 * Setup process error handlers
 */
export const setupProcessErrorHandlers = (server?: any): void => {
    // Handle uncaught exceptions
    process.on('uncaughtException', (err: Error) => {
        logProcessError('uncaught exception', err);

        // Exit immediately for uncaught exceptions
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        logProcessError('unhandled rejection', {
            reason,
            promise,
            message: reason?.message || 'Unknown rejection reason'
        });

        // Exit gracefully for unhandled rejections
        process.exit(1);
    });

    // Handle process termination signals (graceful shutdown)
    if (server) {
        process.on('SIGTERM', () => gracefulShutdown(server, 'SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown(server, 'SIGINT'));
    }

    // Handle warnings
    process.on('warning', (warning: Error) => {
        console.warn('⚠️  Process Warning:', {
            timestamp: new Date().toISOString(),
            name: warning.name,
            message: warning.message,
            stack: warning.stack
        });
    });

    console.log('✅ Process error handlers initialized');
};
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { globalErrorHandler, notFoundHandler, setupProcessErrorHandlers } from './errors';
import { sendSuccess } from './utils/apiResponse';
import { connectDatabase, checkDatabaseHealth } from './config/db';
import authRoutes from './routes/auth';
import caseRoutes from './routes/cases';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
    const dbHealthy = await checkDatabaseHealth();

    const healthData = {
        status: dbHealthy ? 'OK' : 'DEGRADED',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: dbHealthy ? 'connected' : 'disconnected'
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode);
    sendSuccess(res, healthData, 'Law Funnel Server health check');
});

// Basic API endpoint
app.get('/api', (req: Request, res: Response) => {
    const apiInfo = {
        name: 'Law Funnel API Server',
        version: '1.0.0',
        description: 'Backend server for law funnel applicationnnn',
        endpoints: [
            'GET /health - Health check',
            'GET /api - API information',
            'POST /api/auth/register - User registration',
            'POST /api/auth/login - User login',
            'GET /api/auth/profile - Get user profile',
            'PUT /api/auth/profile - Update user profile',
            'POST /api/cases - Create new case',
            'GET /api/cases - Get user cases',
            'GET /api/cases/:id - Get specific case',
            'PUT /api/cases/:id/legal-qualification - Update legal qualification',
            'PUT /api/cases/:id/digital-signature - Update digital signature',
            'PUT /api/cases/:id/client-type - Update client type',
            'PUT /api/cases/:id/invoice-processing - Store invoice data',
            'PUT /api/cases/:id/payment-notice - Store payment notice'
        ]
    };

    sendSuccess(res, apiInfo, 'API server information');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

// Use the modular error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
const server = app.listen(PORT, async () => {
    console.log(`🚀 Law Funnel Server running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Connect to database
    try {
        await connectDatabase();
        console.log('🗄️  Database connection established');
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
    }
});

// Setup process error handlers
setupProcessErrorHandlers(server);

export default app;
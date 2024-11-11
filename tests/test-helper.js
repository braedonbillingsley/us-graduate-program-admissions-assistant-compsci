import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Suppress console output during tests
export const suppressLogs = () => {
    let originalLog, originalError, originalWarn;
    
    before(() => {
        originalLog = console.log;
        originalError = console.error;
        originalWarn = console.warn;
        
        console.log = () => {};
        console.error = () => {};
        console.warn = () => {};
    });
    
    after(() => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
    });
};

// Database helpers
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

export const closeDB = async () => {
    try {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    } catch (error) {
        console.error('Database cleanup error:', error);
        process.exit(1);
    }
};

// Export a default object with all helpers
export default {
    connectDB,
    closeDB,
    suppressLogs
};
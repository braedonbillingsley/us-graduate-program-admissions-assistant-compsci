import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Function to connect to the test database
export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to test database');
    } catch (error) {
        console.error('Error connecting to test database:', error);
        process.exit(1);
    }
}

// Function to close database connection
export async function closeDB() {
    try {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        console.log('Test database cleaned and connection closed');
    } catch (error) {
        console.error('Error closing database connection:', error);
        process.exit(1);
    }
}
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import apiRoutes from './routes/api.js';
import { errorHandler } from './utils/errors.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// API Routes
app.use('/api', apiRoutes);

// Error handling
app.use(errorHandler);

// Only start the server if we're not in test mode
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
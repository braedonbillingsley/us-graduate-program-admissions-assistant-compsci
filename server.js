import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import Profile from './models/Profile.js';
import SearchResult from './models/SearchResult.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/submit-profile', async (req, res) => {
    try {
        const profile = new Profile({
            interests: req.body.interests,
            gpa: parseFloat(req.body.gpa),
            researchExp: req.body.researchExp
        });

        await profile.save();

        const searchResult = new SearchResult({
            profile: profile._id,
            results: [
                {
                    university: "Stanford University",
                    program: "Computer Science PhD",
                    matchScore: 95,
                    match: "High match based on research interests",
                    deadline: "December 1, 2024"
                },
                {
                    university: "MIT",
                    program: "EECS PhD",
                    matchScore: 90,
                    match: "Strong research alignment",
                    deadline: "December 15, 2024"
                }
            ],
            metadata: {
                totalMatches: 2
            }
        });

        await searchResult.save();
        res.json({ success: true, matches: searchResult.results });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
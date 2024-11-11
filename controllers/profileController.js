import Profile from '../models/Profile.js';
import SearchResult from '../models/SearchResult.js';
import { cacheGet, cacheSet } from '../utils/cache.js';
import { formatResponse, formatError } from '../utils/responseFormatter.js';
import { ApplicationError } from '../utils/errors.js';

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600;

export const submitProfile = async (req, res, next) => {
    try {
        const profile = new Profile({
            interests: req.body.interests,
            gpa: parseFloat(req.body.gpa),
            researchExp: req.body.researchExp
        });

        await profile.save();

        // Mock program matching (will be replaced with Gemini API)
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

        // Cache the results
        await cacheSet(`matches:${profile._id}`, searchResult, CACHE_TTL);

        res.status(201).json(formatResponse({
            profile: profile,
            matches: searchResult.results
        }));
    } catch (error) {
        next(error);
    }
};

export const getProfileById = async (req, res, next) => {
    try {
        const profile = await Profile.findById(req.params.id);
        if (!profile) {
            throw new ApplicationError('Profile not found', 404);
        }
        res.json(formatResponse({ profile }));
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        const profile = await Profile.findById(req.params.id);
        if (!profile) {
            throw new ApplicationError('Profile not found', 404);
        }

        // Update profile fields
        profile.interests = req.body.interests;
        profile.gpa = parseFloat(req.body.gpa);
        profile.researchExp = req.body.researchExp;

        await profile.save();

        // Invalidate cache
        await cacheSet(`matches:${profile._id}`, null, 0);

        res.json(formatResponse({ profile }));
    } catch (error) {
        next(error);
    }
};

export const getProfileMatches = async (req, res, next) => {
    try {
        // Try to get from cache first
        const cachedResults = await cacheGet(`matches:${req.params.id}`);
        if (cachedResults) {
            return res.json(formatResponse({ matches: cachedResults.results }));
        }

        // If not in cache, get from database
        const searchResult = await SearchResult.findOne({ profile: req.params.id })
            .sort({ 'metadata.timestamp': -1 });

        if (!searchResult) {
            throw new ApplicationError('No matches found for this profile', 404);
        }

        // Cache the results
        await cacheSet(`matches:${req.params.id}`, searchResult, CACHE_TTL);

        res.json(formatResponse({ matches: searchResult.results }));
    } catch (error) {
        next(error);
    }
};
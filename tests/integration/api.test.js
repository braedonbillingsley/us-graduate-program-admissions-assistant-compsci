import request from 'supertest';
import { expect } from 'chai';
import mongoose from 'mongoose';
import { connectDB, closeDB, suppressLogs  } from '../test-helper.js';
import Profile from '../../models/Profile.js';
import SearchResult from '../../models/SearchResult.js';
import app from '../../server.js';

describe('API Endpoints', function() {
    this.timeout(10000);
    suppressLogs();
    let testProfile;
    let testSearchResult;

    before(async function() {
        await connectDB();
    });

    after(async function() {
        await closeDB();
    });

    beforeEach(async function() {
        // Clear the database before each test
        await Profile.deleteMany({});
        await SearchResult.deleteMany({});
    });

    describe('POST /api/profiles', function() {
        const validProfile = {
            interests: ['Machine Learning', 'Computer Vision'],
            gpa: 3.8,
            researchExp: 'Conducted research in computer vision for 2 years, focusing on object detection and tracking.'
        };

        it('should create a new profile and return matches', async function() {
            const response = await request(app)
                .post('/api/profiles')
                .send(validProfile)
                .expect(201);

            expect(response.body.success).to.be.true;
            expect(response.body.data.profile).to.exist;
            expect(response.body.data.matches).to.be.an('array');
            expect(response.body.data.matches).to.have.lengthOf(2);
        });

        it('should validate required fields', async function() {
            const invalidProfile = {
                gpa: 3.8 // Missing required fields
            };

            const response = await request(app)
                .post('/api/profiles')
                .send(invalidProfile)
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
            expect(response.body.error.details).to.be.an('array');
        });

        it('should validate GPA range', async function() {
            const invalidProfile = {
                ...validProfile,
                gpa: 5.0
            };

            const response = await request(app)
                .post('/api/profiles')
                .send(invalidProfile)
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
            expect(response.body.error.details).to.be.an('array');
            expect(response.body.error.details[0]).to.have.property('field', 'gpa');
        });

        it('should validate research experience length', async function() {
            const invalidProfile = {
                ...validProfile,
                researchExp: 'Too short'
            };

            const response = await request(app)
                .post('/api/profiles')
                .send(invalidProfile)
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
            expect(response.body.error.details).to.be.an('array');
            expect(response.body.error.details[0]).to.have.property('field', 'researchExp');
        });
    });

    describe('GET /api/profiles/:id', function() {
        beforeEach(async function() {
            // Create a test profile
            testProfile = await new Profile({
                interests: ['Machine Learning'],
                gpa: 3.8,
                researchExp: 'Valid research experience of more than 50 characters for testing purposes.'
            }).save();
        });

        it('should return a profile by id', async function() {
            const response = await request(app)
                .get(`/api/profiles/${testProfile._id}`)
                .expect(200);

            expect(response.body.success).to.be.true;
            expect(response.body.data.profile).to.exist;
            expect(response.body.data.profile._id).to.equal(testProfile._id.toString());
        });

        it('should return 404 for non-existent profile', async function() {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/profiles/${fakeId}`)
                .expect(404);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
            expect(response.body.error.message).to.equal('Profile not found');
        });

        it('should handle invalid MongoDB ObjectId', async function() {
            const response = await request(app)
                .get('/api/profiles/invalid-id')
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
        });
    });

    describe('PUT /api/profiles/:id', function() {
        beforeEach(async function() {
            testProfile = await new Profile({
                interests: ['Machine Learning'],
                gpa: 3.8,
                researchExp: 'Valid research experience of more than 50 characters for testing purposes.'
            }).save();
        });

        it('should update an existing profile', async function() {
            const updatedData = {
                interests: ['Deep Learning', 'NLP'],
                gpa: 3.9,
                researchExp: 'Updated research experience with more than 50 characters for testing the update functionality.'
            };

            const response = await request(app)
                .put(`/api/profiles/${testProfile._id}`)
                .send(updatedData)
                .expect(200);

            expect(response.body.success).to.be.true;
            expect(response.body.data.profile.interests).to.deep.equal(updatedData.interests);
            expect(response.body.data.profile.gpa).to.equal(updatedData.gpa);
        });

        it('should handle validation errors for invalid GPA', async function() {
            const invalidUpdate = {
                interests: ['Machine Learning'],
                gpa: 5.0,
                researchExp: 'Valid research experience of more than 50 characters for testing purposes.'
            };

            const response = await request(app)
                .put(`/api/profiles/${testProfile._id}`)
                .send(invalidUpdate)
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
            expect(response.body.error.details).to.be.an('array');
            expect(response.body.error.details[0]).to.have.property('field', 'gpa');
        });

        it('should handle non-existent profile', async function() {
            const fakeId = new mongoose.Types.ObjectId();
            const validUpdate = {
                interests: ['Machine Learning'],
                gpa: 3.9,
                researchExp: 'Valid research experience of more than 50 characters for testing purposes.'
            };

            const response = await request(app)
                .put(`/api/profiles/${fakeId}`)
                .send(validUpdate)
                .expect(404);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
            expect(response.body.error.message).to.equal('Profile not found');
        });
    });

    describe('GET /api/profiles/:id/matches', function() {
        beforeEach(async function() {
            // Create test profile and search results
            testProfile = await new Profile({
                interests: ['Machine Learning'],
                gpa: 3.8,
                researchExp: 'Valid research experience of more than 50 characters for testing purposes.'
            }).save();

            testSearchResult = await new SearchResult({
                profile: testProfile._id,
                results: [{
                    university: "Stanford University",
                    program: "Computer Science PhD",
                    matchScore: 95,
                    match: "Strong research alignment",
                    deadline: "December 1, 2024"
                }],
                metadata: {
                    totalMatches: 1
                }
            }).save();
        });

        it('should return matches for a profile', async function() {
            const response = await request(app)
                .get(`/api/profiles/${testProfile._id}/matches`)
                .expect(200);

            expect(response.body.success).to.be.true;
            expect(response.body.data.matches).to.be.an('array');
            expect(response.body.data.matches).to.have.lengthOf(1);
            expect(response.body.data.matches[0].university).to.equal('Stanford University');
        });

        it('should handle no matches found', async function() {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/profiles/${fakeId}/matches`)
                .expect(404);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
            expect(response.body.error.message).to.equal('No matches found for this profile');
        });

        it('should return cached results if available', async function() {
            // Make first request to cache the results
            await request(app)
                .get(`/api/profiles/${testProfile._id}/matches`)
                .expect(200);

            // Delete the search result from database to verify cache is being used
            await SearchResult.deleteMany({});

            // Should still return results from cache
            const response = await request(app)
                .get(`/api/profiles/${testProfile._id}/matches`)
                .expect(200);

            expect(response.body.success).to.be.true;
            expect(response.body.data.matches).to.be.an('array');
            expect(response.body.data.matches).to.have.lengthOf(1);
            expect(response.body.data.matches[0].university).to.equal('Stanford University');
        });

        it('should handle invalid MongoDB ObjectId', async function() {
            const response = await request(app)
                .get('/api/profiles/invalid-id/matches')
                .expect(400);

            expect(response.body.success).to.be.false;
            expect(response.body.error).to.exist;
        });
    });
});
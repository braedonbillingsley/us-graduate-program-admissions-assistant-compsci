import mongoose from 'mongoose';
import { expect } from 'chai';
import { connectDB, closeDB, suppressLogs } from '../test-helper.js';
import Profile from '../../models/Profile.js';
import SearchResult from '../../models/SearchResult.js';

describe('Profile Model Tests', function() {
    // Increase timeout for database operations
    this.timeout(10000);
    suppressLogs();

    before(async function() {
        await connectDB();
    });

    after(async function() {
        await closeDB();
    });

    beforeEach(async function() {
        try {
            await Profile.deleteMany({});
            await SearchResult.deleteMany({});
        } catch (error) {
            console.error('Error in beforeEach:', error);
            throw error;
        }
    });

    describe('Profile Creation', function() {
        it('should create a valid profile', async function() {
            const validProfile = {
                interests: ['Machine Learning', 'Computer Vision'],
                gpa: 3.8,
                researchExp: 'Conducted research in computer vision for 2 years, focusing on object detection and tracking.'
            };

            const profile = new Profile(validProfile);
            const savedProfile = await profile.save();
            
            expect(savedProfile._id).to.exist;
            expect(savedProfile.interests).to.have.lengthOf(2);
            expect(savedProfile.gpa).to.equal(3.8);
        });

        it('should fail with invalid GPA', async function() {
            const invalidProfile = {
                interests: ['Machine Learning'],
                gpa: 4.5,
                researchExp: 'Valid research experience'
            };

            try {
                const profile = new Profile(invalidProfile);
                await profile.save();
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error).to.be.instanceOf(mongoose.Error.ValidationError);
                expect(error.errors.gpa).to.exist;
            }
        });
    });
});

describe('SearchResult Model Tests', function() {
    this.timeout(10000);
    let testProfile;

    before(async function() {
        if (!mongoose.connection.readyState) {
            await connectDB();
        }
        
        try {
            testProfile = await new Profile({
                interests: ['Machine Learning'],
                gpa: 3.8,
                researchExp: 'Valid research experience of more than 50 characters for testing purposes.'
            }).save();
        } catch (error) {
            console.error('Error creating test profile:', error);
            throw error;
        }
    });

    after(async function() {
        await closeDB();
    });

    beforeEach(async function() {
        try {
            await SearchResult.deleteMany({});
        } catch (error) {
            console.error('Error in beforeEach:', error);
            throw error;
        }
    });

    it('should create valid search results', async function() {
        const searchResult = {
            profile: testProfile._id,
            results: [{
                university: 'Stanford University',
                program: 'Computer Science PhD',
                matchScore: 95,
                match: 'Strong research alignment',
                deadline: 'December 1, 2024'
            }],
            metadata: {
                totalMatches: 1
            }
        };

        const result = new SearchResult(searchResult);
        const savedResult = await result.save();
        
        expect(savedResult.results).to.have.lengthOf(1);
        expect(savedResult.results[0].matchScore).to.equal(95);
        expect(savedResult.metadata.totalMatches).to.equal(1);
    });
});
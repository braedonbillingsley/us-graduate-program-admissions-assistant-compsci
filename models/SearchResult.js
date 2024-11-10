import mongoose from 'mongoose';
const { Schema } = mongoose;

const searchResultSchema = new Schema({
    profile: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true
    },
    
    results: [{
        university: {
            type: String,
            required: true
        },
        program: {
            type: String,
            required: true
        },
        matchScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        match: {
            type: String,
            required: true
        },
        deadline: {
            type: String,
            required: true
        }
    }],
    
    metadata: {
        timestamp: {
            type: Date,
            default: Date.now
        },
        totalMatches: {
            type: Number,
            required: true
        }
    }
});

export default mongoose.model('SearchResult', searchResultSchema);
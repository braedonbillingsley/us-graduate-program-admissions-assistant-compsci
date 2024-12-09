import mongoose from 'mongoose';
const { Schema } = mongoose;

const profileSchema = new Schema({
    interests: {
        type: [String],
        required: true,
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'At least one research interest is required'
        }
    },
    gpa: {
        type: Number,
        required: true,
        min: [0, 'GPA cannot be negative'],
        max: [4.0, 'GPA cannot exceed 4.0']
    },
    researchExp: {
        type: String,
        required: true,
        minlength: [50, 'Research experience must be at least 50 characters']
    },
    created: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

profileSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

export default mongoose.model('Profile', profileSchema);
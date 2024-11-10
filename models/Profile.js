const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    interests: {
        type: String,
        required: true
    },
    gpa: {
        type: Number,
        required: true,
        min: 0,
        max: 4.0
    },
    researchExp: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Profile', profileSchema);

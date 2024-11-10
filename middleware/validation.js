const { body, validationResult } = require('express-validator');

const profileValidationRules = [
    body('interests')
        .isArray()
        .withMessage('Research interests must be an array')
        .custom(value => {
            return value.length > 0 && value.every(interest => 
                typeof interest === 'string' && interest.trim().length > 0
            );
        })
        .withMessage('Please provide at least one valid research interest'),

    body('gpa')
        .notEmpty()
        .withMessage('GPA is required')
        .isFloat({ min: 0, max: 4.0 })
        .withMessage('GPA must be between 0 and 4.0'),

    body('researchExp')
        .notEmpty()
        .withMessage('Research experience is required')
        .isString()
        .trim()
        .isLength({ min: 50 })
        .withMessage('Research experience must be at least 50 characters long')
];

const validateProfile = async (req, res, next) => {
    try {
        // Log incoming request for debugging
        console.log('Incoming request body:', req.body);

        // Run validation
        await Promise.all(profileValidationRules.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Validation failed',
                details: errors.array()
            });
        }

        // Ensure interests is an array
        if (typeof req.body.interests === 'string') {
            req.body.interests = req.body.interests
                .split(',')
                .map(interest => interest.trim())
                .filter(interest => interest.length > 0);
        }

        // Convert GPA to float
        req.body.gpa = parseFloat(req.body.gpa);

        next();
    } catch (error) {
        console.error('Validation error:', error);
        next(error);
    }
};

module.exports = {
    validateProfile
};
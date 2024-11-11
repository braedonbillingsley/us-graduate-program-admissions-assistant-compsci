import { body, param, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';
import mongoose from 'mongoose';

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

export const validateMongoId = (paramName = 'id') => [
    param(paramName)
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid MongoDB ObjectId');
            }
            return true;
        })
];

export const validateProfile = async (req, res, next) => {
    try {
        // Run validation
        await Promise.all(profileValidationRules.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError(errors.array());
        }

        // Ensure interests is an array
        if (typeof req.body.interests === 'string') {
            req.body.interests = req.body.interests
                .split(',')
                .map(interest => interest.trim())
                .filter(interest => interest.length > 0);
        }

        // Convert GPA to float
        if (req.body.gpa) {
            req.body.gpa = parseFloat(req.body.gpa);
        }

        next();
    } catch (error) {
        next(error);
    }
};
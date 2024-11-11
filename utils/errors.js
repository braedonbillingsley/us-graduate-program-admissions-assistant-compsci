export class ApplicationError extends Error {
    constructor(message, status = 500, details = null) {
        super(message);
        this.name = 'ApplicationError';
        this.status = status;
        this.details = details;
    }
}

export class ValidationError extends ApplicationError {
    constructor(errors) {
        const details = Array.isArray(errors) ? errors.map(err => ({
            field: err.param || err.path,
            message: err.msg || err.message,
            value: err.value
        })) : errors;

        super('Validation failed', 400, details);
        this.name = 'ValidationError';
    }
}

export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err instanceof ValidationError) {
        return res.status(400).json({
            success: false,
            error: {
                message: err.message,
                details: err.details
            }
        });
    }

    if (err instanceof ApplicationError) {
        return res.status(err.status).json({
            success: false,
            error: {
                message: err.message,
                details: err.details
            }
        });
    }

    // Handle mongoose errors
    if (err.name === 'MongoError' || err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid data provided',
                details: [{ field: 'general', message: err.message }]
            }
        });
    }

    // Handle invalid MongoDB ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Invalid ID format',
                details: [{ field: 'id', message: 'Invalid MongoDB ObjectId format' }]
            }
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : null
        }
    });
};
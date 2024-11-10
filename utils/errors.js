class ApplicationError extends Error {
    constructor(message, status = 500, details = null) {
        super(message);
        this.name = 'ApplicationError';
        this.status = status;
        this.details = details;
    }
}

class ValidationError extends ApplicationError {
    constructor(errors) {
        super('Validation failed', 400, errors);
        this.name = 'ValidationError';
    }
}

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof ApplicationError) {
        return res.status(err.status).json({
            success: false,
            error: err.message,
            details: err.details
        });
    }

    // Handle mongoose errors
    if (err.name === 'MongoError' || err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid data provided',
            details: err.message
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
};

module.exports = {
    ApplicationError,
    ValidationError,
    errorHandler
};
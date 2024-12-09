export const formatResponse = (data, message = 'Success') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

export const formatError = (error, status = 500) => {
    return {
        success: false,
        error: {
            message: error.message || 'Internal server error',
            status,
            details: error.details || null
        },
        timestamp: new Date().toISOString()
    };
};

// Format validation errors
export const formatValidationError = (errors) => {
    return formatError({
        message: 'Validation failed',
        details: errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }))
    }, 400);
};
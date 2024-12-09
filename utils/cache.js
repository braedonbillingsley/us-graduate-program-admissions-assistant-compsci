import NodeCache from 'node-cache';

// Initialize cache with default TTL of 1 hour
const cache = new NodeCache({
    stdTTL: 3600,
    checkperiod: 120
});

export const cacheGet = async (key) => {
    try {
        return cache.get(key);
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
};

export const cacheSet = async (key, value, ttl) => {
    try {
        return cache.set(key, value, ttl);
    } catch (error) {
        console.error('Cache set error:', error);
        return false;
    }
};

export const cacheDelete = async (key) => {
    try {
        return cache.del(key);
    } catch (error) {
        console.error('Cache delete error:', error);
        return false;
    }
};

// Clear cache when server starts
cache.flushAll();

export default cache;
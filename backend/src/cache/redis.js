import Redis from 'ioredis';

export const redis = {
    connection: null,
    /**
     * @returns {Redis}
     */
    getConnection: function() {
        if(process.env.REDIS_ENABLED === 'true') {
            if(this.connection) return this.connection;
            this.connection = new Redis(Number(process.env.REDIS_PORT), process.env.REDIS_URL);
            return this.connection;
        }

        throw new Error('Redis is unavailable');
    },
    /**
     * @param {string} key 
     * @returns {*}
     */
    get: async function(key) {
        const redis = this.getConnection();
        return await redis.get(key);
    },
    /**
     * @param {string} key 
     * @param {*} value 
     * @param {number} ttl TTL in seconds 
     * @returns {boolean}
     */
    set: async function(key, value, ttl) {
        const redis = this.getConnection();
        if(ttl) {
            return await redis.set(key, value, 'EX', ttl);
        }

        return await redis.set(key, value);
    },
    /**
     * @param {string} key 
     * @returns {number}
     */
    delete: async function(key) {
        const redis = this.getConnection();
        return await redis.del(key);
    }
};
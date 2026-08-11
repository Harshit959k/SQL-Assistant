import NodeCache from 'node-cache';

const cache = new NodeCache();

export const inMemory = {
    /**
     * @param {string} key 
     * @returns {*}
     */
    get: (key) => {
        return cache.get(key);
    },
    /**
     * @param {string} key 
     * @param {*} value 
     * @param {number} ttl TTL in seconds 
     * @returns {boolean}
     */
    set: (key, value, ttl) => {
        return cache.set(key, value, ttl);
    },
    /**
     * @param {string} key 
     * @returns {number}
     */
    delete: (key) => {
        return cache.del(key);
    }
};

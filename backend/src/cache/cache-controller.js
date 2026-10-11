import { inMemory } from "./in-memory.js";

export const cacheController = {
    get: async (key, ctx = inMemory) => {
        try {
            return await ctx.get(key);
        } catch (err) {
            console.log('Error in get ==>', err);
            throw err;
        }
    },
    set: async (key, value, ttl, ctx = inMemory) => {
        try {
            return await ctx.set(key, value, ttl);
        } catch (err) {
            console.log('Error in set ==>', err);
            throw err;
        }
    },
    del: async (key, ctx = inMemory) => {
        try {
            return await ctx.delete(key);
        } catch (err) {
            console.log('Error in del ==>', err);
            throw err;
        }
    }
};

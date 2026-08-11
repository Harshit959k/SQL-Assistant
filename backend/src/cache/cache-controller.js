import { inMemory } from "./in-memory.js";

export const cacheController = {
    get: (key, ctx = inMemory) => {
        try {
            return ctx.get(key);
        } catch (err) {
            console.log('Error in get ==>', err);
        }
    },
    set: (key, value, ttl, ctx = inMemory) => {
        try {
            return ctx.set(key, value, ttl);
        } catch (err) {
            console.log('Error in set ==>', err);
        }
    },
    del: (key, ctx = inMemory) => {
        try {
            return ctx.delete(key);
        } catch (err) {
            console.log('Error in del ==>', err);
        }
    }
};

import { OpenAI } from 'openai';

let client;

/**
 * @returns {OpenAI}
 */
export const getClient = () => {
    if(!client) {
        client = new OpenAI({
            baseURL: process.env.BASE_URL,
            apiKey: process.env.API_KEY
        })
    }

    return client;
};

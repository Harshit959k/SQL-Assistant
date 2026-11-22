import { OpenAI } from 'openai';

let client;

/**
 * @returns {OpenAI}
 */
const getClient = () => {
    if(!client) {
        client = new OpenAI({
            baseURL: process.env.BASE_URL,
            apiKey: process.env.API_KEY
        });
    }

    return client;
};

export const query = async (conversation, streaming = true, model = process.env.MODEL) => {
    const client = getClient();
    return await client.chat.completions.create({
        model: model,
        messages: conversation,
        stream: streaming
    });
};

export const structuredQuery = async (conversation, responseSchema, model = process.env.MODEL) => {
    const client = getClient();
    return await client.chat.completions.parse({
        model: model,
        messages: conversation,
        response_format: responseSchema
    });
};

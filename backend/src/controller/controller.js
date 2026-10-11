import { cacheController } from "../cache/cache-controller.js"
import { randomUUID } from 'node:crypto';
import { Databases, DEFAULT_TTL, SYSTEM_PROMPT } from "../utils/constants.js";
import { MySqlAdapter } from "../connectors/mysql.js";
import { constructQuery, normalizeSchema } from "../utils/utils.js";
import { getEmbedder } from "../utils/embedder.js";
import { client } from "../database/qdrant.js";
import { getClient } from "../llm/llm.js";
import { AppError } from "../utils/AppError.js";
import { redis } from "../cache/redis.js";
import { PostgresAdapter } from "../connectors/postgres.js";

export const getConnection = async (req, connectionId) => {
    let connection = await cacheController.get(connectionId, redis);
    if(!connection) throw new AppError('Connection does not exist', '58');
    connection = JSON.parse(connection);

    return { host: connection.host, port: connection.port, database: connection.database };
}

/**
 * @param {*} req 
 * @param {{ type: string, host: string, port: string, username: string, password: string, database: string }} connectionDetails 
 */
export const handleConnection = async (req, connectionDetails) => {
    const connectionId = randomUUID();
    await cacheController.set(connectionId, JSON.stringify(connectionDetails), undefined, redis);

    let dbHandler;
    switch (connectionDetails.type?.toLowerCase()) {
        case Databases.mysql:
        case Databases.postgres:
            dbHandler = handleSql;
            break;
        default:
            throw new AppError('Invalid database type', '58');
    }

    await dbHandler(req, connectionId, connectionDetails);

    return { connectionId };
}

/**
 * @param {*} req 
 * @param {string} connectionId 
 */
export const setupConversation = async (req, connectionId) => {
    const connection = await cacheController.get(connectionId, redis);
    if(!connection) {
        throw new AppError('Connection not found', '58');
    }

    const conversationId = randomUUID();
    await cacheController.set(`${connectionId}:${conversationId}`, JSON.stringify([
        {
            role: 'system',
            content: SYSTEM_PROMPT
        }
    ]), DEFAULT_TTL, redis);

    return { conversationId };
}

/**
 * @param {*} req 
 * @param {string} connectionId 
 * @param {string | undefined} conversationId 
 * @param {string} query
 */
export async function* handleConversation (req, connectionId, conversationId, query) {
    let conversation = await cacheController.get(`${connectionId}:${conversationId}`, redis);
    if(!conversation)
        throw new AppError('Conversation not found or expired', '58');

    conversation = JSON.parse(conversation);

    const embedder = await getEmbedder();
    const queryEmbedding = await embedder(query, {
        normalize: true, // Change the magnitude/length of vector without changing it's direction
        pooling: 'mean' // Converts token vectors into a single vector
    });

    const queryResult = await client.query(connectionId, {
        query: Array.from(queryEmbedding.data),
        with_payload: true,
        limit: 10
    });

    const constructedQuery = constructQuery(query, queryResult.points.map(elem => elem.payload.embeddingStr).join('\n\n'));
    const llmClient = getClient();
    const response = await llmClient.chat.completions.create({
        model: "gemini-3.5-flash",
        messages: [
            ...conversation,
            {
                role: 'user',
                content: constructedQuery
            }
        ],
        stream: true
    });

    let outputMessage = '';
    for await (let chunk of response) {
        if(chunk.choices[0].delta.content) {
            outputMessage += chunk.choices[0].delta.content;
            yield chunk.choices[0].delta.content;
        }
    }

    conversation.push({
        role: 'user',
        content: query
    });
    conversation.push({
        role: 'assistant',
        content: outputMessage
    });

    await cacheController.set(`${connectionId}:${conversationId}`, JSON.stringify(conversation), DEFAULT_TTL, redis);
    return JSON.stringify({ done: true });
}

const adapters = {
    mysql: () => new MySqlAdapter(),
    postgres: () => new PostgresAdapter(),
};
 
function toCredentials(type, details) {
    const base = {
        host: details.host,
        port: details.port,
        user: details.username,
        password: details.password,
        database: details.database,
    };
 
    if (type === Databases.postgres) base.schema = details.schema || 'public';
 
    return base;
}

async function handleSql(req, connectionId, connectionDetails) {
    const type = connectionDetails.type?.toLowerCase();
    const createAdapter = adapters[type];
    const connHandler = createAdapter();
    await connHandler.connect(toCredentials(type, connectionDetails));
    const result = await connHandler.getSchema();
    const schema = normalizeSchema(connectionId, result.columns, result.relations);
    const embedder = await getEmbedder();
    for(let record of schema) {
        const embedding = await embedder(record.embeddingStr, {
            normalize: true, // Change the magnitude/length of vector without changing it's direction
            pooling: 'mean' // Converts token vectors into a single vector
        });

        record.embeddingVector = embedding.data;
    }

    const collectionExists = await client.collectionExists(connectionId);
    if(!collectionExists.exists) {
        await client.createCollection(connectionId, {
            vectors: {
                size: 384,
                distance: 'Dot'
            }
        });
    }

    const opResult = await client.upsert(connectionId, {
        wait: true,
        points: schema.map(embedding => {
            return {
                id: randomUUID(),
                vector: Array.from(embedding.embeddingVector),
                payload: {
                    table: embedding.tableName,
                    embeddingStr: embedding.embeddingStr
                }
            }
        })
    });

    await connHandler.close();

    return { success: true };
}

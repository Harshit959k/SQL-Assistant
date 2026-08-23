import { cacheController } from "../cache/cache-controller.js"
import { randomUUID } from 'node:crypto';
import { Databases, SYSTEM_PROMPT } from "../utils/constants.js";
import { MySqlAdapter } from "../connectors/mysql.js";
import { constructQuery, normalizeMySQLSchema } from "../utils/utils.js";
import { getEmbedder } from "../utils/embedder.js";
import { client } from "../database/qdrant.js";
import { getClient } from "../llm/llm.js";

export const getConnection = async (req, connectionId) => {
    let connection = cacheController.get(connectionId);
    if(!connection) throw new Error('Connection does not exist');
    connection = JSON.parse(connection);

    return { host: connection.host, port: connection.port, database: connection.database };
}

/**
 * @param {*} req 
 * @param {{ type: string, host: string, port: string, username: string, password: string, database: string }} connectionDetails 
 */
export const handleConnection = async (req, connectionDetails) => {
    const connectionId = randomUUID();
    const conn = cacheController.set(connectionId, JSON.stringify(connectionDetails));

    let dbHandler;
    switch (connectionDetails.type?.toLowerCase()) {
        case Databases.mysql:
            dbHandler = handleMySql;
            break;
        default:
            throw new Error('Invalid database type');
    }

    const result = await dbHandler(req, connectionId, connectionDetails);

    return { connectionId };
}

/**
 * @param {*} req 
 * @param {string} connectionId 
 */
export const setupConversation = async (req, connectionId) => {
    const connection = cacheController.get(connectionId);
    if(!connection) {
        return {
            code: '39',
            message: 'No connection found'
        };
    }

    const conversationId = randomUUID();
    cacheController.set(`${connectionId}:${conversationId}`, JSON.stringify([
        {
            role: 'system',
            content: SYSTEM_PROMPT
        }
    ]));

    return { conversationId };
}

/**
 * @param {*} req 
 * @param {string} connectionId 
 * @param {string | undefined} conversationId 
 * @param {string} query
 */
export async function* handleConversation (req, connectionId, conversationId, query) {
    let conversation = cacheController.get(`${connectionId}:${conversationId}`);
    if(!conversation)
        throw new Error('Invalid conversation');

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

    cacheController.set(`${connectionId}:${conversationId}`, JSON.stringify(conversation));
    return JSON.stringify({ done: true });
}

async function handleMySql(req, connectionId, connectionDetails) {
    const connHandler = new MySqlAdapter();

    await connHandler.connect({
        host: connectionDetails.host,
        port: connectionDetails.port,
        user: connectionDetails.username,
        password: connectionDetails.password,
        database: connectionDetails.database
    });

    const result = await connHandler.getSchema();

    const schema = normalizeMySQLSchema(connectionId, result.columns, result.relations);
    // console.log("schema ==>", schema);

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
    console.log(opResult);

    return { success: true };
}

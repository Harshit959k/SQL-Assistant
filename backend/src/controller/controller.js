import { cacheController } from "../cache/cache-controller.js"
import { randomUUID } from 'node:crypto';
import { Databases } from "../utils/constants.js";
import { MySqlAdapter } from "../connectors/mysql.js";
import { normalizeMySQLSchema } from "../utils/utils.js";
import { getEmbedder } from "../utils/embedder.js";
import { client } from "../database/qdrant.js";

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

    const embeddingData = normalizeMySQLSchema(connectionId, result.columns, result.relations);
    // console.log("embeddingData ==>", embeddingData);

    const embedder = await getEmbedder();
    for(let record of embeddingData) {
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
        points: embeddingData.map(embedding => {
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

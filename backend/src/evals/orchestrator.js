import { MySqlAdapter } from '../connectors/mysql.js';
import { client } from '../database/qdrant.js';
import { getEmbedder } from '../utils/embedder.js';
import { constructQuery, normalizeSchema } from '../utils/utils.js';
import { randomUUID } from 'node:crypto';
import { evaluateRetrievalPrecision } from './evaluators/retrieval-precision.js';
import { evaluateRetrievalRecall } from './evaluators/retrieval-recall.js';
import { evaluateGroundedness } from './evaluators/groundedness.js';
import { query } from '../llm/llm.js';
import { EVAL_SLEEP_TIMER, SYSTEM_PROMPT } from '../utils/constants.js';
import { evaluateCompleteness } from './evaluators/completeness.js';
import { evaluateCorrectness } from './evaluators/correctness.js';

export async function runEvaluations(dataset, connectionDetails) {
    try {
        const { connectionId } = await setupConnection(connectionDetails);

        for(let record of dataset) {
            const embedder = await getEmbedder();
            const embedding = await embedder(record.question, {
                normalize: true,
                pooling: 'mean'
            });

            const queryResult = await client.query(connectionId, {
                query: Array.from(embedding.data),
                with_payload: true,
                limit: 10
            });

            const chunks = queryResult.points.map(elem => elem.payload.embeddingStr).join('\n\n');
            const generatedAnswer = await generateAnswer(record, chunks);
            const totalChunks = queryResult.points.length;

            const precisionResult = await evaluateRetrievalPrecision(record, chunks);
            await sleep(EVAL_SLEEP_TIMER);

            const recallResult = await evaluateRetrievalRecall(record, chunks);
            await sleep(EVAL_SLEEP_TIMER);
            
            const groundednessResult = await evaluateGroundedness(record, generatedAnswer, chunks);
            await sleep(EVAL_SLEEP_TIMER);
            
            const completenessResult = await evaluateCompleteness(record, generatedAnswer);
            await sleep(EVAL_SLEEP_TIMER);
            
            const correctnessResult = await evaluateCorrectness(record, generatedAnswer);
            await sleep(EVAL_SLEEP_TIMER);
        }
    } catch (err) {
        console.log('Error in evaluation pipeline ==>', err);
    }
}

async function setupConnection(connectionDetails) {
    const mySql = new MySqlAdapter();
    await mySql.connect(connectionDetails);
    console.log('--- DB Connected ---');

    const schema = await mySql.getSchema();

    const normalizedSchema = normalizeSchema('', schema.columns, schema.relations);

    const embedder = await getEmbedder();
    for(let record of normalizedSchema) {
        const embedding = await embedder(record.embeddingStr, {
            normalize: true, // Change the magnitude/length of vector without changing it's direction
            pooling: 'mean' // Converts token vectors into a single vector
        });

        record.embeddingVector = embedding.data;
    }

    const connectionId = randomUUID();

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
        points: normalizedSchema.map(embedding => {
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

    return { connectionId };
}

async function generateAnswer(record, chunks) {
    const userQuery = constructQuery(record.question, chunks);

    const conversation = [
        {
            role: 'system',
            content: SYSTEM_PROMPT
        },
        {
            role: 'user',
            content: userQuery
        }
    ];

    const response = await query(conversation, false);
    return response.choices[0].message.content;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // To prevent hittig rate limits

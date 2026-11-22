import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { structuredQuery } from "../../llm/llm.js";
import { z } from 'zod';

const SYSTEM_PROMPT = `
        You are a LLM evaluation judge tasked with evaluating recall of the retrieval pipeline.
        You will be provided with a question, corresponding correct answer, retrieved chunks and evaluation metric.
        You need to evaluate the retrieved chunks for if all the required chunks were retrieved. return the score (0-1) and number of relevant chunks.
    `;

const prompt = (question, answer, chunks, metric) => {
    return `
        <question>
            ${question}
        </question>
        <correctanswer>
            ${answer}
        </correctanswer>
        <evaluationmetric>
            ${metric}
        </evaluationmetric>
        <retrievedchunks>
            ${chunks}
        </retrievedchunks>
    `;
};

const responseSchema = z.object({
    relevantChunks: z.number().describe('Total number of relevant chunks'),
    score: z.float32().describe('A 1-decimal precision number representing the context recall score')
});

export async function evaluateRetrievalRecall(data, chunks) {
    const conversation = [
        {
            role: 'system',
            content: SYSTEM_PROMPT
        },
        {
            role: 'user',
            content: prompt(data.question, data.answer, chunks, data.evaluation)
        }
    ];

    const response = await structuredQuery(conversation, zodResponseFormat(responseSchema, 'context_recall_result'));
    return response.choices[0];
}

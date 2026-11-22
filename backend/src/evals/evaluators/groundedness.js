import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { structuredQuery } from "../../llm/llm.js";
import { z } from 'zod';

const SYSTEM_PROMPT = `
        You are a LLM evaluation judge tasked with evaluating faithfulness/groundedness of the RAG pipeline.
        You will be provided with a question, generated answer, retrieved chunks and evaluation metric.
        You need to decompose the generated answer into claims, evaluate the retrieved chunks and return the total claims, supported claims and score on scale of 0-1.
    `;

const prompt = (question, answer, chunks, metric) => {
    return `
        <question>
            ${question}
        </question>
        <answer>
            ${answer}
        </answer>
        <evaluationmetric>
            ${metric}
        </evaluationmetric>
        <retrievedchunks>
            ${chunks}
        </retrievedchunks>
    `;
};

const responseSchema = z.object({
    totalClaims: z.number().describe('Total number of claims in the generated answers'),
    supportedClaims: z.number().describe('Total number of claims supported/grounded in the retrieved chunks'),
    score: z.float32().describe('A 1-decimal precision number representing the faithfulness/groundedness score')
});

export async function evaluateGroundedness(data, generatedAnswer, chunks) {
    const conversation = [
        {
            role: 'system',
            content: SYSTEM_PROMPT
        },
        {
            role: 'user',
            content: prompt(data.question, generatedAnswer, chunks, data.evaluation)
        }
    ];

    const response = await structuredQuery(conversation, zodResponseFormat(responseSchema, 'groundedness_result'));
    return response.choices[0];
}

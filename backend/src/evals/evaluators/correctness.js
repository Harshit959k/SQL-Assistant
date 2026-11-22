import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { structuredQuery } from "../../llm/llm.js";
import { z } from 'zod';

const SYSTEM_PROMPT = `
        You are a LLM evaluation judge tasked with evaluating correctness of the RAG pipeline.
        You will be provided with a question, expected answer, generated answer and evaluation metric.
        You need to compare the generated answer with expected answer and score the correctness on a scale of 0-1.
    `;

const prompt = (question, answer, metric) => {
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
    `;
};

const responseSchema = z.object({
    score: z.float32().describe('A 1-decimal precision number representing the correctness score')
});

export async function evaluateCorrectness(data, generatedAnswer) {
    const conversation = [
        {
            role: 'system',
            content: SYSTEM_PROMPT
        },
        {
            role: 'user',
            content: prompt(data.question, generatedAnswer, data.evaluation)
        }
    ];

    const response = await structuredQuery(conversation, zodResponseFormat(responseSchema, 'correctness_result'));
    return response.choices[0];
}

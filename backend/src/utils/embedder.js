import { FeatureExtractionPipeline, pipeline } from '@huggingface/transformers';

/**
 * @type {FeatureExtractionPipeline | undefined}
 */
let embedder;

/**
 * @returns {FeatureExtractionPipeline}
 */
export const getEmbedder = async () => {
    if(!embedder) {
        embedder = await pipeline('embeddings', 'Xenova/all-MiniLM-L6-v2');
    }

    return embedder;
};

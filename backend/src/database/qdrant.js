import { QdrantClient } from '@qdrant/js-client-rest';

export const client = new QdrantClient({ host: process.env.QDRANT_URL, port: process.env.QDRANT_PORT });

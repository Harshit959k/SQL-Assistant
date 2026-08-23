import { CONNECTION, CONVERSATION } from "./constants ";
import type { ConnectionBody, ConnectionResponse, Converse, GetConnectionResponse, InitConversationResponse, Response } from "./interface";
import axios from 'axios';

export async function getConnection(connectionId: string): Promise<Response<GetConnectionResponse>> {
    try {
        const response = await axios.get(CONNECTION + connectionId);
        return response.data;
    } catch (err: any) {
        return err;
    }
}

export async function establishConnection(body: ConnectionBody): Promise<Response<ConnectionResponse>> {
    try {
        const response = await axios.post(CONNECTION, body);
        return response.data;
    } catch (err: any) {
        return err;
    }
}

export async function initializeConversation(connectionId: string): Promise<Response<InitConversationResponse>> {
    try {
        const response = await axios.post(CONVERSATION + connectionId);
        return response.data;
    } catch (err: any) {
        return err;
    }
}

export async function* converse(connectionId: string, conversationId: string, body: Converse) {
    try {
        const response = await fetch(CONVERSATION + connectionId + '/' + conversationId, {
            method: 'PATCH',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            }
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');

        while(true) {
            const chunk = await reader?.read();
            if(!chunk || chunk.done) {
                break;
            }

            const decodedChunk = decoder.decode(chunk.value, { stream: true });

            let parsedChunk = ''
            if(decodedChunk.startsWith('data: ')) {
                parsedChunk = decodedChunk.replace('data:', '')
            }

            parsedChunk = parsedChunk.replace('\n\n', '')
            yield parsedChunk;
        }

        return { done: true };
    } catch (err: any) {
        return { done: true };
    }
}

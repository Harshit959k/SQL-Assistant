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

export async function converse(connectionId: string, conversationId: string, body: Converse) {
    try {
        const response = await axios.patch(CONVERSATION + connectionId + conversationId, body);
        return response.data;
    } catch (err: any) {
        return err;
    }
}

export interface ConnectionBody {
    type: string;
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
}

export interface ConnectionResponse { connectionId: string }

export interface InitConversationResponse { conversationId: string }

export interface Converse { query: string }

export interface Response<T> {
    success: boolean;
    data: T;
    code?: string;
    error?: string;
}

export interface GetConnectionResponse {
    host: string;
    port: string;
    database: string;
}

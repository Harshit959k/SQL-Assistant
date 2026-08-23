import express from 'express';
import { getConnection, handleConnection, handleConversation, setupConversation } from '../controller/controller.js';
import { respond } from '../utils/response.js';

const router = express.Router();

router.get('/connections/:connectionId', async (req, res) => {
    try {
        const connectionId = req.params.connectionId;
        const response = await getConnection(req, connectionId);
        if(response.code) {
            respond(res, undefined, response.code, response.message, false, 400);
        } else {
            respond(res, response);
        }
    } catch (err) {
        console.log('Error ==>', err);
        respond(res, undefined, '500', 'Internal server error', false, 500);
    }
});

router.post('/connections', async (req, res) => {
    try {
        const connectionDetails = req.body;

        const response = await handleConnection(req, connectionDetails);
        if(response.code) {
            respond(res, undefined, response.code, response.message, false, 400);
        } else {
            respond(res, response);
        }
    } catch (err) {
        console.log('Error ==>', err);
        respond(res, undefined, '500', 'Internal server error', false, 500);
    }
});

router.post('/conversations/:connectionId', async (req, res) => {
    try {
        const connectionId = req.params.connectionId;

        const response = await setupConversation(req, connectionId);
        if(response.code) {
            respond(res, undefined, response.code, response.message, false, 400);
        } else {
            respond(res, response);
        }
    } catch (err) {
        console.log('Error ==>', err);
        respond(res, undefined, '500', 'Internal server error', false, 500);
    }
});

router.patch('/conversations/:connectionId/:conversationId', async (req, res) => {
    try {
        const { connectionId, conversationId } = req.params;
        const { query } = req.body;
        res.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.flushHeaders();

        for await (const chunk of handleConversation(req, connectionId, conversationId, query)) {
            res.write(`data: ${chunk}\n\n`);
        }
    } catch (err) {
        console.log('Error ==>', err);
        res.write(`data: ${JSON.stringify({ status: 500, message: 'Internal Error' })}\n\n`);
    } finally {
        res.end();
    }
});

export default router;

import express from 'express';
import { handleConnection, handleConversation, setupConversation } from '../controller/controller.js';
import { respond } from '../utils/response.js';

const router = express.Router();

router.post('/connection', async (req, res) => {
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

router.post('/conversation/:connectionId', async (req, res) => {
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

router.patch('/conversation/:connectionId/:conversationId', async (req, res) => {
    try {
        const { connectionId, conversationId } = req.params;
        const { query } = req.body;

        const response = await handleConversation(req, connectionId, conversationId, query);
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

export default router;

import express from 'express';
import { handleConnection } from '../controller/controller.js';
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

// router.post('/chat', async (req, res) => {
//     try {
//         const msg = req.body.message;
//         const convId = randomUUID();
//         cacheController.set(convId, JSON.stringify([ { role: 'user', content: msg } ]));
//         res.json({ success: true, payload: { convId } });
//     } catch (err) {
//         console.log('Error ==>', err);
//         res.status(500).json({ success: false, code: '500', error: 'Error while starting conversation' });
//     }
// });

export default router;

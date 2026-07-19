import express from 'express';
import { createChat, getChats, getChat, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createChat);
router.get('/', getChats);
router.get('/:id', getChat);
router.post('/:id/message', sendMessage);

export default router;

import express from 'express';
import { getProgress, startStudySession, endStudySession } from '../controllers/progressController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getProgress);
router.post('/session/start', startStudySession);
router.post('/session/end', endStudySession);

export default router;

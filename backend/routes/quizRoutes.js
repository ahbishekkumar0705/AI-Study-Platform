import express from 'express';
import { generateQuiz, getQuizzesByFile, getQuiz, attemptQuiz } from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateQuiz);
router.get('/file/:fileId', getQuizzesByFile);
router.get('/:id', getQuiz);
router.post('/:id/attempt', attemptQuiz);

export default router;

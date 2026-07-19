import express from 'express';
import { generateFlashcards, getFlashcardsByFile, updateFlashcard, deleteFlashcard } from '../controllers/flashcardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateFlashcards);
router.get('/file/:fileId', getFlashcardsByFile);
router.put('/:id', updateFlashcard);
router.delete('/:id', deleteFlashcard);

export default router;

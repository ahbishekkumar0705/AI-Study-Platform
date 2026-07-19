import express from 'express';
import { generateSummary, getSummary, exportSummaryPDF } from '../controllers/summaryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateSummary);
router.get('/file/:fileId', getSummary);
router.get('/file/:fileId/pdf', exportSummaryPDF);

export default router;

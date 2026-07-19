import express from 'express';
import { uploadFile, getFiles, getFile, deleteFile, processYoutube } from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.post('/youtube', processYoutube);
router.get('/', getFiles);
router.get('/:id', getFile);
router.delete('/:id', deleteFile);

export default router;

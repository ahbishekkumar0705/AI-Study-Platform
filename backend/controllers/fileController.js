import File from '../models/File.js';
import Embedding from '../models/Embedding.js';
import Progress from '../models/Progress.js';
import Chat from '../models/Chat.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { parseFile } from '../utils/parser.js';
import { splitText } from '../utils/splitter.js';
import { getEmbeddingsBatch } from '../utils/gemini.js';
import fs from 'fs';
import path from 'path';
import { YoutubeTranscript } from 'youtube-transcript';
import axios from 'axios';

// Helper to log errors safely during async processing
const handleFailedFile = async (fileId, errorMsg) => {
  try {
    await File.findByIdAndUpdate(fileId, {
      status: 'failed',
      error: errorMsg,
    });
  } catch (dbErr) {
    console.error(`Failed to write failed-status to DB for file ${fileId}:`, dbErr.message);
  }
};

// Async document ingestion pipeline
const processFileIngestion = async (fileId, filePath, userId) => {
  console.log(`[Ingestion] Starting parsing pipeline for file: ${fileId}`);
  try {
    // 1. Fetch file record
    const fileRecord = await File.findById(fileId);
    if (!fileRecord) {
      console.error(`[Ingestion] File record ${fileId} not found`);
      return;
    }

    // 2. Parse text from file based on file type
    const { text, numPages } = await parseFile(filePath, fileRecord.type);
    
    if (!text || text.trim().length === 0) {
      throw new Error('Extracted text is empty or could not be read.');
    }

    fileRecord.numPages = numPages;
    await fileRecord.save();

    // 3. Chunk the text
    const chunks = splitText(text, 1000, 200);
    console.log(`[Ingestion] File split into ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error('Failed to split document text into chunks.');
    }

    // 4. Generate Embeddings for all chunks (batched)
    console.log(`[Ingestion] Requesting embeddings for ${chunks.length} chunks from Gemini API...`);
    const embeddingVectors = await getEmbeddingsBatch(chunks);

    // 5. Store embeddings in DB
    const embeddingDocuments = chunks.map((chunkText, idx) => ({
      file: fileId,
      chunkIndex: idx,
      text: chunkText,
      embedding: embeddingVectors[idx],
    }));

    await Embedding.insertMany(embeddingDocuments);
    console.log(`[Ingestion] Embedded all chunks successfully.`);

    // 6. Update File status to completed
    fileRecord.status = 'completed';
    await fileRecord.save();

    // 7. Update user progress (increment uploadsCount)
    const todayStr = new Date().toISOString().split('T')[0];
    await Progress.findOneAndUpdate(
      { user: userId },
      {
        $inc: { 'dailyActivity.$[elem].uploadsCount': 1 },
      },
      {
        arrayFilters: [{ 'elem.date': todayStr }],
        upsert: true,
      }
    ).catch(async () => {
      // If today's element doesn't exist, push it
      await Progress.findOneAndUpdate(
        { user: userId },
        {
          $push: {
            dailyActivity: {
              date: todayStr,
              uploadsCount: 1,
              studyTime: 0,
              questionsCount: 0,
              quizzesCount: 0,
            },
          },
        }
      );
    });

    console.log(`[Ingestion] Processing completed successfully for file ${fileId}`);
  } catch (error) {
    console.error(`[Ingestion] Failed for file ${fileId}:`, error.message);
    await handleFailedFile(fileId, error.message);
  }
};

// @desc    Upload file & initiate AI chunking
// @route   POST /api/files/upload
// @access  Private
export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const { originalname, size, path: filePath } = req.file;
  const fileExt = path.extname(originalname).toLowerCase().replace('.', '');
  
  try {
    // Determine local or Cloudinary url
    // For now, we save locally. We store the local filepath as the URL.
    const url = `/uploads/${req.file.filename}`;
    const key = req.file.filename;

    const file = await File.create({
      name: originalname,
      type: fileExt,
      size: size,
      url: url,
      key: key,
      user: req.user._id,
      status: 'processing',
    });

    // Start parsing, chunking, and embedding creation asynchronously
    processFileIngestion(file._id, filePath, req.user._id);

    res.status(202).json({
      success: true,
      message: 'File uploaded and is being processed by the AI pipeline.',
      file,
    });
  } catch (error) {
    // Cleanup physical file on upload schema failure
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user files list
// @route   GET /api/files
// @access  Private
export const getFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single file details
// @route   GET /api/files/:id
// @access  Private
export const getFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.status(200).json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete file & associated vectors/data
// @route   DELETE /api/files/:id
// @access  Private
export const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Delete local file on disk
    const diskPath = path.join('uploads', file.key);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }

    // Delete embeddings
    await Embedding.deleteMany({ file: file._id });

    // Delete associated Flashcards, Quizzes, Chats
    await Flashcard.deleteMany({ file: file._id });
    await Quiz.deleteMany({ file: file._id });
    await Chat.deleteMany({ file: file._id });

    // Delete File record
    await file.deleteOne();

    res.status(200).json({
      success: true,
      message: 'File and all associated AI embeddings/data deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to extract video ID from YouTube URL
const getYoutubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Async YouTube transcript ingestion pipeline
const processYoutubeIngestion = async (fileId, videoId, userId) => {
  console.log(`[Ingestion] Starting YouTube parsing pipeline for video: ${videoId}`);
  try {
    const fileRecord = await File.findById(fileId);
    if (!fileRecord) {
      console.error(`[Ingestion] File record ${fileId} not found`);
      return;
    }

    // 1. Fetch Transcript using youtube-transcript
    console.log(`[Ingestion] Fetching transcript from YouTube for videoId: ${videoId}`);
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcriptArray || transcriptArray.length === 0) {
      throw new Error('No transcript or subtitles available for this YouTube video.');
    }

    const text = transcriptArray.map(t => t.text).join(' ');
    
    fileRecord.size = Buffer.byteLength(text, 'utf8');
    fileRecord.numPages = Math.ceil(text.length / 3000); // estimate pages by dividing chars by 3000
    await fileRecord.save();

    // 2. Chunk the text
    const chunks = splitText(text, 1000, 200);
    console.log(`[Ingestion] YouTube transcript split into ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error('Failed to split transcript text into chunks.');
    }

    // 3. Generate Embeddings for all chunks (batched)
    console.log(`[Ingestion] Requesting embeddings for ${chunks.length} chunks from Gemini API...`);
    const embeddingVectors = await getEmbeddingsBatch(chunks);

    // 4. Store embeddings in DB
    const embeddingDocuments = chunks.map((chunkText, idx) => ({
      file: fileId,
      chunkIndex: idx,
      text: chunkText,
      embedding: embeddingVectors[idx],
    }));

    await Embedding.insertMany(embeddingDocuments);
    console.log(`[Ingestion] Embedded all YouTube chunks successfully.`);

    // 5. Update File status to completed
    fileRecord.status = 'completed';
    await fileRecord.save();

    // 6. Update user progress (increment uploadsCount)
    const todayStr = new Date().toISOString().split('T')[0];
    await Progress.findOneAndUpdate(
      { user: userId },
      {
        $inc: { 'dailyActivity.$[elem].uploadsCount': 1 },
      },
      {
        arrayFilters: [{ 'elem.date': todayStr }],
        upsert: true,
      }
    ).catch(async () => {
      await Progress.findOneAndUpdate(
        { user: userId },
        {
          $push: {
            dailyActivity: {
              date: todayStr,
              uploadsCount: 1,
              studyTime: 0,
              questionsCount: 0,
              quizzesCount: 0,
            },
          },
        }
      );
    });

    console.log(`[Ingestion] YouTube video processing completed successfully for file ${fileId}`);
  } catch (error) {
    console.error(`[Ingestion] YouTube processing failed for file ${fileId}:`, error.message);
    await handleFailedFile(fileId, error.message);
  }
};

// @desc    Process YouTube URL & initiate AI chunking
// @route   POST /api/files/youtube
// @access  Private
export const processYoutube = async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, message: 'YouTube URL is required' });
  }

  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    return res.status(400).json({ success: false, message: 'Invalid YouTube video URL format' });
  }

  try {
    // Fetch video title using public oEmbed API
    let videoTitle = 'YouTube Video Study Material';
    try {
      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oEmbedRes = await axios.get(oEmbedUrl);
      videoTitle = oEmbedRes.data.title || videoTitle;
    } catch (titleErr) {
      console.warn(`[YouTube oEmbed] Failed to retrieve video title:`, titleErr.message);
    }

    const file = await File.create({
      name: videoTitle,
      type: 'youtube',
      size: 0, // dynamic
      url: `https://www.youtube.com/watch?v=${videoId}`,
      key: videoId,
      user: req.user._id,
      status: 'processing',
    });

    // Run parsing, chunking, and embedding creation asynchronously
    processYoutubeIngestion(file._id, videoId, req.user._id);

    res.status(202).json({
      success: true,
      message: 'YouTube link registered. AI is retrieving transcript and indexing text chunks.',
      file,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

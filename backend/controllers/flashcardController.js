import Flashcard from '../models/Flashcard.js';
import File from '../models/File.js';
import Embedding from '../models/Embedding.js';
import Progress from '../models/Progress.js';
import { generateContent } from '../utils/gemini.js';

// @desc    Generate new flashcards from file content
// @route   POST /api/flashcards/generate
// @access  Private
export const generateFlashcards = async (req, res) => {
  const { fileId, count = 10 } = req.body;

  if (!fileId) {
    return res.status(400).json({ success: false, message: 'fileId is required' });
  }

  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Fetch embeddings text to feed the context
    const chunks = await Embedding.find({ file: fileId }).sort({ chunkIndex: 1 });
    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ success: false, message: 'No content found for this file.' });
    }

    const fullText = chunks.map((c) => c.text).join('\n ');
    console.log(`[Flashcard Generation] Rebuilding text for file ${file.name} to generate ${count} cards`);

    const systemInstruction = `You are an expert study aid compiler. Your task is to generate highly effective revision flashcards based on the provided document text.
    
    The flashcards must be generated in JSON format matching the following schema:
    {
      "flashcards": [
        {
          "front": "Term, Concept, or Question (Prompt)",
          "back": "Definition, explanation, or concise answer (Response)"
        }
      ]
    }
    
    CRITICAL CONSTRAINTS:
    - Generate EXACTLY ${count} flashcards.
    - Make the questions on the front engaging and challenging (e.g. definitions, process steps, formulas).
    - Keep answers on the back concise, clear, and highly focused for easy retention (ideally 1 to 2 sentences).
    - Return ONLY the raw JSON.`;

    const prompt = `Here is the document text:
    ---
    ${fullText.substring(0, 80000)}
    ---
    
    Analyze the text above and generate the flashcards JSON.`;

    console.log(`[Flashcard Generation] Requesting Gemini flashcard generation...`);
    const responseJsonText = await generateContent(prompt, systemInstruction, true);

    let flashcardData;
    try {
      flashcardData = JSON.parse(responseJsonText);
    } catch (parseErr) {
      console.error(`Failed to parse Gemini flashcard JSON:`, responseJsonText);
      throw new Error('AI generated flashcards were not in valid JSON format. Please retry.');
    }

    // Prepare and insert cards
    const cardDocuments = flashcardData.flashcards.map((card) => ({
      user: req.user._id,
      file: fileId,
      front: card.front,
      back: card.back,
      isDifficult: false,
      isFavorite: false,
    }));

    const flashcards = await Flashcard.insertMany(cardDocuments);

    // Update Progress totalFlashcardsCreated
    await Progress.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: { totalFlashcardsCreated: flashcards.length },
      },
      { upsert: true }
    );

    res.status(201).json({ success: true, flashcards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get flashcards for a file
// @route   GET /api/flashcards/file/:fileId
// @access  Private
export const getFlashcardsByFile = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ file: req.params.fileId, user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, flashcards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update flashcard status (difficulty/favorite toggles)
// @route   PUT /api/flashcards/:id
// @access  Private
export const updateFlashcard = async (req, res) => {
  const { isDifficult, isFavorite } = req.body;
  try {
    const flashcard = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });
    if (!flashcard) {
      return res.status(404).json({ success: false, message: 'Flashcard not found' });
    }

    if (isDifficult !== undefined) flashcard.isDifficult = isDifficult;
    if (isFavorite !== undefined) flashcard.isFavorite = isFavorite;

    await flashcard.save();
    res.status(200).json({ success: true, flashcard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a specific flashcard
// @route   DELETE /api/flashcards/:id
// @access  Private
export const deleteFlashcard = async (req, res) => {
  try {
    const result = await Flashcard.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Flashcard not found' });
    }
    
    // Decrement Progress totalFlashcardsCreated
    await Progress.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { totalFlashcardsCreated: -1 } }
    );

    res.status(200).json({ success: true, message: 'Flashcard deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

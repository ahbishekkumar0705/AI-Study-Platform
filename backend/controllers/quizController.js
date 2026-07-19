import Quiz from '../models/Quiz.js';
import File from '../models/File.js';
import Embedding from '../models/Embedding.js';
import Progress from '../models/Progress.js';
import { generateContent } from '../utils/gemini.js';

// @desc    Generate a new quiz from file content
// @route   POST /api/quizzes/generate
// @access  Private
export const generateQuiz = async (req, res) => {
  const { fileId, difficulty, count = 5 } = req.body;

  if (!fileId || !difficulty) {
    return res.status(400).json({ success: false, message: 'fileId and difficulty are required' });
  }

  const allowedDifficulties = ['easy', 'medium', 'hard'];
  if (!allowedDifficulties.includes(difficulty)) {
    return res.status(400).json({ success: false, message: 'Difficulty must be easy, medium, or hard' });
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
    console.log(`[Quiz Generation] Rebuilding text for file ${file.name} to generate ${difficulty} quiz`);

    const systemInstruction = `You are a professional academic instructor. Your task is to generate a student quiz based on the provided document text. 
    
    The quiz must be generated in JSON format matching the following schema:
    {
      "title": "Quiz Title (reflecting the specific topic)",
      "questions": [
        {
          "question": "Question text...",
          "type": "mcq",
          "options": ["A text", "B text", "C text", "D text"],
          "correctAnswer": "A text", // must match exactly one of options
          "explanation": "Why this answer is correct..."
        },
        {
          "question": "Question text...",
          "type": "true_false",
          "options": ["True", "False"],
          "correctAnswer": "True", // must match exactly one of options
          "explanation": "Why this answer is correct..."
        },
        {
          "question": "Question statement containing a blank represented by three underscores: ___.",
          "type": "fill_blank",
          "correctAnswer": "Correct word", // exact fill-in word
          "explanation": "Why this answer is correct..."
        }
      ]
    }
    
    CRITICAL CONSTRAINTS:
    - Generate EXACTLY ${count} questions.
    - Match the difficulty level: "${difficulty}". For "easy", focus on basic recall and explicit definitions. For "medium", focus on application. For "hard", focus on critical synthesis and deduction.
    - Mix question types: MCQs, True/False, and Fill in the Blanks.
    - Ensure correct answers are spelt exactly as in options (for MCQ and True/False).
    - Return ONLY the raw JSON.`;

    const prompt = `Here is the document text:
    ---
    ${fullText.substring(0, 80000)}
    ---
    
    Analyze the text above and generate the quiz JSON.`;

    console.log(`[Quiz Generation] Requesting Gemini quiz generation...`);
    const responseJsonText = await generateContent(prompt, systemInstruction, true);

    let quizData;
    try {
      quizData = JSON.parse(responseJsonText);
    } catch (parseErr) {
      console.error(`Failed to parse Gemini quiz JSON:`, responseJsonText);
      throw new Error('AI generated quiz was not in valid JSON format. Please retry.');
    }

    const quiz = await Quiz.create({
      user: req.user._id,
      file: fileId,
      title: quizData.title || `Quiz on ${file.name}`,
      difficulty,
      questions: quizData.questions,
      attempts: [],
    });

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quizzes for a file
// @route   GET /api/quizzes/file/:fileId
// @access  Private
export const getQuizzesByFile = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ file: req.params.fileId, user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single quiz
// @route   GET /api/quizzes/:id
// @access  Private
export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id }).populate('file', 'name');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    res.status(200).json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Attempt/Submit a quiz
// @route   POST /api/quizzes/:id/attempt
// @access  Private
export const attemptQuiz = async (req, res) => {
  const { answers } = req.body; // array of user answer strings in question order

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ success: false, message: 'answers must be an array' });
  }

  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({ success: false, message: 'Provided answers count does not match quiz questions count' });
    }

    // Calculate score
    let score = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach((q, idx) => {
      const userAnswer = (answers[idx] || '').trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      
      if (userAnswer === correctAnswer) {
        score++;
      }
    });

    // Save attempt
    const newAttempt = {
      score,
      totalQuestions,
      answers,
      completedAt: new Date(),
    };
    
    quiz.attempts.push(newAttempt);
    await quiz.save();

    // Update user stats in Progress
    const todayStr = new Date().toISOString().split('T')[0];
    
    await Progress.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: {
          totalQuizAttempts: 1,
          'dailyActivity.$[elem].quizzesCount': 1
        },
        $set: { lastActiveDate: new Date() }
      },
      {
        arrayFilters: [{ 'elem.date': todayStr }],
        upsert: true
      }
    ).catch(async () => {
      await Progress.findOneAndUpdate(
        { user: req.user._id },
        {
          $inc: { totalQuizAttempts: 1 },
          $set: { lastActiveDate: new Date() },
          $push: {
            dailyActivity: {
              date: todayStr,
              quizzesCount: 1,
              studyTime: 0,
              uploadsCount: 0,
              questionsCount: 0
            }
          }
        }
      );
    });

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      attempt: newAttempt,
      correctAnswers: quiz.questions.map((q) => q.correctAnswer),
      explanations: quiz.questions.map((q) => q.explanation),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import Chat from '../models/Chat.js';
import File from '../models/File.js';
import Progress from '../models/Progress.js';
import { searchEmbeddings } from '../utils/vectorStore.js';
import { generateContent } from '../utils/gemini.js';

// @desc    Create a new chat session
// @route   POST /api/chats
// @access  Private
export const createChat = async (req, res) => {
  const { fileId, title } = req.body;
  
  if (!fileId) {
    return res.status(400).json({ success: false, message: 'fileId is required' });
  }

  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const chat = await Chat.create({
      title: title || `Chat about ${file.name}`,
      user: req.user._id,
      file: fileId,
      messages: [],
    });

    res.status(201).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user chats lists
// @route   GET /api/chats
// @access  Private
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .populate('file', 'name type url')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get details of a single chat
// @route   GET /api/chats/:id
// @access  Private
export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id }).populate('file', 'name type');
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    res.status(200).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a message to AI & retrieve vector responses
// @route   POST /api/chats/:id/message
// @access  Private
export const sendMessage = async (req, res) => {
  const { text } = req.body;
  const chatId = req.params.id;

  if (!text) {
    return res.status(400).json({ success: false, message: 'Message text is required' });
  }

  try {
    // 1. Fetch chat history and file id
    const chat = await Chat.findOne({ _id: chatId, user: req.user._id });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // 2. Vector search: find top matching chunks of this file
    const matchedChunks = await searchEmbeddings(text, chat.file, 5);
    
    // 3. Construct Context Text
    let contextText = 'No matching document chunks found.';
    if (matchedChunks && matchedChunks.length > 0) {
      contextText = matchedChunks.map(c => `[Chunk ${c.chunkIndex + 1} (Score: ${Math.round(c.similarity * 100)}%)]:\n${c.text}`).join('\n\n---\n\n');
    }

    // 4. Construct previous conversation history (last 5 messages)
    const historySnippet = chat.messages
      .slice(-6)
      .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`)
      .join('\n');

    // 5. Build strict RAG Prompt and System Instructions
    const systemInstruction = `You are an AI study assistant. Your primary task is to answer the user's question using ONLY the provided document context chunks.
    
CRITICAL CONSTRAINT: You must answer the user's question ONLY using the text content in the context chunks. If the answer to the user's question is not explicitly written or cannot be clearly and logically inferred from the provided context chunks, you MUST respond with EXACTLY: "This information is not available in your uploaded documents." Do not try to answer using general web knowledge. Do not say anything like "Based on the text..." or "In the document provided...". Be direct and professional. Use markdown, lists, and tables when explaining concepts.`;

    const promptText = `Here is the conversation history so far:
${historySnippet || 'None'}

Here are the text chunks extracted from the user's document for this query:
${contextText}

User's Question: ${text}`;

    // 6. Generate Response from Gemini
    console.log(`[AI Chat] Requesting chat completion for query...`);
    const aiResponseText = await generateContent(promptText, systemInstruction);

    // 7. Append messages to chat schema
    chat.messages.push({ sender: 'user', text: text });
    chat.messages.push({ sender: 'ai', text: aiResponseText });
    await chat.save();

    // 8. Update User Progress statistics (total questions asked & daily logs)
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Increment global and daily count
    await Progress.findOneAndUpdate(
      { user: req.user._id },
      {
        $inc: {
          totalQuestionsAsked: 1,
          'dailyActivity.$[elem].questionsCount': 1
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
          $inc: { totalQuestionsAsked: 1 },
          $set: { lastActiveDate: new Date() },
          $push: {
            dailyActivity: {
              date: todayStr,
              questionsCount: 1,
              studyTime: 0,
              uploadsCount: 0,
              quizzesCount: 0
            }
          }
        }
      );
    });

    res.status(200).json({
      success: true,
      userMessage: chat.messages[chat.messages.length - 2],
      aiMessage: chat.messages[chat.messages.length - 1],
      matchedChunks: matchedChunks.map(c => ({ text: c.text, chunkIndex: c.chunkIndex, similarity: c.similarity }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

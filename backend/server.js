import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Request logger for diagnostic tracing
app.use((req, res, next) => {
  console.log(`[HTTP Request] ${req.method} ${req.path} - Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Security and basic middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images/files loading statically in browser
}));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or any localhost port / netlify subdomains
    if (!origin || /^https?:\/\/(?:localhost|.*\.netlify\.app)(?::\d+)?$/.test(origin) || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Create upload directory if it does not exist
const uploadPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadPath));

// Rate limiting disabled in development to prevent local testing blocks
// app.use(rateLimiter(200, 15 * 60 * 1000));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/profile', profileRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('AI Study Platform API is running...');
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

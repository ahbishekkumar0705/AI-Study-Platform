import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'true_false', 'fill_blank'],
    required: true,
  },
  options: [String], // only for MCQ and maybe True/False
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: {
    type: String,
    required: true,
  },
});

const attemptSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  answers: [String], // user's choices
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

const quizSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    questions: [questionSchema],
    attempts: [attemptSchema],
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;

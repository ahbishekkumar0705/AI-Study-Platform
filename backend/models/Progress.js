import mongoose from 'mongoose';

const dailyActivitySchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  studyTime: {
    type: Number, // in minutes
    default: 0,
  },
  uploadsCount: {
    type: Number,
    default: 0,
  },
  questionsCount: {
    type: Number,
    default: 0,
  },
  quizzesCount: {
    type: Number,
    default: 0,
  },
});

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    totalStudyTime: {
      type: Number, // total study session durations in minutes
      default: 0,
    },
    studyStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
    },
    totalQuestionsAsked: {
      type: Number,
      default: 0,
    },
    totalFlashcardsCreated: {
      type: Number,
      default: 0,
    },
    totalQuizAttempts: {
      type: Number,
      default: 0,
    },
    dailyActivity: [dailyActivitySchema],
  },
  {
    timestamps: true,
  }
);

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;

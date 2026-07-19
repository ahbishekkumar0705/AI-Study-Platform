import Progress from '../models/Progress.js';
import StudySession from '../models/StudySession.js';
import File from '../models/File.js';

// @desc    Get user progress analytics
// @route   GET /api/progress
// @access  Private
export const getProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      // Create on the fly if missing
      progress = await Progress.create({
        user: req.user._id,
        dailyActivity: [{
          date: new Date().toISOString().split('T')[0],
          studyTime: 0,
          uploadsCount: 0,
          questionsCount: 0,
          quizzesCount: 0,
        }],
      });
    }

    // Get count of completed files
    const totalFiles = await File.countDocuments({ user: req.user._id });
    
    // Sum page counts
    const files = await File.find({ user: req.user._id, status: 'completed' });
    const pagesProcessed = files.reduce((sum, f) => sum + (f.numPages || 0), 0);

    res.status(200).json({
      success: true,
      progress: {
        totalStudyTime: progress.totalStudyTime,
        studyStreak: progress.studyStreak,
        totalQuestionsAsked: progress.totalQuestionsAsked,
        totalFlashcardsCreated: progress.totalFlashcardsCreated,
        totalQuizAttempts: progress.totalQuizAttempts,
        dailyActivity: progress.dailyActivity,
        totalUploads: totalFiles,
        pagesProcessed,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start study session
// @route   POST /api/progress/session/start
// @access  Private
export const startStudySession = async (req, res) => {
  const { fileId } = req.body;
  if (!fileId) {
    return res.status(400).json({ success: false, message: 'fileId is required' });
  }

  try {
    const session = await StudySession.create({
      user: req.user._id,
      file: fileId,
      startTime: new Date(),
    });
    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End study session and recalculate streaks & times
// @route   POST /api/progress/session/end
// @access  Private
export const endStudySession = async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'sessionId is required' });
  }

  try {
    const session = await StudySession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.endTime) {
      return res.status(400).json({ success: false, message: 'Session already ended' });
    }

    session.endTime = new Date();
    // Calculate difference in minutes
    const diffMs = session.endTime.getTime() - session.startTime.getTime();
    const durationMinutes = Math.max(1, Math.round(diffMs / 1000 / 60)); // minimum 1 minute
    session.duration = durationMinutes;
    await session.save();

    // Fetch user progress
    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      progress = new Progress({ user: req.user._id, dailyActivity: [] });
    }

    // Recalculate streak
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastActive = progress.lastActiveDate;

    if (!lastActive) {
      progress.studyStreak = 1;
    } else {
      const lastActiveStr = lastActive.toISOString().split('T')[0];
      if (lastActiveStr !== todayStr) {
        // Find date difference
        const lastActiveDateOnly = new Date(lastActiveStr);
        const todayDateOnly = new Date(todayStr);
        const diffDays = Math.round((todayDateOnly - lastActiveDateOnly) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day, increment streak
          progress.studyStreak += 1;
        } else if (diffDays > 1) {
          // Streak broken, reset
          progress.studyStreak = 1;
        }
      }
      // If lastActiveStr === todayStr, streak remains the same
    }

    progress.lastActiveDate = now;
    progress.totalStudyTime += durationMinutes;

    // Update today's dailyActivity
    const todayIndex = progress.dailyActivity.findIndex((act) => act.date === todayStr);
    if (todayIndex !== -1) {
      progress.dailyActivity[todayIndex].studyTime += durationMinutes;
    } else {
      progress.dailyActivity.push({
        date: todayStr,
        studyTime: durationMinutes,
        uploadsCount: 0,
        questionsCount: 0,
        quizzesCount: 0,
      });
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Session ended successfully',
      durationMinutes,
      streak: progress.studyStreak,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

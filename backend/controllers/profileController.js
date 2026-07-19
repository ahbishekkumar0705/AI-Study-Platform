import User from '../models/User.js';
import File from '../models/File.js';
import Embedding from '../models/Embedding.js';
import Chat from '../models/Chat.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import Progress from '../models/Progress.js';
import StudySession from '../models/StudySession.js';
import Bookmark from '../models/Bookmark.js';
import fs from 'fs';
import path from 'path';

// @desc    Get user profile data
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile data
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { username, profilePicture } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username) {
      // Check if username is already taken by someone else
      const existingUser = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
      user.username = username;
    }

    if (profilePicture) {
      user.profilePicture = profilePicture;
    }

    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/profile/password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
  }

  try {
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user account and clean up database & disk storage
// @route   DELETE /api/profile
// @access  Private
export const deleteAccount = async (req, res) => {
  const userId = req.user._id;
  try {
    // 1. Fetch user files to delete physical files from disk
    const files = await File.find({ user: userId });
    for (const file of files) {
      const diskPath = path.join('uploads', file.key);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
      // Delete embeddings associated with this file
      await Embedding.deleteMany({ file: file._id });
    }

    // 2. Cascade delete documents
    await File.deleteMany({ user: userId });
    await Chat.deleteMany({ user: userId });
    await Flashcard.deleteMany({ user: userId });
    await Quiz.deleteMany({ user: userId });
    await Progress.deleteOne({ user: userId });
    await StudySession.deleteMany({ user: userId });
    await Bookmark.deleteMany({ user: userId });

    // 3. Delete user document
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account and all associated study materials/embeddings have been deleted forever.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

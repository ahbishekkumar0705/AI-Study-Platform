import User from '../models/User.js';
import Progress from '../models/Progress.js';
import { generateToken, generateRefreshToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

// Helper to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!email || !email.endsWith('@university.edu')) {
      return res.status(400).json({ success: false, message: 'Only university email addresses (@university.edu) are allowed' });
    }
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      isVerified: true,
    });

    // Create default progress tracking document
    await Progress.create({
      user: user._id,
      dailyActivity: [{
        date: new Date().toISOString().split('T')[0],
        studyTime: 0,
        uploadsCount: 0,
        questionsCount: 0,
        quizzesCount: 0,
      }],
    });

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify user email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.verificationToken !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user & get tokens
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      // Re-trigger OTP generation in case they refresh or close verify screen
      const otp = generateOTP();
      user.verificationToken = otp;
      await user.save();

      console.log(`\n=== DEVELOPMENT VERIFICATION OTP FOR USER ${user.username} ===`);
      console.log(`Email: ${user.email}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`=========================================================\n`);

      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify using OTP sent to console logs.',
        isUnverified: true,
        email: user.email,
      });
    }

    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password - Request code
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email does not exist' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save();

    console.log(`\n=== DEVELOPMENT PASSWORD RESET CODE FOR USER ${user.username} ===`);
    console.log(`Email: ${email}`);
    console.log(`Reset Code: ${resetCode}`);
    console.log(`=================================================================\n`);

    res.status(200).json({
      success: true,
      message: 'Password reset code sent. Check server logs.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password using code
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset code' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const accessToken = generateToken(user._id);
    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

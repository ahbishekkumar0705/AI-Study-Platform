import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BrainCircuit,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const { login, register, verifyEmail, forgotPassword, resetPassword, user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode state: 'login' | 'register' | 'forgot' | 'reset' | 'verify'
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // Check if query params ask for register mode
    const params = new URLSearchParams(location.search);
    if (params.get('register') === 'true') {
      setMode('register');
    }
  }, [location]);

  useEffect(() => {
    // Redirect if already logged in
    if (user && user.isVerified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await register(username, email, password);
      setSuccessMsg(data.message);
      setMode('verify');
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await verifyEmail(email, otpCode);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.isUnverified) {
        setEmail(err.email);
        setSuccessMsg(err.message);
        setMode('verify');
      } else {
        setErrorMsg(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      setSuccessMsg(data.message);
      setMode('reset');
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const data = await resetPassword(email, otpCode, newPassword);
      setSuccessMsg(data.message);
      setMode('login');
      // clear credentials
      setPassword('');
      setOtpCode('');
      setNewPassword('');
    } catch (err) {
      setErrorMsg(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 relative overflow-hidden`}>
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Floating Theme Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 rounded-lg bg-white/10 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors z-20"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="w-full max-w-md">
        {/* logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/25 mb-4">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
            StudyFlow AI
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">Your Personal Academic Study Companion</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-xl border border-slate-200/50 dark:border-slate-800/60">
          <AnimatePresence mode="wait">
            {/* 1. LOGIN MODE */}
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Welcome Back</h3>
                  <p className="text-xs text-slate-400">Enter your credentials to enter the platform</p>
                </div>

                {errorMsg && <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">{errorMsg}</div>}
                {successMsg && <div className="p-3.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-xs font-semibold">{successMsg}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@university.edu"
                        className="w-full pl-10 pr-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-400">Password</label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs font-bold text-indigo-500 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">
                    Don't have an account?{' '}
                    <button onClick={() => setMode('register')} className="text-indigo-500 font-bold hover:underline">
                      Create Account
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. REGISTER MODE */}
            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Register Account</h3>
                  <p className="text-xs text-slate-400">Sign up to get access to AI study tools</p>
                </div>

                {errorMsg && <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">{errorMsg}</div>}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="JohnDoe"
                        className="w-full pl-10 pr-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@university.edu"
                        className="w-full pl-10 pr-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">
                    Already have an account?{' '}
                    <button onClick={() => setMode('login')} className="text-indigo-500 font-bold hover:underline">
                      Sign In
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. VERIFY EMAIL (OTP) MODE */}
            {mode === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-full w-fit mx-auto">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">Verify Your Email</h3>
                  <p className="text-xs text-slate-400">
                    We sent a 6-digit OTP verification code. Under local testing, check your{' '}
                    <span className="font-bold text-indigo-400">Backend Console Log terminal</span>.
                  </p>
                </div>

                {errorMsg && <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">{errorMsg}</div>}
                {successMsg && <div className="p-3.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-xs font-semibold">{successMsg}</div>}

                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Verification OTP Code</label>
                    <input
                      type="text"
                      required
                      maxLength="6"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-lg font-extrabold letter-spacing-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Verify Code <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* 4. FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Reset Password</h3>
                  <p className="text-xs text-slate-400">Receive a recovery code in server terminal log</p>
                </div>

                {errorMsg && <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">{errorMsg}</div>}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@university.edu"
                        className="w-full pl-10 pr-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Send Reset Code <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button onClick={() => setMode('login')} className="text-xs font-bold text-slate-400 hover:text-indigo-500 hover:underline">
                    Back to Login
                  </button>
                </div>
              </motion.div>
            )}

            {/* 5. RESET PASSWORD MODE */}
            {mode === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold">Set New Password</h3>
                  <p className="text-xs text-slate-400">Input the reset code and choose a new password</p>
                </div>

                {errorMsg && <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold">{errorMsg}</div>}
                {successMsg && <div className="p-3.5 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-xs font-semibold">{successMsg}</div>}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">Reset Code</label>
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full text-center py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-md font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Login;

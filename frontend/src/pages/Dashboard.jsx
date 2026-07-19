import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import {
  Sparkles,
  Flame,
  UploadCloud,
  MessageSquare,
  FileText,
  Layers,
  Award,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileDown,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/progress');
      const filesRes = await api.get('/files');
      
      setStats(statsRes.data.progress);
      setRecentFiles(filesRes.data.files.slice(0, 4)); // top 4 files
    } catch (error) {
      console.error('Error fetching dashboard data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Hello, {user?.username || 'Scholar'} 👋
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Ready to learn something new today? Your documents are compiled and ready.
            </p>
          </div>
          
          {/* Streak Indicator */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500">
            <Flame className="h-6 w-6 fill-current animate-bounce" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Streak</p>
              <p className="text-lg font-black">{stats?.studyStreak || 0} Days Active</p>
            </div>
          </div>
        </div>

        {loading ? (
          // Skeleton Loaders
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-slate-100 dark:bg-slate-900/50 animate-pulse border border-slate-200/50 dark:border-slate-800/60" />
            ))}
          </div>
        ) : (
          /* Stats Grid */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Stat Item 1 */}
            <motion.div variants={itemVariants} className="p-6 rounded-3xl glass-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl w-fit">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total Uploads</p>
              <p className="text-2xl font-black mt-1">{stats?.totalUploads || 0} Files</p>
            </motion.div>

            {/* Stat Item 2 */}
            <motion.div variants={itemVariants} className="p-6 rounded-3xl glass-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl w-fit">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pages Processed</p>
              <p className="text-2xl font-black mt-1">{stats?.pagesProcessed || 0} Pages</p>
            </motion.div>

            {/* Stat Item 3 */}
            <motion.div variants={itemVariants} className="p-6 rounded-3xl glass-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl w-fit">
                <MessageSquare className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">AI Queries Asked</p>
              <p className="text-2xl font-black mt-1">{stats?.totalQuestionsAsked || 0} Questions</p>
            </motion.div>

            {/* Stat Item 4 */}
            <motion.div variants={itemVariants} className="p-6 rounded-3xl glass-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit">
                <Clock className="h-5 w-5" />
              </div>
              <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total Study Time</p>
              <p className="text-2xl font-black mt-1">{stats?.totalStudyTime || 0} Mins</p>
            </motion.div>
          </motion.div>
        )}

        {/* Quick Actions Panel */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              AI Learning Center
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select one of your uploaded files to initialize interactive study aids.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <Link
                to="/upload"
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-center gap-3 transition-colors border border-indigo-100/50 dark:border-slate-800"
              >
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Upload File</span>
              </Link>

              <Link
                to="/chat"
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-center gap-3 transition-colors border border-purple-100/50 dark:border-slate-800"
              >
                <div className="p-2.5 bg-purple-600 text-white rounded-xl">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Document Chat</span>
              </Link>

              <Link
                to="/quiz"
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-pink-50 hover:bg-pink-100 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-center gap-3 transition-colors border border-pink-100/50 dark:border-slate-800 col-span-2 sm:col-span-1"
              >
                <div className="p-2.5 bg-pink-600 text-white rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Practice Quiz</span>
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden flex flex-col justify-between shadow-xl shadow-indigo-600/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-300 fill-current" />
                Maintain the Flow!
              </h3>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Log active study time daily to keep your learning streak burning. Practice flashcards or query your documents to trigger streak points.
              </p>
            </div>
            <Link
              to="/flashcards"
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl text-sm transition-all shadow-md"
            >
              Start Flashcards
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Recent Uploads Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              Recent Materials
            </h3>
            <Link to="/upload" className="text-xs font-bold text-indigo-500 hover:underline inline-flex items-center gap-1">
              View All Uploads <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/50 animate-pulse border border-slate-200/50" />
              ))}
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">You haven't uploaded any files yet.</p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Upload Your First Document
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentFiles.map((file) => (
                <div
                  key={file._id}
                  className="flex items-center justify-between p-4 rounded-2xl glass-card hover:border-indigo-500/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden max-w-[200px] sm:max-w-xs">
                      <p className="text-sm font-bold truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                        <span className="uppercase">{file.type}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        file.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : file.status === 'failed'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-amber-500/10 text-amber-500 animate-pulse'
                      }`}
                    >
                      {file.status}
                    </span>
                    
                    {file.status === 'completed' && (
                      <button
                        onClick={() => navigate(`/chat?fileId=${file._id}`)}
                        className="p-2 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                        title="Chat"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

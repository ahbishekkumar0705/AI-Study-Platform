import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  UploadCloud,
  MessageSquare,
  FileText,
  Layers,
  Award,
  BarChart2,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload Materials', path: '/upload', icon: UploadCloud },
    { name: 'AI Document Chat', path: '/chat', icon: MessageSquare },
    { name: 'Generated Summaries', path: '/summaries', icon: FileText },
    { name: 'Flashcard Decks', path: '/flashcards', icon: Layers },
    { name: 'Quiz Terminal', path: '/quiz', icon: Award },
    { name: 'Progress Tracker', path: '/progress', icon: BarChart2 },
    { name: 'My Profile', path: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const activeItem = menuItems.find(item => location.pathname.startsWith(item.path)) || menuItems[0];

  const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    closed: { x: '-100%', opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 border-r border-slate-200 dark:border-slate-800/60 glass-effect z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              StudyFlow AI
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Premium Edition</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <img
                src={user?.profilePicture}
                alt={user?.username}
                className="h-9 w-9 rounded-full ring-2 ring-indigo-500/25 object-cover"
              />
              <div className="max-w-[120px] truncate">
                <p className="text-sm font-bold truncate">{user?.username}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="flex flex-col flex-1 md:pl-64">
        <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 glass-effect sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="font-extrabold text-md tracking-tight">StudyFlow AI</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black z-50 md:hidden"
              />
              {/* Drawer */}
              <motion.aside
                initial="closed"
                animate="open"
                exit="closed"
                variants={sidebarVariants}
                className="fixed top-0 bottom-0 left-0 w-72 glass-card z-50 md:hidden flex flex-col p-6 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                    <span className="font-extrabold text-lg">StudyFlow AI</span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex-1 space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800/60 space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.profilePicture}
                      alt={user?.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold">{user?.username}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

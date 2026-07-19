import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Award,
  Layers,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  Flame,
  UploadCloud,
  MessageSquare
} from 'lucide-react';

const Progress = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await api.get('/progress');
        setData(response.data.progress);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  // Format dailyActivity data for Recharts (e.g. format dates to "Mon", "Tue")
  const getChartData = () => {
    if (!data || !data.dailyActivity) return [];
    
    // Sort chronologically and take last 7 days
    const sorted = [...data.dailyActivity]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);

    return sorted.map(d => {
      const dateObj = new Date(d.date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      return {
        day: dayName,
        'Study Time (Min)': d.studyTime || 0,
        'Questions Asked': d.questionsCount || 0,
        'Quizzes Taken': d.quizzesCount || 0,
        'Uploads': d.uploadsCount || 0
      };
    });
  };

  const chartData = getChartData();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Progress Tracker</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Visual statistics and analytics logging your learning milestones and daily activities.
          </p>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="animate-pulse text-sm text-slate-400">Loading progress reports...</span>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Streak & Core stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="p-6 rounded-3xl glass-card flex items-center gap-4">
                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
                  <Flame className="h-6 w-6 fill-current animate-bounce" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Streak</p>
                  <p className="text-2xl font-black">{data?.studyStreak || 0} Days</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-3xl glass-card flex items-center gap-4">
                <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Duration</p>
                  <p className="text-2xl font-black">{data?.totalStudyTime || 0} Mins</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-3xl glass-card flex items-center gap-4">
                <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quiz Attempts</p>
                  <p className="text-2xl font-black">{data?.totalQuizAttempts || 0} Runs</p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-3xl glass-card flex items-center gap-4">
                <div className="p-4 bg-pink-500/10 text-pink-500 rounded-2xl">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Flashcards Built</p>
                  <p className="text-2xl font-black">{data?.totalFlashcardsCreated || 0} Cards</p>
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Study Time Chart */}
              <div className="p-6 rounded-3xl glass-card space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                    Weekly Study Duration (Mins)
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    Last 7 Days
                  </span>
                </div>
                
                <div className="h-64">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                      No study time logged yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            fontSize: '11px',
                            color: '#fff'
                          }}
                        />
                        <Bar dataKey="Study Time (Min)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chat & Quiz Activity Chart */}
              <div className="p-6 rounded-3xl glass-card space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4.5 w-4.5 text-purple-500" />
                    Interactive AI Engagements
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    Queries & Tests
                  </span>
                </div>

                <div className="h-64">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                      No AI activity logged yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            fontSize: '11px',
                            color: '#fff'
                          }}
                        />
                        <Line type="monotone" dataKey="Questions Asked" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Quizzes Taken" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Document stats summary */}
            <div className="p-6 rounded-3xl glass-card flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm md:text-md">Ingested Pages Count</h4>
                  <p className="text-xs text-slate-400">Total pages parsed, indexed, and embedded into local vector indexes.</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-black text-indigo-500">{data?.pagesProcessed || 0}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pages In DB</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Progress;

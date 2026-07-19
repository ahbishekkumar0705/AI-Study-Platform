import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import {
  Award,
  Sparkles,
  Timer,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Quiz = () => {
  const location = useLocation();

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  
  // Quiz creation config
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);

  // Active Quiz taking session states
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState([]); // user's choices matching question index
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const fetchFilesAndCheckParams = async () => {
    try {
      const response = await api.get('/files');
      const completedFiles = response.data.files.filter(f => f.status === 'completed');
      setFiles(completedFiles);

      const params = new URLSearchParams(location.search);
      const queryFileId = params.get('fileId');

      if (queryFileId) {
        const file = completedFiles.find(f => f._id === queryFileId);
        if (file) {
          handleSelectFile(file);
        }
      } else if (completedFiles.length > 0) {
        handleSelectFile(completedFiles[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFilesAndCheckParams();
  }, [location]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      // Auto submit on time out!
      setTimerActive(false);
      handleSubmitQuiz(true);
    }
    return () => clearInterval(interval);
  }, [timeLeft, timerActive]);

  const handleSelectFile = async (file) => {
    setSelectedFile(file);
    setActiveQuiz(null);
    setQuizSubmitted(false);
    setReport(null);
    setAnswers([]);
    setTimerActive(false);
    
    // Load generated quizzes list for this file
    try {
      const response = await api.get(`/quizzes/file/${file._id}`);
      setQuizzes(response.data.quizzes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile) return;
    setGenerating(true);
    try {
      const response = await api.post('/quizzes/generate', {
        fileId: selectedFile._id,
        difficulty,
        count: questionCount
      });
      const newQuiz = response.data.quiz;
      setQuizzes([newQuiz, ...quizzes]);
      handleStartQuiz(newQuiz);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate quiz. Gemini API might have throttled.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setAnswers(Array(quiz.questions.length).fill(''));
    setQuizSubmitted(false);
    setReport(null);
    
    // Set 2 minutes per question
    setTimeLeft(quiz.questions.length * 2 * 60);
    setTimerActive(true);
  };

  const handleAnswerChange = (qIndex, value) => {
    setAnswers(answers.map((ans, idx) => idx === qIndex ? value : ans));
  };

  const handleSubmitQuiz = async (force = false) => {
    if (!force) {
      const unfilled = answers.some((ans) => ans === '');
      if (unfilled && !window.confirm('You have unanswered questions. Submit anyway?')) return;
    }

    setSubmitting(true);
    setTimerActive(false);

    try {
      const response = await api.post(`/quizzes/${activeQuiz._id}/attempt`, {
        answers
      });
      setReport(response.data);
      setQuizSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Submission failed.');
      setTimerActive(true);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Quiz Terminal</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Challenge yourself. Generate custom quizzes in Easy, Medium, or Hard formats with direct explanation sheets.
          </p>
        </div>

        {/* File Selection Topbar */}
        <div className="p-4 rounded-3xl glass-card flex flex-wrap items-center gap-3">
          <span className="text-xs font-black uppercase text-slate-400 px-1">Study Material:</span>
          {loadingFiles ? (
            <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
          ) : files.length === 0 ? (
            <span className="text-xs italic text-slate-400">Upload documents first!</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <button
                  key={file._id}
                  onClick={() => handleSelectFile(file)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    selectedFile?._id === file._id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-slate-500'
                  }`}
                >
                  {file.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ingest Generating State */}
        {generating ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl glass-card">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <h4 className="font-bold text-lg">AI Quiz Formulation Pipeline</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Gemini is mining the text to compile MCQ, True/False, and Fill-in-the-blank questions matching the requested difficulty.
            </p>
          </div>
        ) : !selectedFile ? (
          <div className="p-12 text-center text-slate-400 rounded-3xl glass-card">
            Please upload study materials to start taking quizzes.
          </div>
        ) : !activeQuiz ? (
          /* CONFIG & START PRE-SCREEN */
          <div className="grid md:grid-cols-2 gap-8">
            {/* Generate New Quiz Card */}
            <div className="p-8 rounded-3xl glass-card space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Generate New Quiz
              </h3>

              <div className="space-y-4">
                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-2 rounded-xl text-xs font-bold capitalize border transition-colors ${
                          difficulty === d
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Number of Questions</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 8, 10].map((c) => (
                      <button
                        key={c}
                        onClick={() => setQuestionCount(c)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          questionCount === c
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        {c} Questions
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateQuiz}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Compile AI Quiz
              </button>
            </div>

            {/* Previous Quizzes History */}
            <div className="p-8 rounded-3xl glass-card space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-slate-400" />
                Previous Quiz Runs
              </h3>

              {quizzes.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No quizzes taken yet for this file. Build one on the left!</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between hover:border-indigo-500/20 transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold truncate max-w-[200px]">{quiz.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                          <span className="capitalize text-indigo-400">{quiz.difficulty}</span>
                          <span>•</span>
                          <span>{quiz.questions.length} Qs</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartQuiz(quiz)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Start Run
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE SESSION (RUNNING OR REPORT) */
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header: Title and Timer */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40">
              <div>
                <h4 className="font-extrabold text-sm truncate max-w-xs">{activeQuiz.title}</h4>
                <p className="text-[10px] text-slate-400 font-semibold capitalize mt-0.5">Difficulty: {activeQuiz.difficulty}</p>
              </div>

              {timerActive && (
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border ${
                  timeLeft < 30 ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-500'
                }`}>
                  <Timer className="h-4 w-4" />
                  {formatTime(timeLeft)}
                </div>
              )}

              {quizSubmitted && (
                <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                  Graded
                </span>
              )}
            </div>

            {/* Score Summary Panel (If submitted) */}
            {quizSubmitted && report && (
              <div className="p-6 rounded-3xl bg-indigo-600 text-white text-center space-y-3 shadow-xl shadow-indigo-600/25">
                <p className="text-xs font-black uppercase tracking-wider text-indigo-200">Session Score</p>
                <p className="text-5xl font-black">
                  {report.attempt.score} / {report.attempt.totalQuestions}
                </p>
                <p className="text-xs text-indigo-100">
                  Accuracy level: {Math.round((report.attempt.score / report.attempt.totalQuestions) * 100)}%
                </p>
                <button
                  onClick={() => handleSelectFile(selectedFile)}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Terminal Dashboard
                </button>
              </div>
            )}

            {/* Questions Thread */}
            <div className="space-y-6">
              {activeQuiz.questions.map((q, qIdx) => {
                const isCorrect = quizSubmitted && report && answers[qIdx].trim().toLowerCase() === report.correctAnswers[qIdx].trim().toLowerCase();
                return (
                  <div
                    key={qIdx}
                    className={`p-6 rounded-3xl border transition-all ${
                      quizSubmitted
                        ? isCorrect
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                        : 'glass-card'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        Question {qIdx + 1}
                      </span>
                      {quizSubmitted && report && (
                        <span>
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-4 font-bold text-sm md:text-md leading-relaxed">
                      {q.question}
                    </h4>

                    {/* Question Input fields based on type */}
                    <div className="mt-5 space-y-2">
                      {/* MCQ / TrueFalse option bubbles */}
                      {['mcq', 'true_false'].includes(q.type) ? (
                        <div className="grid gap-2">
                          {q.options.map((opt) => {
                            const isSelected = answers[qIdx] === opt;
                            const isCorrectOpt = quizSubmitted && report && opt === report.correctAnswers[qIdx];
                            return (
                              <button
                                key={opt}
                                disabled={quizSubmitted}
                                onClick={() => handleAnswerChange(qIdx, opt)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                  isSelected
                                    ? isCorrectOpt || !quizSubmitted
                                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-500 font-bold'
                                      : 'bg-red-500/10 border-red-500 text-red-500 font-bold'
                                    : isCorrectOpt
                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 font-bold'
                                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900/40'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Fill in the blank input field */
                        <div className="space-y-1">
                          <input
                            type="text"
                            disabled={quizSubmitted}
                            value={answers[qIdx]}
                            onChange={(e) => handleAnswerChange(qIdx, e.target.value)}
                            placeholder="Type your fill-in answer..."
                            className={`w-full px-4 py-3 bg-slate-100/55 dark:bg-slate-900/40 border rounded-xl text-xs focus:outline-none transition-all ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'border-emerald-500 text-emerald-500 font-bold'
                                  : 'border-red-500 text-red-500 font-bold'
                                : 'border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/25'
                            }`}
                          />
                          {quizSubmitted && !isCorrect && (
                            <p className="text-[10px] text-emerald-500 font-bold mt-1.5 pl-1">
                              Correct answer: {report.correctAnswers[qIdx]}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Explanations (only visible after submission) */}
                    {quizSubmitted && report && (
                      <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <HelpCircle className="h-3.5 w-3.5" />
                          Explanation
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-1 text-justify">
                          {report.explanations[qIdx]}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Bar */}
            {!quizSubmitted && (
              <button
                onClick={() => handleSubmitQuiz(false)}
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Quiz Session'}
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Quiz;

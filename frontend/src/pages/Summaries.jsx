import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import {
  FileText,
  Sparkles,
  Download,
  BookOpen,
  ListCollapse,
  Layers,
  Award,
  Loader2,
  Bookmark,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Summaries = () => {
  const location = useLocation();

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'keynotes' | 'definitions' | 'formulas' | 'notes'
  
  const [expandedDef, setExpandedDef] = useState(null);

  const currentSessionIdRef = useRef(null);

  useEffect(() => {
    if (selectedFile) {
      const startSession = async () => {
        try {
          if (currentSessionIdRef.current) {
            await api.post('/progress/session/end', { sessionId: currentSessionIdRef.current });
            currentSessionIdRef.current = null;
          }
          const res = await api.post('/progress/session/start', { fileId: selectedFile._id });
          currentSessionIdRef.current = res.data.session._id;
        } catch (err) {
          console.error('Failed to start study session:', err.message);
        }
      };
      startSession();
    }

    return () => {
      if (currentSessionIdRef.current) {
        const sessionId = currentSessionIdRef.current;
        currentSessionIdRef.current = null;
        api.post('/progress/session/end', { sessionId }).catch(err => {
          console.error('Failed to end study session:', err.message);
        });
      }
    };
  }, [selectedFile?._id]);

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

  const handleSelectFile = async (file) => {
    setSelectedFile(file);
    setSummary(null);
    if (file.summary) {
      setSummary(file.summary);
    } else {
      // Check if it exists on backend
      try {
        const response = await api.get(`/summaries/file/${file._id}`);
        setSummary(response.data.summary);
      } catch (err) {
        // Summary doesn't exist yet, we will show "Generate" prompt
        setSummary(null);
      }
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedFile) return;
    setGenerating(true);
    try {
      const response = await api.post('/summaries/generate', { fileId: selectedFile._id });
      setSummary(response.data.summary);
      // Update local file summary property
      setFiles(files.map(f => f._id === selectedFile._id ? { ...f, summary: response.data.summary } : f));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate summary.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedFile) return;
    const token = localStorage.getItem('accessToken');
    // We open a window with the auth token passed as a query param or let browser download it directly via fetch
    // Streaming download via fetch:
    api.get(`/summaries/file/${selectedFile._id}/pdf`, { responseType: 'blob' })
      .then((response) => {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_study_summary.pdf`;
        link.click();
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to download PDF summary');
      });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Generated Summaries</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Synthesize chapter synopses, key definitions, math formulas, and revision note guides.
            </p>
          </div>

          {summary && (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-lg shadow-indigo-600/15 cursor-pointer self-start sm:self-auto"
            >
              <Download className="h-4 w-4" />
              Export as PDF
            </button>
          )}
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

        {/* Content Section */}
        {generating ? (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4 rounded-3xl glass-card">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <h4 className="font-bold text-lg">AI Summarizing Pipeline Active</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Gemini is scanning the document chunks to extract chapters, definitions, and key revision nodes. This may take up to 20 seconds.
            </p>
          </div>
        ) : !selectedFile ? (
          <div className="p-12 text-center text-slate-400 rounded-3xl glass-card">
            Please upload study materials to start generating summaries.
          </div>
        ) : !summary ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-5 rounded-3xl glass-card">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-full">
              <FileText className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold">No Summary Generated</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              You haven't generated an AI study summary for <span className="font-semibold text-slate-200">"{selectedFile.name}"</span> yet.
            </p>
            <button
              onClick={handleGenerateSummary}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-md shadow-indigo-600/15 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Generate Study Package
            </button>
          </div>
        ) : (
          /* Summary Tabs View */
          <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800/60 overflow-x-auto gap-2 pb-px">
              {[
                { id: 'summary', label: 'Synopsis', icon: BookOpen },
                { id: 'keynotes', label: 'Key Points', icon: ListCollapse },
                { id: 'definitions', label: 'Definitions', icon: Bookmark },
                { id: 'formulas', label: 'Formulas', icon: Layers },
                { id: 'notes', label: 'Study Guides', icon: Award }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 font-bold text-xs shrink-0 transition-colors border-b-2 -mb-px ${
                      isActive
                        ? 'border-indigo-600 text-indigo-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content screens */}
            <div className="glass-card rounded-3xl p-6 min-h-[300px]">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Chapter Summary</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-md text-justify">
                    {summary.chapterSummary || 'No summary extracted.'}
                  </p>
                </div>
              )}

              {activeTab === 'keynotes' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Key Takeaways</h3>
                  {summary.bulletNotes && summary.bulletNotes.length > 0 ? (
                    <ul className="list-disc list-inside space-y-3 pl-2">
                      {summary.bulletNotes.map((note, idx) => (
                        <li key={idx} className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {note}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No bullet keynotes found in document.</p>
                  )}
                </div>
              )}

              {activeTab === 'definitions' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Key Definitions</h3>
                  {summary.definitions && summary.definitions.length > 0 ? (
                    <div className="space-y-3">
                      {summary.definitions.map((def, idx) => (
                        <div key={idx} className="rounded-2xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 overflow-hidden">
                          <button
                            onClick={() => setExpandedDef(expandedDef === idx ? null : idx)}
                            className="w-full px-5 py-4 flex items-center justify-between font-bold text-xs md:text-sm text-left text-indigo-500"
                          >
                            <span>{def.term}</span>
                            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedDef === idx ? 'rotate-180' : ''}`} />
                          </button>
                          {expandedDef === idx && (
                            <div className="px-5 pb-4 text-xs md:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200/40 dark:border-slate-800/20 pt-3">
                              {def.definition}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No formal definitions generated.</p>
                  )}
                </div>
              )}

              {activeTab === 'formulas' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Equations & Formulas</h3>
                  {summary.formulas && summary.formulas.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {summary.formulas.map((form, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between">
                          <p className="text-sm font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl w-fit">
                            {form.formula}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-300 mt-3 font-semibold">
                            {form.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No mathematical formulas detected in text.</p>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-8">
                  {/* Short Notes */}
                  <div className="space-y-2">
                    <h4 className="text-md font-extrabold text-indigo-400">Short Summary</h4>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {summary.shortNotes || 'No notes available.'}
                    </p>
                  </div>

                  {/* Long Notes */}
                  <div className="space-y-2">
                    <h4 className="text-md font-extrabold text-indigo-400">Detailed Long Guide</h4>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {summary.longNotes || 'No notes available.'}
                    </p>
                  </div>

                  {/* Revision Notes */}
                  <div className="space-y-2">
                    <h4 className="text-md font-extrabold text-indigo-400">Quick Exam Cheat Sheet</h4>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {summary.revisionNotes || 'No notes available.'}
                    </p>
                  </div>

                  {/* Mind Map */}
                  {summary.mindMap && (
                    <div className="space-y-3">
                      <h4 className="text-md font-extrabold text-indigo-400">Concept Map (Hierarchy)</h4>
                      <pre className="p-4 bg-slate-950 rounded-2xl text-xs font-mono text-emerald-500 border border-slate-800 overflow-x-auto">
                        <code>{summary.mindMap}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Summaries;

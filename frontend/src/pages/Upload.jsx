import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  Video,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Upload = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [ytUrl, setYtUrl] = useState('');
  const [processingYt, setProcessingYt] = useState(false);

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;

    setProcessingYt(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/files/youtube', { url: ytUrl });
      setSuccessMsg('YouTube link registered successfully. AI is parsing the video subtitles...');
      setYtUrl('');
      fetchFiles();
    } catch (error) {
      console.error('YouTube link processing failed:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to process YouTube link. Make sure the video has subtitles.');
    } finally {
      setProcessingYt(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error fetching files:', error.message);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    const hasProcessing = files.some((f) => f.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchFiles();
    }, 4000);

    return () => clearInterval(interval);
  }, [files]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const uploadDocument = async (fileObj) => {
    alert("uploadDocument started for: " + fileObj.name);
    if (!fileObj) return;
    
    // Check size limit: 100MB
    const limit = 100 * 1024 * 1024;
    if (fileObj.size > limit) {
      setErrorMsg('File exceeds 100 MB size limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileObj);

    setUploading(true);
    setUploadProgress(10);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Simulate progress progress increments (actual file uploads over Axios can track progress via onUploadProgress, but local uploads are instant, so we simulate UI progress)
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(interval);
      setUploadProgress(100);
      setSuccessMsg('File uploaded successfully. AI is now indexing text...');
      fetchFiles();
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setErrorMsg(error.response?.data?.message || 'File upload failed. Ensure server is active.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadDocument(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileSelect = (e) => {
    alert("File select event triggered!");
    if (e.target.files && e.target.files[0]) {
      alert("Selected file: " + e.target.files[0].name);
      uploadDocument(e.target.files[0]);
    } else {
      alert("No file found in event!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file? This will permanently erase associated AI embeddings, flashcards, chats, and quizzes.')) return;
    try {
      await api.delete(`/files/${id}`);
      setFiles(files.filter(f => f._id !== id));
      setSuccessMsg('Material deleted successfully.');
    } catch (error) {
      setErrorMsg('Deletion failed. Try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Upload Center</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Drag study materials here. AI automatically splits and embeds the text to support chats, summaries, and quizzes.
          </p>
        </div>

        {errorMsg && <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-500 rounded-2xl text-xs font-semibold">{errorMsg}</div>}
        {successMsg && <div className="p-4 bg-green-500/10 border border-green-500/25 text-green-500 rounded-2xl text-xs font-semibold">{successMsg}</div>}

        {/* Drag & Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[250px] ${
            isDragActive
              ? 'border-indigo-600 bg-indigo-500/5 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-900/10'
          }`}
        >
          <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl mb-4">
            <UploadCloud className="h-10 w-10 animate-pulse" />
          </div>

          <p className="text-md font-bold mb-1">
            Drag & drop your document here, or{' '}
            <label htmlFor="file-upload" className="text-indigo-500 cursor-pointer hover:underline">
              browse files
            </label>
            <input
              id="file-upload"
              type="file"
              className="sr-only"
              accept=".pdf,.pptx,.docx,.txt"
              onChange={onFileSelect}
              disabled={uploading}
            />
          </p>
          <p className="text-xs text-slate-400 font-medium">Supports PDF, PPTX, DOCX, and TXT up to 100 MB</p>

          {/* Progress Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-white">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
              <p className="text-sm font-bold">Uploading file...</p>
              <div className="w-64 bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">{uploadProgress}% Complete</p>
            </div>
          )}
        </div>

        {/* YouTube Summarizer Input Card */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100/10 dark:bg-slate-900/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl">
              <Video className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">YouTube Video Summarizer</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Paste a YouTube URL to extract video subtitles and study with the video.</p>
            </div>
          </div>
          <form onSubmit={handleYoutubeSubmit} className="flex gap-2">
            <input
              type="text"
              disabled={processingYt}
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className="flex-1 px-4 py-3 bg-slate-100/55 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/25 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={processingYt || !ytUrl.trim()}
              className="px-5 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10 flex items-center gap-2 cursor-pointer shrink-0"
            >
              {processingYt ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Indexing...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Summarize
                </>
              )}
            </button>
          </form>
        </div>

        {/* Uploads History */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-400" />
            Upload History
          </h3>

          {loadingFiles ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/50 animate-pulse border border-slate-200/50" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
              No files uploaded yet. Add a document above to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {files.map((file) => (
                <div
                  key={file._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl glass-card gap-4 hover:border-indigo-500/10 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                        <span className="uppercase">{file.type}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.size)}</span>
                        {file.numPages && (
                          <>
                            <span>•</span>
                            <span>{file.numPages} Pages</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/50 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      {file.status === 'processing' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 animate-pulse">
                          <Clock className="h-3 w-3" />
                          Indexing...
                        </span>
                      )}
                      {file.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" />
                          AI Ready
                        </span>
                      )}
                      {file.status === 'failed' && (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500"
                          title={file.error || 'Unknown parsing failure'}
                        >
                          <AlertCircle className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === 'completed' && (
                        <>
                          <button
                            onClick={() => navigate(`/chat?fileId=${file._id}`)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Chat
                          </button>
                          <button
                            onClick={() => navigate(`/summaries?fileId=${file._id}`)}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Summary
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(file._id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
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

export default Upload;

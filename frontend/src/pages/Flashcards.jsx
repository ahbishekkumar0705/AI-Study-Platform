import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../utils/api';
import {
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Star,
  Loader2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Flashcards = () => {
  const location = useLocation();

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cards, setCards] = useState([]);
  
  // Flashcard viewer state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    // Load flashcards for this file
    try {
      const response = await api.get(`/flashcards/file/${file._id}`);
      setCards(response.data.flashcards);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateCards = async () => {
    if (!selectedFile) return;
    setGenerating(true);
    try {
      const response = await api.post('/flashcards/generate', {
        fileId: selectedFile._id,
        count: 10
      });
      setCards(response.data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate flashcards.');
    } finally {
      setGenerating(false);
    }
  };

  // Toggles for card meta flags
  const handleToggleDifficult = async () => {
    if (cards.length === 0) return;
    const card = cards[currentIndex];
    const newDifficult = !card.isDifficult;
    
    try {
      const response = await api.put(`/flashcards/${card._id}`, {
        isDifficult: newDifficult
      });
      // Update local state
      setCards(cards.map((c, i) => i === currentIndex ? response.data.flashcard : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async () => {
    if (cards.length === 0) return;
    const card = cards[currentIndex];
    const newFavorite = !card.isFavorite;

    try {
      const response = await api.put(`/flashcards/${card._id}`, {
        isFavorite: newFavorite
      });
      setCards(cards.map((c, i) => i === currentIndex ? response.data.flashcard : c));
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation functions
  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleShuffle = () => {
    if (cards.length === 0) return;
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (cards.length === 0) return;
      
      // Ignore key events if user is typing in inputs elsewhere
      if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'KeyD':
          handleToggleDifficult();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards, currentIndex]);

  const activeCard = cards[currentIndex];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Flashcard Decks</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Build interactive study decks. Click cards or press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px] border border-slate-300 dark:border-slate-700">Space</kbd> to flip them.
          </p>
        </div>

        {/* File Selection Topbar */}
        <div className="p-4 rounded-3xl glass-card flex flex-wrap items-center gap-3">
          <span className="text-xs font-black uppercase text-slate-400 px-1">Study Deck:</span>
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
            <h4 className="font-bold text-lg">AI Flashcard Compilation Pipeline</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Gemini is mining the document text for key concepts and formulations to synthesize 10 revision cards.
            </p>
          </div>
        ) : !selectedFile ? (
          <div className="p-12 text-center text-slate-400 rounded-3xl glass-card">
            Please upload study materials to start generating flashcards.
          </div>
        ) : cards.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-5 rounded-3xl glass-card">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-full">
              <Layers className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold">No Flashcards Generated</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              You haven't generated a card deck for <span className="font-semibold text-slate-200">"{selectedFile.name}"</span> yet.
            </p>
            <button
              onClick={handleGenerateCards}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-md shadow-indigo-600/15 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Generate 10 Flashcards
            </button>
          </div>
        ) : (
          /* Flashcards Active Deck View */
          <div className="max-w-xl mx-auto space-y-6 flex flex-col items-center">
            {/* Top Deck Stats / Actions */}
            <div className="w-full flex items-center justify-between px-2">
              <span className="text-xs font-black text-slate-400">
                CARD {currentIndex + 1} OF {cards.length}
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={handleShuffle}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Shuffle deck"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  Shuffle
                </button>
              </div>
            </div>

            {/* Flashcard 3D Wrapper */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full aspect-[4/3] max-w-md perspective-1000 cursor-pointer group"
            >
              <div
                className={`w-full h-full relative transform-style-3d transition-transform duration-500 ease-out border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* 1. FRONT SIDE */}
                <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-wider uppercase bg-indigo-600/10 text-indigo-500 px-3 py-1 rounded-full">
                      Concept Prompt
                    </span>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={handleToggleFavorite}
                        className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          activeCard.isFavorite ? 'text-amber-500' : 'text-slate-400'
                        }`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    </div>
                  </div>

                  <div className="text-center py-4 px-2">
                    <h3 className="text-md sm:text-xl font-extrabold leading-relaxed text-slate-800 dark:text-slate-100">
                      {activeCard.front}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span onClick={(e) => { e.stopPropagation(); handleToggleDifficult(); }} className={`px-2.5 py-1 rounded-full border cursor-pointer hover:bg-red-500/10 hover:text-red-500 ${
                      activeCard.isDifficult ? 'bg-red-500/10 border-red-500/25 text-red-500' : 'border-slate-200 dark:border-slate-800'
                    }`}>
                      {activeCard.isDifficult ? 'Difficult Flagged' : 'Flag Difficult (D)'}
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Click to reveal
                    </span>
                  </div>
                </div>

                {/* 2. BACK SIDE */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 dark:bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-8 flex flex-col justify-between text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">
                      Answer Key
                    </span>
                  </div>

                  <div className="text-center py-4 px-2">
                    <p className="text-xs sm:text-md leading-relaxed text-slate-200">
                      {activeCard.back}
                    </p>
                  </div>

                  <div className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    Click to flip back
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <button
                onClick={handlePrev}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 rounded-2xl transition-colors border border-slate-200 dark:border-slate-800/60 cursor-pointer"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 rounded-2xl transition-colors border border-slate-200 dark:border-slate-800/60 cursor-pointer"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Bar indicator */}
            <div className="w-64 space-y-1.5 mt-2">
              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                <span>Deck Progress</span>
                <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Flashcards;

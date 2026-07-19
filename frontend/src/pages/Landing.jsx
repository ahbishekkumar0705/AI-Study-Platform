import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  BookOpen,
  MessageSquare,
  FileText,
  Layers,
  Award,
  BarChart2,
  BrainCircuit,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Sun,
  Moon,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      title: 'AI Document Chat',
      desc: 'Converse with PDFs, PPTs, DOCX, and TXTs. Query details and get answers strictly restricted to your text.',
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Instant Study Summaries',
      desc: 'Extract chapter synopses, bullet points, core definitions, and formulas instantly from massive textbooks.',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Dynamic Flashcards',
      desc: 'Let AI generate card decks for memory review. Swipe, shuffle, and flag difficult concepts with ease.',
      icon: Layers,
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Custom Quiz Generator',
      desc: 'Test yourself with MCQs, True/False, and Fill-in-the-blanks with grading and reasoning reports.',
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Progress Analytics',
      desc: 'Log hours, track your daily active streaks, and inspect score curves with graphic dashboards.',
      icon: BarChart2,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Gemini-Powered Brain',
      desc: 'Driven by Google Gemini for state-of-the-art accuracy, natural language speed, and smart summaries.',
      icon: BrainCircuit,
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const pricingPlans = [
    {
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      features: ['Upload up to 5 documents', '10MB max file size', 'Standard Gemini 2.5 Chat', '5 Flashcards per doc', '3 Quiz attempts'],
      cta: 'Start Learning',
      popular: false,
    },
    {
      name: 'Scholar Pro',
      price: '$9',
      period: 'month',
      features: ['Unlimited document uploads', '100MB max file size', 'Gemini 2.5 Pro Chat & Synthesis', 'Unlimited Flashcards & Quizzes', 'Detailed Progress Analytics', 'PDF Summary exporting'],
      cta: 'Upgrade to Pro',
      popular: true,
    },
    {
      name: 'Institution Premium',
      price: '$29',
      period: 'month',
      features: ['Everything in Scholar Pro', 'Shared classrooms / Group study', 'API keys integration', 'Admin progress dashboards', 'Priority processing queues'],
      cta: 'Contact Institution',
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Medical Student',
      comment: 'This tool changed how I study. I upload 400-page anatomy PDFs, and I can ask specific questions or generate flashcards instantly. Saves me hours!',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
    },
    {
      name: 'Alex Rivera',
      role: 'Software Engineering Major',
      comment: 'The quiz generator is insane. It catches the technical nuances from programming textbooks and gives detailed explanations for wrong answers.',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    },
  ];

  const faqs = [
    {
      q: 'Which file formats does the platform support?',
      a: 'We support PDF, PPTX (Powerpoint), DOCX (Word), and TXT text files up to 100MB in size.',
    },
    {
      q: 'Is my data secure?',
      a: 'Yes, your uploaded materials are private and indexed locally. They are only accessible by you and are never shared or used to train public models.',
    },
    {
      q: 'How does the AI document chat work?',
      a: 'We use vector similarity search (RAG) to find sections of your document relevant to your question. We then prompt Google Gemini to draft an answer based strictly on those sections.',
    },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/40 glass-effect sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            StudyFlow AI
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <Link
            to="/auth/login"
            className="text-sm font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/auth/login?register=true"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[90px] pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-900/30">
            <Sparkles className="h-4 w-4" />
            Supercharge Your Learning with Google Gemini
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15]">
            Chat with Your Textbooks.<br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Master Any Subject in Minutes.
            </span>
          </h2>

          <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Upload PDFs, PPTs, and Word docs. Chat directly with the material, synthesize bullet summaries, build 3D flashcards, and run practice quizzes.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/login?register=true"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-extrabold shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-1 hover:shadow-indigo-600/40"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-2xl font-bold transition-all hover:-translate-y-0.5"
            >
              Explore Features
            </a>
          </div>
        </motion.div>

        {/* Floating Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800/80 glass-card p-2"
        >
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-[16/9] flex items-center justify-center relative">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200"
              alt="Dashboard mockup"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center p-6 text-center">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <BrainCircuit className="h-12 w-12 text-white animate-pulse" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">AI Study Engine Active</h3>
              <p className="text-sm text-slate-200 max-w-sm mt-2">Ready to ingest PDFs, PPTXs, and DOCX text nodes.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200 dark:border-slate-800/40">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Powerful Learning Tools</h2>
          <p className="text-slate-500 dark:text-slate-400">Everything you need to turn complex readings into structured knowledge.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-8 rounded-3xl glass-card hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg group"
              >
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${feat.color} text-white w-fit shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold">{feat.title}</h3>
                <p className="mt-3 text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200 dark:border-slate-800/40 bg-slate-900/10 rounded-3xl">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Flexible Academic Pricing</h2>
          <p className="text-slate-500 dark:text-slate-400">Unlock full capabilities. Start learning for free, upgrade as you grow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`p-8 rounded-3xl flex flex-col relative ${
                plan.popular
                  ? 'bg-slate-900 border-2 border-indigo-500 text-white dark:bg-slate-900/80 shadow-indigo-500/10 shadow-2xl'
                  : 'glass-card'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className={`text-xs ${plan.popular ? 'text-slate-300' : 'text-slate-400'}`}>/{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-4 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm">
                    <CheckCircle className={`h-5 w-5 shrink-0 ${plan.popular ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <span className={plan.popular ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'}>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/auth/login?register=true"
                className={`mt-8 w-full py-4 rounded-2xl font-bold text-center transition-all ${
                  plan.popular
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-200 dark:border-slate-800/40">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Loved by Students</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((test) => (
            <div key={test.name} className="p-8 rounded-3xl glass-card space-y-6">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(test.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 italic">"{test.comment}"</p>
              <div className="flex items-center gap-4">
                <img src={test.avatar} alt={test.name} className="h-11 w-11 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold">{test.name}</h4>
                  <p className="text-xs text-slate-400">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 border-t border-slate-200 dark:border-slate-800/40">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-center mb-16">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={faq.q} className="rounded-2xl glass-card overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-md md:text-lg"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-6 text-sm md:text-md text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-200/50 dark:border-slate-800/40 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 dark:border-slate-800/40 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BrainCircuit className="h-5 w-5 text-indigo-600" />
          <span className="font-bold">StudyFlow AI</span>
        </div>
        <p>&copy; {new Date().getFullYear()} StudyFlow AI. All rights reserved.</p>
        <p className="mt-2 text-slate-500">Built using React, Vite, Node, Express, MongoDB, and Gemini API.</p>
      </footer>
    </div>
  );
};

export default Landing;

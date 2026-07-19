# 🚀 StudyFlow AI - Premium AI Study Platform

A modern, premium, full-stack AI-powered study platform where students upload study materials (PDF, PPTX, DOCX, TXT, or YouTube video links), chat with their documents using AI vector search, generate summaries, study flashcard decks, attempt auto-graded quizzes, and track learning streaks and analytics.

---

## 🛠️ Technology Stack Built

1. **Backend**:
   - **Node.js** + **Express.js** API using modern ES module imports (`import/export`).
   - **MongoDB** + **Mongoose** for data storage, indexing, and cascade collection cleanups.
   - **JWT** + **bcryptjs** for secure auth and refresh token rotations.
   - **pdf-parse**, **mammoth** (DOCX), and custom slide-by-slide XML extractors (**adm-zip** for PPTX) for local document text parsing.
   - **youtube-transcript** to scrape and extract text subtitles directly from YouTube URLs.
   - **PDFKit** to stream summaries into dynamically compiled PDF downloads.
2. **Frontend**:
   - **React** + **Vite** single-page application.
   - **Tailwind CSS v4** + custom glassmorphic variables for premium dark mode aesthetics.
   - **Recharts** for weekly study and AI activity graphic logs.
   - **Framer Motion** for smooth transitions and card flip effects.
   - **Lucide React** for premium vector iconography.
3. **AI Core**:
   - **Google Gemini API** (`gemini-2.5-flash` and `gemini-embedding-2`).
   - **Custom Cosine Similarity** vector store implemented natively in Javascript/MongoDB to process and retrieve relevant context chunks under RAG constraints.

---

## 🚀 Key Features Implemented

### 1. Ingestion Pipeline & Local Storage
- Local file upload (up to 100MB) with PDF, DOCX, PPTX, and TXT capability.
- Asynchronous document chunking and vector indexing using Gemini embeddings, running in the background.

### 2. YouTube Link Summarizer
- YouTube video URL paste input directly in the Upload Center.
- Automated public YouTube oEmbed metadata extraction to pull official video titles without needing restricted API keys.
- Extraction of video subtitles and transcripts using `youtube-transcript`.
- Seamless vector chunking and indexing of transcripts, converting YouTube videos into study materials that support Summaries, AI Chat, Flashcards, and Quizzes!
- **Gemini Free-Tier Optimized**: Built-in 10-chunk batch size limits and 7-second pauses to guarantee stable execution under Google's 100 requests-per-minute free tier quota.
- **Automatic 429 Retry Handler**: Automatic 15-second delay and retry loop in case of transient rate-limits.

### 3. Conversational Document AI (RAG)
- Multi-message chats tied to specific document/video instances.
- Custom vector search injects relevant context chunks.
- Rigid prompt constraints forcing Gemini to respond with: *"This information is not available in your uploaded documents."* if the answer is not found in the file, preventing hallucinations.

### 4. Study Summaries & Exporters
- One-click summaries compiling chapters, definitions, and equations in JSON format.
- PDF exporter compiles these values and streams a downloadable PDF document to the student.

### 5. Interactive 3D Flashcards
- Cards generated from document texts using Gemini.
- Double-sided CSS 3D flip card, shuffle deck, and difficulty/favorite toggles.
- Keyboard listeners (Arrow keys for navigation, Space to flip, `D` to toggle difficulty).

### 6. Custom Quiz Terminal
- Quiz generator supporting MCQs, True/False, and Fill-in-the-blanks.
- Difficulty levels (Easy, Medium, Hard).
- Back-end autograding to prevent client spoofing. Displays scores, correctness indicators, and detailed explanation text sheets.

### 7. Analytics Progress Page
- Tracks streaks (automatically incremented or reset during study sessions).
- Recharts graphs mapping study durations and AI queries over the last 7 days.

### 8. Account Management & Hazard Zone
- Edit profiles, select avatars, update passwords, and delete accounts (which cascadingly unlinks physical disk uploads and purges all DB collections).

---

## ⚙️ How to Setup & Run Locally

### Step 1: Configure Environment Variables
Copy `backend/.env.example` to `backend/.env` (or create a new file) and replace placeholders with your credentials:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Step 2: Spin Up the Backend API Server
Navigate to the `backend` folder, install dependencies, and start the server:
```bash
cd backend
npm install
npm run dev
```
> [!NOTE]
> The server will connect to MongoDB and listen on port `5000`.

### Step 3: Spin Up the Frontend Dev Server
Navigate to the `frontend` folder, install dependencies, and start the client:
```bash
cd frontend
npm install
npm run dev
```
> [!TIP]
> Open the displayed address `http://localhost:5173` in your browser.

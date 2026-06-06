# ExamPortal — Online Examination Platform

A full-stack online examination platform built with **Next.js 16**, **Prisma**, and **Google Gemini AI**. Features a GATE-style test engine with fullscreen enforcement, AI-powered grading for descriptive answers, and comprehensive analytics.

---

## ✨ Features

### For Students
- **GATE-style Test Engine** — Fullscreen mode, countdown timer, question palette with status tracking
- **Multiple Question Types** — MCQ, MSQ (multi-select), NAT (numeric), and Descriptive
- **AI-Powered Grading** — Descriptive answers auto-graded by Google Gemini
- **Performance Analytics** — Per-test analysis, cumulative reports, pie charts, score trends
- **AI Insights** — Personalized strengths, weaknesses, and study recommendations
- **Scientific Calculator** — Draggable, GATE-style calculator during tests
- **Image Zoom** — Click-to-zoom for question media/diagrams

### For Admins
- **Exam Management** — Create exams with configurable duration, scheduling, and media uploads
- **User Management** — Promote/demote admins, reset passwords, delete users
- **Super Admin** — Special role with elevated privileges (demote admins, delete admins)
- **Analytics Dashboard** — View all student submissions and performance data

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite (Prisma ORM) |
| Auth | JWT (jose) + bcryptjs |
| AI | Google Gemini 2.5 Flash |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** (or yarn/pnpm)

### 1. Clone the Repository
```bash
git clone https://github.com/avimishra261/Exam-Portal.git
cd Exam-Portal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and set the required values:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Database connection URL (default: `file:./dev.db`) |
| `JWT_SECRET` | ✅ | Random 32+ char string for JWT signing |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI features |

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up the Database
```bash
npx prisma migrate dev
npx tsx prisma/seed.ts
```

This creates the SQLite database and seeds a Super Admin account:
- **Email:** `admin@examportal.local`
- **Password:** `password` (⚠️ Change this immediately!)

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, global CSS)
│   ├── page.tsx                # Root redirect → dashboard or login
│   ├── login/page.tsx          # Login page
│   ├── register/page.tsx       # Registration page
│   ├── actions/
│   │   ├── auth.ts             # Login, register, logout server actions
│   │   ├── admin.ts            # Exam CRUD, user management actions
│   │   └── student.ts          # Exam submission with AI grading
│   ├── api/
│   │   └── ai-insights/route.ts  # AI performance insights endpoint
│   └── dashboard/
│       ├── layout.tsx          # Sidebar navigation + auth guard
│       ├── page.tsx            # Dashboard home with stats
│       ├── loading.tsx         # Skeleton loading state
│       ├── error.tsx           # Error boundary
│       ├── tests/              # Test listing & test-taking
│       ├── analysis/           # Per-test performance breakdown
│       ├── reports/            # Cumulative performance reports
│       └── admin/              # Admin-only pages (create tests, manage users)
├── components/
│   ├── TestEngine.tsx          # Full test-taking UI engine
│   ├── Calculator.tsx          # Scientific calculator
│   ├── PieChart.tsx            # SVG donut chart
│   ├── AIInsights.tsx          # AI insights display
│   └── ImageZoomModal.tsx      # Image lightbox
├── lib/
│   ├── auth.ts                 # JWT utilities + session management
│   └── prisma.ts               # Prisma client singleton
├── types/
│   └── index.ts                # Shared TypeScript types
└── middleware.ts               # Centralized auth middleware
```

---

## 🗃 Database Schema

| Model | Description |
|---|---|
| `User` | Students and admins with email/password auth |
| `Exam` | Exam configuration (title, duration, scheduling) |
| `Question` | Questions with type, media, and correct answers |
| `Option` | MCQ/MSQ answer options |
| `Submission` | Student exam submissions with scores |
| `SubmissionAnswer` | Per-question answers and marks |

---

## 🔑 User Roles

| Role | Capabilities |
|---|---|
| **Student** | Take tests, view analysis/reports, see AI insights |
| **Admin** | Create exams, manage users, view all submissions |
| **Super Admin** | Admin + demote other admins, delete admins |

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma migrate dev` | Run database migrations |
| `npx tsx prisma/seed.ts` | Seed the database |

---

## 🔒 Security Notes

- JWT secret **must** be set via `JWT_SECRET` environment variable
- Session cookies are `httpOnly` and `secure` in production
- File uploads are validated for MIME type (images only) and size (5MB max)
- Registration always creates `STUDENT` role — admin promotion is manual
- Auth middleware protects all dashboard routes centrally

---

## 📄 License

This project is private. See the repository for license details.

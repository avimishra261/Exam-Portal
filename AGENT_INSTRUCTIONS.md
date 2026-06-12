# ExamPortal Developer Knowledge Base (For AI Agents)

Hello! If you are an AI agent or a developer working on this project in the future, please read this document carefully before making any structural changes to the codebase.

## 1. Project Overview & Architecture
ExamPortal is a Next.js (App Router) application designed to facilitate secure, timed, and strictly monitored online examinations. 
- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (via Prisma ORM). Note: SQLite was previously used for local dev but Vercel requires PostgreSQL because the local file system is read-only.
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based custom auth (cookies).

## 2. Security & Anti-Cheat Mechanisms
ExamPortal employs strict anti-cheat features that MUST NOT be disabled or bypassed:
- **SingleTabEnforcer**: Uses the `BroadcastChannel` API to ensure a student can only have the test portal open in ONE browser tab. If they open another, the new tab gets a permanent blocking warning screen.
- **Strict Fullscreen & Exit Counting**: The `TestEngine` forces the browser into fullscreen. Exiting fullscreen or switching tabs increments a counter (`exitCount`). If `exitCount > exam.fullscreenChances`, the test is **AUTO-SUBMITTED**.
- **Keyboard Lock API**: We lock the `Escape` and `F11` keys when in fullscreen mode.
- **Single Test Enforcement**: The server route `src/app/dashboard/tests/[id]/page.tsx` strictly blocks a student from starting or opening a new test if they already have another test in the `IN_PROGRESS` state.

## 3. UI Component Modularity
The core test interface `TestEngine` was previously a massive 700+ line monolith. It has been successfully refactored into the following modular structure in `src/components/TestEngine/`:
- `index.tsx`: The main wrapper that handles state (time, fullscreen, paused).
- `TestHeader.tsx`: Handles the top bar, timer, and section navigation.
- `QuestionArea.tsx`: Renders the question content, images, MCQ/NAT inputs.
- `QuestionPalette.tsx`: Renders the right sidebar (student profile, question grid map, submit button).
- `TestModals.tsx`: Contains the Question Paper popup, Instructions popup, and Submit confirmation modal.
**Rule**: Do NOT combine these back into a single file. Keep new features modular.

## 4. Development Constraints
- **Registration**: Only `@gmail.com` addresses are allowed during registration (enforced in `src/app/actions/auth.ts`).
- **Caching**: Next.js App Router aggressively caches data. To prevent bugs where new tests or updates don't show up on the dashboard, always include `export const dynamic = 'force-dynamic';` and `export const revalidate = 0;` on pages that list dynamic database rows (like `/dashboard/page.tsx` and `/dashboard/tests/page.tsx`).
- **Media Uploads**: Vercel has a read-only filesystem (`EROFS` error). All image uploads for questions are converted to Base64 strings and stored directly in the PostgreSQL database instead of saving files to the `/public` directory.

## 5. Roles
- `STUDENT`: Takes tests. Default status upon registration is `PENDING` (must be approved by an Admin).
- `ADMIN`: Creates tests, approves users, views analysis, and live-monitors active tests.

Please adhere to these guidelines to ensure the stability and security of ExamPortal.

# ExamPortal Handoff Document

## Project Status
The ExamPortal project has been updated with several admin and student-facing features, but currently requires manual database provisioning to work fully on Vercel.

## Known Constraints & Required Actions
- **Vercel Database Constraint**: Vercel serverless functions cannot write to the local SQLite database. The Prisma schema has been migrated to `postgresql`. 
  - **Action Required**: The user must provision a PostgreSQL database (e.g., via Neon, Supabase, or Vercel Postgres) and set the `DATABASE_URL` environment variable in Vercel to make the app fully functional online.

## Recent Features
- **Admin Actions**: Implemented UI refreshing for Make Admin and Delete actions.
- **Batch Management**: Added unique constraint handling for batches and a dedicated page to manage students within specific batches.
- **Modular Reports**: The reports dashboard is now divided into Test-wise, Batch-wise, and Student-wise tabs for administrators.
- **Registration**: Added dynamic batch selection for students and a toggle for "Register as Admin" which sets the role and enforces a `PENDING` status.
- **Test Tabs UI**: Enhanced active tab visual states for improved UX.

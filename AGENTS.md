<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ExamPortal Specific Rules

- **Database Constraint (Vercel)**: The local SQLite database `dev.db` is strictly read-only on Vercel. All deployments must use a remote PostgreSQL database. Ensure `DATABASE_URL` is set to the remote Postgres DB URI.
- **Roles**: Registration allows for both `STUDENT` and `ADMIN` roles, but both default to `status: 'PENDING'` and require manual approval.

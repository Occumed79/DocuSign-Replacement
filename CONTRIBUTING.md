# Contributing to PacketPath

We welcome contributions to PacketPath! This document outlines the process for contributing to the project.

## Development Workflow

1. **Branching Strategy:**
   - `main`: The primary branch for production-ready code.
   - `feature/*`: For new features.
   - `bugfix/*`: For bug fixes.

2. **Pull Requests:**
   - All changes must be submitted via Pull Requests.
   - PRs require at least one approval from a maintainer before merging.
   - CI tests must pass before a PR can be merged.

## Coding Standards

- **TypeScript:** Use TypeScript for all new code. Ensure strict type checking is enabled.
- **Formatting:** Code formatting is handled by Prettier. Run `pnpm format` before committing.
- **Linting:** We use ESLint. Ensure your code passes `pnpm lint`.
- **Testing:** All new features must include unit tests. Run `pnpm test` to ensure no regressions.

## Security Guidelines

- Never commit secrets, API keys, or database credentials.
- Ensure all endpoints accessing Protected Health Information (PHI) are protected by the `phiLogger` middleware.
- Always use `bcrypt` for password hashing.
- Maintain Helmet and Express Rate Limit configurations for all new routes.

## Database Migrations

If your feature requires database schema changes:
1. Update the schema in `lib/db/src/schema/`.
2. Generate a new migration using `pnpm run db:generate`.
3. Test the migration locally with `pnpm run db:push`.
4. Commit both the schema changes and the generated migration files.

Thank you for contributing to PacketPath!

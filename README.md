# HireFlow AI

Next-gen AI job search and application copilot with ATS resume tailoring, assisted auto-apply, recruiter outreach, and mock interview coaching.

## Features

- **Live job search** across Greenhouse, Lever, and Ashby company boards
- **Resume AI** for parsing, ATS scoring, and JD-tailored bullet rewriting
- **Assisted apply** with AI cover letters, screening answers, bookmarklet autofill, and Playwright script export
- **Ready to Submit** pipeline so materials are prepared before you confirm a real portal submission
- **Autopilot batch agent** that queues high-match roles with tailored packets
- **Kanban tracker**, outreach studio, mock interviews, and conversion analytics
- **Firebase Auth + Firestore** sync for signed-in users, with localStorage guest mode

## Quick start

```bash
bun install
cp .env.example .env   # set GEMINI_API_KEY
bun run dev            # http://localhost:3000
```

### Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Express + Vite middleware (API + SPA) |
| `bun run build` | Production client + server bundle |
| `bun run start` | Run production server from `dist/` |
| `bun run lint` | TypeScript check (`tsc --noEmit`) |

## Environment

Copy `.env.example` and set:

- `GEMINI_API_KEY` — required for AI features (heuristic fallbacks still work without it)
- `APP_URL` — optional public app URL

Firebase config lives in `firebase-applet-config.json`. Firestore rules are in `firestore.rules`.

## Architecture

- `server.ts` — Express API, Gemini generation, job board aggregation, Playwright script generation
- `server/jobSources.ts` / `server/companyBoards.ts` — real ATS board fetchers
- `src/` — React 19 UI (dashboard, jobs, resume, autopilot, tracker, outreach, interview, analytics)
- `src/services/firestoreService.ts` — realtime Firestore sync

## Application statuses

`saved` → `ready_to_submit` → `applied` → `screening` → `interviewing` → `offer` / `rejected`

Autopilot and Assisted Apply prepare materials as **Ready to Submit**. Confirm only after you submit on the employer portal.

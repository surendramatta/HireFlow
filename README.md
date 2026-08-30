# HireFlow
### Prepare better applications. Keep submission status honest.

[![CI](https://github.com/surendramatta/HireFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/surendramatta/HireFlow/actions/workflows/ci.yml)

A React and Firebase job-search workspace for matching roles, preparing resumes and cover letters, organizing applications, and practicing interviews.

## Explore the workspace

| Screen | Purpose |
| --- | --- |
| Job search | Discover and import roles, inspect requirements and match signals |
| Resume builder | Organize candidate experience and prepare tailored material |
| Application preparation | Generate batches of drafts for human review |
| Tracker | Move applications through a visible pipeline |
| Outreach and interviews | Draft messages and practice questions |
| Analytics | Review application activity and outcomes |

**Preparation does not equal submission.** Batch-generated materials are saved as `ready_to_submit`; they do not increase the submitted counter. Employer submission still requires a person or an independently verified external workflow.

## Stack

React 19 · TypeScript 7 · Vite 8 · Express 4 · Firebase Auth/Firestore · Tailwind CSS · optional Gemini

Major screens load on demand. Authentication and persistent data require your own Firebase project; the repository does not ship another developer's Firebase connection.

## Run locally

Node.js 22.12+ and npm are required.

```bash
git clone https://github.com/surendramatta/HireFlow.git
cd HireFlow
npm ci
cp .env.example .env.local
npm run dev
```

1. Create a Firebase web app and copy its public web configuration into the `VITE_FIREBASE_*` variables.
2. Enable the Firebase sign-in methods you intend to use and configure authorized domains.
3. Create Firestore and review/deploy [firestore.rules](firestore.rules) to your project. Rules in this repository are not automatically deployed.
4. Optionally set server-only `GEMINI_API_KEY` for AI generation. Restart after changing configuration.

Without Firebase configuration, the app displays setup instructions instead of initializing an invalid connection. Vite variables are public in the browser bundle; **never put private AI keys or service-account credentials in a VITE_ variable**.

## Build and verify

```bash
npm run check
python .github/scripts/check-secrets.py
# After a successful build:
NODE_ENV=production npm start
```

The server binds to localhost by default. `HOST` and `PORT` are configurable.

CI runs submission-policy tests, type checking, a production build, dependency auditing and common-credential-pattern scanning. Use the npm lockfile for this supported workflow; the historical Bun lockfile is not the CI source of truth.

## Boundaries and next steps

- The Express AI endpoints still need server-side authorization and rate limiting before public hosting. Firebase client login alone does not protect these endpoints.
- Firebase rules currently allow signed-in users to modify shared job listings; review that trust model before inviting untrusted users.
- Generated browser scripts and bookmarklets are assistance tools, not verified employer integrations.
- Provider quotas, Firebase configuration and real sign-in/submission flows must be tested in your environment.
- AI output can be wrong. Verify names, dates, experience, eligibility answers and every claim before using it.

See [SECURITY.md](SECURITY.md). A Firebase web API key is public configuration, not a service-account secret; provider restrictions and database rules remain important even after moving configuration out of Git.

## More from Surendra

[Kite](https://github.com/surendramatta/kite-job-agent) · [JobFlow](https://github.com/surendramatta/jobflow)

A prepared [GitHub profile README](docs/GITHUB_PROFILE_README.md) is included for the profile repository.

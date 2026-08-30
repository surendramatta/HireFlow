import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { firebaseConfigured } from './lib/firebase-config';
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";

const App = lazy(() => import('./App.tsx'));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {firebaseConfigured ? <Suspense fallback={<p>Loading HireFlow…</p>}><App /></Suspense> : (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
          <section className="max-w-lg space-y-4">
            <h1 className="text-3xl font-bold">Welcome to HireFlow</h1>
            <p>Configure your own Firebase project to start. Copy .env.example to .env.local, fill in the VITE_FIREBASE fields, and restart the app.</p>
            <p>AI credentials belong on the server. Never put Gemini keys or service-account credentials in VITE_ variables.</p>
          </section>
        </main>
      )}
    </ErrorBoundary>
  </StrictMode>
);

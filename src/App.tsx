import React, { lazy, Suspense, useState, useEffect } from "react";
import { TabType, CandidateProfile, JobListing, ApplicationRecord, AutoApplyConfig, AutoApplyLog } from "./types";
import { initialProfile, initialAutoApplyConfig } from "./data/mockData";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { postJson } from "./lib/apiClient";
import { applicationStatus, submissionIncrement } from './lib/application-policy';
import { 
  subscribeToJobs, 
  subscribeToApplications, 
  subscribeToSavedJobs, 
  subscribeToAutoApplyLogs, 
  subscribeToAutoApplyConfig, 
  saveApplicationToDb, 
  updateApplicationStatusInDb, 
  deleteApplicationFromDb, 
  toggleSaveJobInDb, 
  addAutoApplyLogToDb, 
  updateAutoApplyConfigInDb, 
  addCustomJobToDb 
} from "./services/firestoreService";

import { Navbar } from "./components/Navbar";
const Dashboard = lazy(() => import("./components/Dashboard").then((module) => ({ default: module.Dashboard })));
const JobSearch = lazy(() => import("./components/JobSearch").then((module) => ({ default: module.JobSearch })));
const ResumeBuilder = lazy(() => import("./components/ResumeBuilder").then((module) => ({ default: module.ResumeBuilder })));
const AutoApplyAgent = lazy(() => import("./components/AutoApplyAgent").then((module) => ({ default: module.AutoApplyAgent })));
const KanbanBoard = lazy(() => import("./components/KanbanBoard").then((module) => ({ default: module.KanbanBoard })));
const OutreachStudio = lazy(() => import("./components/OutreachStudio").then((module) => ({ default: module.OutreachStudio })));
const InterviewPrep = lazy(() => import("./components/InterviewPrep").then((module) => ({ default: module.InterviewPrep })));
const AnalyticsView = lazy(() => import("./components/AnalyticsView").then((module) => ({ default: module.AnalyticsView })));
const AssistedApplyModal = lazy(() => import("./components/AssistedApplyModal").then((module) => ({ default: module.AssistedApplyModal })));

const LOCAL_STORAGE_APPS_KEY = "hireflow_guest_applications";
const LOCAL_STORAGE_LOGS_KEY = "hireflow_guest_logs";
const LOCAL_STORAGE_CFG_KEY = "hireflow_guest_config";

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

function MainAppContent() {
  const { user, profile, loading, updateProfileInDb } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [autoApplyConfig, setAutoApplyConfig] = useState<AutoApplyConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CFG_KEY);
      return saved ? JSON.parse(saved) : initialAutoApplyConfig;
    } catch {
      return initialAutoApplyConfig;
    }
  });
  const [logs, setLogs] = useState<AutoApplyLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [assistedApplyJob, setAssistedApplyJob] = useState<JobListing | null>(null);
  const [isSearchingJobs, setIsSearchingJobs] = useState<boolean>(false);

  // 1. Quota Reset Check (Resets appliedToday on new day)
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (autoApplyConfig.lastResetDate !== todayStr) {
      const resetConfig: AutoApplyConfig = {
        ...autoApplyConfig,
        appliedToday: 0,
        lastResetDate: todayStr,
      };
      setAutoApplyConfig(resetConfig);
      if (user) {
        updateAutoApplyConfigInDb(user.uid, resetConfig);
      } else {
        try {
          localStorage.setItem(LOCAL_STORAGE_CFG_KEY, JSON.stringify(resetConfig));
        } catch {}
      }
    }
  }, [user, autoApplyConfig.lastResetDate]);

  // 2. Subscribe to Jobs & Auto-fetch Real Jobs from Greenhouse/Lever/Ashby if DB is empty
  useEffect(() => {
    let initialSearchAttempted = false;

    const unsubscribe = subscribeToJobs(async (liveJobs) => {
      setJobs(liveJobs);

      if (liveJobs.length === 0 && !initialSearchAttempted) {
        initialSearchAttempted = true;
        setIsSearchingJobs(true);
        try {
          const res = await postJson<{ jobs: JobListing[] }>("/api/jobs/search", {
            query: profile.targetTitles?.[0] || "Software Engineer",
            location: profile.preferredLocation || "Remote",
          });
          if (res.jobs && res.jobs.length > 0) {
            for (const j of res.jobs.slice(0, 15)) {
              await addCustomJobToDb(j);
            }
          }
        } catch (err) {
          console.error("Initial real job board search notice:", err);
        } finally {
          setIsSearchingJobs(false);
        }
      }
    });

    return () => unsubscribe();
  }, [profile.targetTitles, profile.preferredLocation]);

  // 3. Subscribe to Realtime Applications & Migrate Local Guest Applications when logging in
  useEffect(() => {
    if (!user) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
        if (saved) setApplications(JSON.parse(saved));
      } catch {}
      return;
    }

    const unsubscribe = subscribeToApplications(user.uid, async (liveApps) => {
      // Migrate guest applications if any exist in local storage
      const guestAppsStr = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
      if (guestAppsStr) {
        try {
          const guestApps: ApplicationRecord[] = JSON.parse(guestAppsStr);
          if (Array.isArray(guestApps) && guestApps.length > 0) {
            for (const app of guestApps) {
              await saveApplicationToDb(user.uid, app);
            }
            localStorage.removeItem(LOCAL_STORAGE_APPS_KEY);
          }
        } catch {}
      }
      setApplications(liveApps);
    });

    return () => unsubscribe();
  }, [user]);

  // 4. Subscribe to Saved Jobs
  useEffect(() => {
    const unsubscribe = subscribeToSavedJobs(user ? user.uid : null, (liveSavedIds) => {
      setSavedJobIds(liveSavedIds);
    });
    return () => unsubscribe();
  }, [user]);

  // 5. Subscribe to Logs
  useEffect(() => {
    if (!user) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
        if (saved) setLogs(JSON.parse(saved));
      } catch {}
      return;
    }

    const unsubscribe = subscribeToAutoApplyLogs(user.uid, (liveLogs) => {
      setLogs(liveLogs);
    });
    return () => unsubscribe();
  }, [user]);

  // 6. Subscribe to Auto-Apply Config
  useEffect(() => {
    if (!user) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_CFG_KEY);
        if (saved) setAutoApplyConfig(JSON.parse(saved));
      } catch {}
      return;
    }

    const unsubscribe = subscribeToAutoApplyConfig(user.uid, (liveConfig) => {
      setAutoApplyConfig(liveConfig);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleAutopilot = async () => {
    const newStatus = !autoApplyConfig.enabled;
    const updated = { ...autoApplyConfig, enabled: newStatus };
    setAutoApplyConfig(updated);
    if (user) {
      await updateAutoApplyConfigInDb(user.uid, { enabled: newStatus });
    } else {
      try {
        localStorage.setItem(LOCAL_STORAGE_CFG_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  // Open Assisted Apply Flow Modal
  const handleOpenAssistedApply = (job: JobListing) => {
    setAssistedApplyJob(job);
  };

  // Handle Confirmed Submission from Assisted Apply Modal
  const handleConfirmSubmittedApplication = async (
    job: JobListing, 
    coverLetter: string, 
    screeningAnswers?: Record<string, string>,
    confirmed = true
  ) => {
    const todayStr = new Date().toISOString().split("T")[0];

    const newRecord: ApplicationRecord = {
      id: `app-${job.id}-${Date.now()}`,
      jobId: job.id,
      title: job.title,
      company: job.company,
      logoUrl: job.logoUrl || "",
      location: job.location,
      salaryRange: job.salaryRange,
      platform: job.platform,
      status: applicationStatus(confirmed),
      appliedDate: confirmed ? todayStr : '',
      lastUpdated: todayStr,
      matchScoreAtApply: job.matchScore,
      coverLetterUsed: coverLetter,
      screeningAnswers: screeningAnswers,
    };

    const newLog: AutoApplyLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      company: job.company,
      role: job.title,
      status: "success",
      matchScore: job.matchScore,
      message: confirmed ? `User confirmed submission on ${job.platform}.` : 'Materials prepared. Review and submit on the employer portal; no application has been sent.',
    };

    if (user) {
      await saveApplicationToDb(user.uid, newRecord);
      await addAutoApplyLogToDb(user.uid, newLog);

      const updatedConfig = {
        ...autoApplyConfig,
        appliedToday: autoApplyConfig.appliedToday + submissionIncrement(confirmed),
      };
      await updateAutoApplyConfigInDb(user.uid, updatedConfig);
    } else {
      setApplications((prev) => {
        const updated = [newRecord, ...prev.filter((a) => a.jobId !== job.id)];
        try { localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });

      setLogs((prev) => {
        const updated = [newLog, ...prev];
        try { localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });

      setAutoApplyConfig((prev) => {
        const updated = { ...prev, appliedToday: prev.appliedToday + submissionIncrement(confirmed) };
        try { localStorage.setItem(LOCAL_STORAGE_CFG_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  };

  const handleSaveJob = async (job: JobListing) => {
    const currentlySaved = savedJobIds.includes(job.id);
    if (user) {
      await toggleSaveJobInDb(user.uid, job.id, currentlySaved);
    } else {
      const updatedSaved = currentlySaved
        ? savedJobIds.filter((id) => id !== job.id)
        : [...savedJobIds, job.id];
      setSavedJobIds(updatedSaved);
    }
  };

  const handleUpdateApplicationStatus = async (
    appId: string, 
    newStatus: ApplicationRecord["status"], 
    extras?: Partial<ApplicationRecord>
  ) => {
    if (user) {
      await updateApplicationStatusInDb(user.uid, appId, newStatus, extras);
    } else {
      setApplications((prev) => {
        const updated = prev.map((a) =>
          a.id === appId
            ? { ...a, status: newStatus, lastUpdated: new Date().toISOString().split("T")[0], ...extras }
            : a
        );
        try { localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (user) {
      await deleteApplicationFromDb(user.uid, appId);
    } else {
      setApplications((prev) => {
        const updated = prev.filter((a) => a.id !== appId);
        try { localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  };

  const handleAddCustomJob = async (newJobData: Omit<JobListing, "id">) => {
    const newId = await addCustomJobToDb(newJobData);
    return newId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-300">Loading Application Assistant...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        autoApplyConfig={autoApplyConfig}
        toggleAutopilot={toggleAutopilot}
        totalApplications={applications.length}
        candidateName={profile.fullName}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="py-16 text-center text-slate-400">Loading workspace…</div>}>
        {activeTab === "dashboard" && (
          <Dashboard
            jobs={jobs}
            applications={applications}
            autoApplyConfig={autoApplyConfig}
            profile={profile}
            toggleAutopilot={toggleAutopilot}
            setActiveTab={setActiveTab}
            setSelectedJob={(j) => {
              setSelectedJob(j);
              setActiveTab("jobs");
            }}
          />
        )}

        {activeTab === "jobs" && (
          <JobSearch
            jobs={jobs}
            profile={profile}
            applications={applications}
            onApplyJob={handleOpenAssistedApply}
            onSaveJob={handleSaveJob}
            onAddCustomJob={handleAddCustomJob}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            setActiveTab={setActiveTab}
            isSearchingJobs={isSearchingJobs}
            setIsSearchingJobs={setIsSearchingJobs}
            setJobs={setJobs}
          />
        )}

        {activeTab === "resume" && (
          <ResumeBuilder 
            profile={profile} 
            setProfile={(p) => {
              if (typeof p === "function") {
                const updated = p(profile);
                updateProfileInDb(updated);
              } else {
                updateProfileInDb(p);
              }
            }} 
          />
        )}

        {activeTab === "autoapply" && (
          <AutoApplyAgent
            autoApplyConfig={autoApplyConfig}
            setAutoApplyConfig={(cfg) => {
              if (typeof cfg === "function") {
                const updated = cfg(autoApplyConfig);
                setAutoApplyConfig(updated);
                if (user) updateAutoApplyConfigInDb(user.uid, updated);
                else { try { localStorage.setItem(LOCAL_STORAGE_CFG_KEY, JSON.stringify(updated)); } catch {} }
              } else {
                setAutoApplyConfig(cfg);
                if (user) updateAutoApplyConfigInDb(user.uid, cfg);
                else { try { localStorage.setItem(LOCAL_STORAGE_CFG_KEY, JSON.stringify(cfg)); } catch {} }
              }
            }}
            logs={logs}
            setLogs={setLogs}
            jobs={jobs}
            applications={applications}
            profile={profile}
            onApplyJob={async (job, coverLetter, screeningAnswers) => {
              await handleConfirmSubmittedApplication(job, coverLetter || "", screeningAnswers, false);
            }}
            toggleAutopilot={toggleAutopilot}
          />
        )}

        {activeTab === "tracker" && (
          <KanbanBoard
            applications={applications}
            setApplications={setApplications}
            onUpdateStatus={handleUpdateApplicationStatus}
            onDeleteApplication={handleDeleteApplication}
            onOpenOutreachForApp={(_app) => {
              setActiveTab("outreach");
            }}
          />
        )}

        {activeTab === "outreach" && (
          <OutreachStudio profile={profile} />
        )}

        {activeTab === "interview" && (
          <InterviewPrep profile={profile} />
        )}

        {activeTab === "analytics" && (
          <AnalyticsView applications={applications} jobs={jobs} />
        )}
        </Suspense>
      </main>

      {/* Assisted Apply Confirmation Modal */}
      {assistedApplyJob && (
        <Suspense fallback={null}>
          <AssistedApplyModal
            job={assistedApplyJob}
            profile={profile}
            onClose={() => setAssistedApplyJob(null)}
            onConfirmSubmitted={handleConfirmSubmittedApplication}
          />
        </Suspense>
      )}
    </div>
  );
}

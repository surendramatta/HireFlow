import React, { useState, useEffect } from "react";
import { TabType, JobListing, ApplicationRecord, AutoApplyConfig, AutoApplyLog } from "./types";
import { initialAutoApplyConfig } from "./data/mockData";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { postJson } from "./lib/apiClient";
import { enrichJobWithMatch, withJobDefaults } from "./lib/jobMatching";
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
import { Dashboard } from "./components/Dashboard";
import { JobSearch } from "./components/JobSearch";
import { ResumeBuilder } from "./components/ResumeBuilder";
import { AutoApplyAgent } from "./components/AutoApplyAgent";
import { KanbanBoard } from "./components/KanbanBoard";
import { OutreachStudio } from "./components/OutreachStudio";
import { InterviewPrep } from "./components/InterviewPrep";
import { AnalyticsView } from "./components/AnalyticsView";
import { AssistedApplyModal } from "./components/AssistedApplyModal";
import { AlertCircle, Sparkles } from "lucide-react";

const LOCAL_STORAGE_APPS_KEY = "hireflow_guest_applications";
const LOCAL_STORAGE_LOGS_KEY = "hireflow_guest_logs";
const LOCAL_STORAGE_CFG_KEY = "hireflow_guest_config";
const LOCAL_STORAGE_SAVED_KEY = "hireflow_guest_saved_jobs";

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
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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
  const [outreachPrefill, setOutreachPrefill] = useState<{ company?: string; jobTitle?: string; contactName?: string } | null>(null);

  const needsOnboarding =
    !profile.fullName?.trim() ||
    !(profile.skills && profile.skills.length > 0) ||
    !profile.resumeText?.trim();

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
            remoteOnly: profile.remoteOnly ?? true,
            targetSkills: profile.skills || [],
          });
          if (res.jobs && res.jobs.length > 0) {
            for (const j of res.jobs.slice(0, 15)) {
              const { id: _ignored, ...jobPayload } = j;
              await addCustomJobToDb(
                withJobDefaults({
                  ...jobPayload,
                  ...enrichJobWithMatch(jobPayload, profile),
                })
              );
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
  }, [profile.targetTitles, profile.preferredLocation, profile.skills, profile.remoteOnly]);

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

  // 4. Subscribe to Saved Jobs (Firestore for signed-in, localStorage for guests)
  useEffect(() => {
    if (!user) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
        if (saved) setSavedJobIds(JSON.parse(saved));
      } catch {}
      return;
    }

    const unsubscribe = subscribeToSavedJobs(user.uid, (liveSavedIds) => {
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

  // Create or update an application record with a given status
  const upsertApplicationRecord = async (
    job: JobListing,
    coverLetter: string,
    status: ApplicationRecord["status"],
    screeningAnswers?: Record<string, string>,
    logMessage?: string,
    logStatus: AutoApplyLog["status"] = "success"
  ) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const matchMeta = enrichJobWithMatch(job, profile);

    const newRecord: ApplicationRecord = {
      // One record per job — reopen/confirm updates the same tracker card
      id: `app-${job.id}`,
      jobId: job.id,
      title: job.title,
      company: job.company,
      logoUrl: job.logoUrl || "",
      location: job.location,
      salaryRange: job.salaryRange,
      platform: job.platform,
      status,
      appliedDate: todayStr,
      lastUpdated: todayStr,
      matchScoreAtApply: job.matchScore || matchMeta.matchScore,
      coverLetterUsed: coverLetter,
      screeningAnswers: screeningAnswers,
    };

    const newLog: AutoApplyLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      company: job.company,
      role: job.title,
      status: logStatus,
      matchScore: newRecord.matchScoreAtApply,
      message: logMessage || `Status set to ${status} for ${job.company}.`,
    };

    if (user) {
      await saveApplicationToDb(user.uid, newRecord);
      await addAutoApplyLogToDb(user.uid, newLog);

      if (status === "applied") {
        const updatedConfig = {
          ...autoApplyConfig,
          appliedToday: autoApplyConfig.appliedToday + 1,
        };
        await updateAutoApplyConfigInDb(user.uid, updatedConfig);
      }
    } else {
      setApplications((prev) => {
        const updated = [newRecord, ...prev.filter((a) => a.jobId !== job.id)];
        try {
          localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setLogs((prev) => {
        const updated = [newLog, ...prev];
        try {
          localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (status === "applied") {
        setAutoApplyConfig((prev) => {
          const updated = { ...prev, appliedToday: prev.appliedToday + 1 };
          try {
            localStorage.setItem(LOCAL_STORAGE_CFG_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    }
  };

  // Handle Confirmed Submission from Assisted Apply Modal
  const handleConfirmSubmittedApplication = async (
    job: JobListing,
    coverLetter: string,
    screeningAnswers?: Record<string, string>
  ) => {
    await upsertApplicationRecord(
      job,
      coverLetter,
      "applied",
      screeningAnswers,
      `Submitted on ${job.platform} portal. Recorded in tracking dashboard.`
    );
  };

  // Save prepared materials without claiming a portal submission
  const handleSaveReadyToSubmit = async (
    job: JobListing,
    coverLetter: string,
    screeningAnswers?: Record<string, string>
  ) => {
    await upsertApplicationRecord(
      job,
      coverLetter,
      "ready_to_submit",
      screeningAnswers,
      `Materials prepared for ${job.platform}. Ready for portal submission.`,
      "pending"
    );
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
      try {
        localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updatedSaved));
      } catch {}
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
    const enriched = {
      ...withJobDefaults(newJobData),
      ...enrichJobWithMatch(newJobData, profile),
    };
    const newId = await addCustomJobToDb(enriched);
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
        {needsOnboarding && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-200">Finish setting up your candidate profile</p>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Add your name, skills, and resume so match scores, cover letters, and autopilot can tailor applications accurately.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("resume")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Complete Resume AI Setup
            </button>
          </div>
        )}

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
              // Batch autopilot prepares materials as ready_to_submit (honest flow)
              await handleSaveReadyToSubmit(job, coverLetter || "", screeningAnswers);
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
            onOpenOutreachForApp={(app) => {
              setOutreachPrefill({
                company: app.company,
                jobTitle: app.title,
                contactName: app.contactName,
              });
              setActiveTab("outreach");
            }}
          />
        )}

        {activeTab === "outreach" && (
          <OutreachStudio profile={profile} prefill={outreachPrefill || undefined} />
        )}

        {activeTab === "interview" && (
          <InterviewPrep profile={profile} />
        )}

        {activeTab === "analytics" && (
          <AnalyticsView applications={applications} jobs={jobs} />
        )}
      </main>

      {/* Assisted Apply Confirmation Modal */}
      {assistedApplyJob && (
        <AssistedApplyModal
          job={assistedApplyJob}
          profile={profile}
          onClose={() => setAssistedApplyJob(null)}
          onConfirmSubmitted={handleConfirmSubmittedApplication}
          onSaveReadyToSubmit={handleSaveReadyToSubmit}
        />
      )}
    </div>
  );
}

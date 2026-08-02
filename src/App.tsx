import React, { useState, useEffect } from "react";
import { TabType, CandidateProfile, JobListing, ApplicationRecord, AutoApplyConfig, AutoApplyLog } from "./types";
import { initialProfile, initialJobs, initialApplications, initialAutoApplyConfig } from "./data/mockData";
import { AuthProvider, useAuth } from "./context/AuthContext";
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

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

function MainAppContent() {
  const { user, profile, updateProfileInDb } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [jobs, setJobs] = useState<JobListing[]>(initialJobs);
  const [applications, setApplications] = useState<ApplicationRecord[]>(initialApplications);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [autoApplyConfig, setAutoApplyConfig] = useState<AutoApplyConfig>(initialAutoApplyConfig);
  const [logs, setLogs] = useState<AutoApplyLog[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  // 1. Subscribe to Realtime Jobs & Auto-Seed Real Web Jobs if database empty
  useEffect(() => {
    let isInitialFetchDone = false;

    const unsubscribe = subscribeToJobs(async (liveJobs) => {
      setJobs(liveJobs);

      // If database has 0 jobs and we haven't triggered auto-search yet, fetch real live jobs from Web API
      if (liveJobs.length === 0 && !isInitialFetchDone) {
        isInitialFetchDone = true;
        try {
          const defaultQuery = (profile.targetTitles && profile.targetTitles[0]) || "Software Engineer";
          const res = await fetch("/api/ai/search-real-jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: defaultQuery,
              location: profile.preferredLocation || "Remote",
              targetSkills: profile.skills || ["TypeScript", "React", "Node.js"],
            }),
          });
          if (res.ok) {
            const realJobs: JobListing[] = await res.json();
            if (Array.isArray(realJobs) && realJobs.length > 0) {
              for (const j of realJobs) {
                const { id, ...jobData } = j;
                await addCustomJobToDb(jobData);
              }
            }
          }
        } catch (err) {
          console.error("Auto-fetch real jobs notice:", err);
        }
      }
    });

    return () => unsubscribe();
  }, [profile.targetTitles, profile.preferredLocation, profile.skills]);

  // 2. Subscribe to Realtime User Applications
  useEffect(() => {
    const unsubscribe = subscribeToApplications(user ? user.uid : null, (liveApps) => {
      setApplications(liveApps);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Subscribe to Realtime Saved Jobs
  useEffect(() => {
    const unsubscribe = subscribeToSavedJobs(user ? user.uid : null, (liveSavedIds) => {
      setSavedJobIds(liveSavedIds);
    });
    return () => unsubscribe();
  }, [user]);

  // 4. Subscribe to Realtime Auto-Apply Logs
  useEffect(() => {
    const unsubscribe = subscribeToAutoApplyLogs(user ? user.uid : null, (liveLogs) => {
      setLogs(liveLogs);
    });
    return () => unsubscribe();
  }, [user]);

  // 5. Subscribe to Realtime Auto-Apply Config
  useEffect(() => {
    const unsubscribe = subscribeToAutoApplyConfig(user ? user.uid : null, (liveConfig) => {
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
    }
  };

  const handleApplyJob = async (job: JobListing, tailoredCoverLetter?: string) => {
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
      status: "applied",
      appliedDate: todayStr,
      lastUpdated: todayStr,
      matchScoreAtApply: job.matchScore,
      coverLetterUsed: tailoredCoverLetter || `Cover letter generated for ${job.company} - ${job.title}`,
    };

    // Save directly to Firestore if logged in
    if (user) {
      await saveApplicationToDb(user.uid, newRecord);

      // Add Auto-Apply log
      const newLog: AutoApplyLog = {
        id: `log-${Date.now()}`,
        timestamp: "Just now",
        company: job.company,
        role: job.title,
        status: "success",
        matchScore: job.matchScore,
        message: `Applied via ${job.platform}. Real-time record saved to Cloud DB.`,
      };
      await addAutoApplyLogToDb(user.uid, newLog);

      // Increment applied count
      const updatedConfig = {
        ...autoApplyConfig,
        appliedToday: autoApplyConfig.appliedToday + 1,
      };
      await updateAutoApplyConfigInDb(user.uid, updatedConfig);
    } else {
      // Local fallback for guest
      setApplications((prev) => [newRecord, ...prev.filter((a) => a.jobId !== job.id)]);
    }
  };

  const handleSaveJob = async (job: JobListing) => {
    const currentlySaved = savedJobIds.includes(job.id);
    if (user) {
      await toggleSaveJobInDb(user.uid, job.id, currentlySaved);
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      const newRecord: ApplicationRecord = {
        id: `app-saved-${job.id}`,
        jobId: job.id,
        title: job.title,
        company: job.company,
        logoUrl: job.logoUrl || "",
        location: job.location,
        salaryRange: job.salaryRange,
        platform: job.platform,
        status: "saved",
        appliedDate: todayStr,
        lastUpdated: todayStr,
        matchScoreAtApply: job.matchScore,
      };
      setApplications((prev) => [newRecord, ...prev]);
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
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, status: newStatus, lastUpdated: new Date().toISOString().split("T")[0], ...extras }
            : a
        )
      );
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (user) {
      await deleteApplicationFromDb(user.uid, appId);
    } else {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    }
  };

  const handleBatchAutoApply = async (count: number) => {
    const unappliedJobs = jobs.filter(
      (j) => !applications.some((a) => a.jobId === j.id && a.status !== "saved") && j.matchScore >= autoApplyConfig.minMatchScore
    );

    const jobsToApply = unappliedJobs.slice(0, count);

    for (const job of jobsToApply) {
      await handleApplyJob(job, `Automated bespoke application for ${job.company}.`);
    }
  };

  const handleAddCustomJob = async (newJobData: Omit<JobListing, "id">) => {
    const newId = await addCustomJobToDb(newJobData);
    return newId;
  };

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
            onApplyJob={handleApplyJob}
            onSaveJob={handleSaveJob}
            onAddCustomJob={handleAddCustomJob}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            setActiveTab={setActiveTab}
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
              } else {
                setAutoApplyConfig(cfg);
                if (user) updateAutoApplyConfigInDb(user.uid, cfg);
              }
            }}
            logs={logs}
            setLogs={setLogs}
            jobs={jobs}
            applications={applications}
            profile={profile}
            onApplyJob={handleApplyJob}
            onBatchAutoApply={handleBatchAutoApply}
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
      </main>
    </div>
  );
}

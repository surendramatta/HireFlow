import React from "react";
import { ApplicationRecord, JobListing } from "../types";
import { resolveApplyUrl } from "../lib/applyUrl";
import { ExternalLink, CheckCircle2, Inbox, Zap } from "lucide-react";

interface ReadyQueueProps {
  applications: ApplicationRecord[];
  jobs: JobListing[];
  onOpenApply: (job: JobListing) => void;
  onMarkApplied: (appId: string) => void;
  onSkip: (appId: string) => void;
}

export const ReadyQueue: React.FC<ReadyQueueProps> = ({
  applications,
  jobs,
  onOpenApply,
  onMarkApplied,
  onSkip,
}) => {
  const ready = (applications || []).filter((a) => a.status === "ready_to_submit");

  if (ready.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center space-y-2">
        <Inbox className="w-8 h-8 text-slate-500 mx-auto" />
        <h3 className="text-sm font-bold text-white">Ready-to-Submit queue is empty</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Use Find Jobs → Application Assistant, or Batch Prep, to stage tailored materials. Then open each portal, autofill, and confirm after you submit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          Ready to Submit ({ready.length})
        </h2>
        <span className="text-[11px] text-slate-500">Open → autofill → you submit → mark Applied</span>
      </div>
      <div className="space-y-2">
        {ready.map((app) => {
          const job =
            jobs.find((j) => j.id === app.jobId) ||
            ({
              id: app.jobId,
              title: app.title,
              company: app.company,
              logoUrl: app.logoUrl,
              location: app.location,
              isRemote: true,
              type: "Full-time" as const,
              salaryRange: app.salaryRange,
              minSalary: 0,
              postedDate: app.appliedDate,
              platform: app.platform,
              matchScore: app.matchScoreAtApply,
              skillsRequired: [],
              matchingSkills: [],
              missingSkills: [],
              description: "",
              requirements: [],
              benefits: [],
              companySize: "Unknown",
              applyUrl: "",
            } satisfies JobListing);

          const hasUrl = Boolean(resolveApplyUrl(job) || (app as any).applyUrl);

          return (
            <div
              key={app.id}
              className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-bold text-white">{app.title}</p>
                <p className="text-xs text-slate-400">
                  {app.company} · {app.platform} · {app.matchScoreAtApply}% match
                </p>
                {app.coverLetterUsed && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                    Cover letter ready · screening answers staged
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenApply(job)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open + Autofill
                </button>
                <button
                  type="button"
                  onClick={() => onMarkApplied(app.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Applied
                </button>
                <button
                  type="button"
                  onClick={() => onSkip(app.id)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Archive
                </button>
              </div>
              {!hasUrl && (
                <p className="text-[11px] text-amber-400 w-full sm:order-last">
                  Job listing may lack a live apply URL — re-search live boards if Open fails.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

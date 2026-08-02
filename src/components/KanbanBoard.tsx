import React, { useState } from "react";
import { ApplicationRecord, ApplicationStatus } from "../types";
import { 
  Kanban, 
  Plus, 
  Calendar, 
  Building2, 
  Mail, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Send, 
  MessageSquare, 
  MoreVertical,
  DollarSign,
  UserCheck
} from "lucide-react";

interface KanbanBoardProps {
  applications: ApplicationRecord[];
  setApplications: React.Dispatch<React.SetStateAction<ApplicationRecord[]>>;
  onUpdateStatus?: (appId: string, status: ApplicationStatus, extras?: Partial<ApplicationRecord>) => void;
  onDeleteApplication?: (appId: string) => void;
  onOpenOutreachForApp?: (app: ApplicationRecord) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  setApplications,
  onUpdateStatus,
  onDeleteApplication,
  onOpenOutreachForApp,
}) => {
  const [editingApp, setEditingApp] = useState<ApplicationRecord | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [interviewDateInput, setInterviewDateInput] = useState("");
  const [contactNameInput, setContactNameInput] = useState("");
  const [contactEmailInput, setContactEmailInput] = useState("");

  const columns: { id: ApplicationStatus; title: string; color: string }[] = [
    { id: "saved", title: "Saved / Draft", color: "border-slate-700 bg-slate-900/40 text-slate-300" },
    { id: "applied", title: "Applied", color: "border-indigo-500/40 bg-indigo-950/20 text-indigo-300" },
    { id: "screening", title: "Screening", color: "border-amber-500/40 bg-amber-950/20 text-amber-300" },
    { id: "interviewing", title: "Interviewing", color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300" },
    { id: "offer", title: "Offer", color: "border-cyan-500/40 bg-cyan-950/20 text-cyan-300" },
    { id: "rejected", title: "Archive", color: "border-rose-500/40 bg-rose-950/20 text-rose-300" },
  ];

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(appId, newStatus);
    } else {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, status: newStatus, lastUpdated: new Date().toISOString().split("T")[0] }
            : a
        )
      );
    }
  };

  const handleOpenEditModal = (app: ApplicationRecord) => {
    setEditingApp(app);
    setNotesInput(app.notes || "");
    setInterviewDateInput(app.interviewDate || "");
    setContactNameInput(app.contactName || "");
    setContactEmailInput(app.contactEmail || "");
  };

  const handleSaveModal = () => {
    if (!editingApp) return;

    const extras: Partial<ApplicationRecord> = {
      notes: notesInput,
      interviewDate: interviewDateInput || undefined,
      contactName: contactNameInput || undefined,
      contactEmail: contactEmailInput || undefined,
    };

    if (onUpdateStatus) {
      onUpdateStatus(editingApp.id, editingApp.status, extras);
    } else {
      setApplications((prev) =>
        prev.map((a) => (a.id === editingApp.id ? { ...a, ...extras } : a))
      );
    }

    setEditingApp(null);
  };

  const handleDelete = (appId: string) => {
    if (onDeleteApplication) {
      onDeleteApplication(appId);
    } else {
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    }
    setEditingApp(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Kanban className="w-5 h-5 text-indigo-400" />
            <span>Application Kanban Pipeline & Tracker</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track active job applications, interview schedules, recruiter contacts, and follow-up deadlines.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
          <span>Total Tracked:</span>
          <span className="text-white font-bold text-sm">{(applications || []).length}</span>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colApps = (applications || []).filter((a) => a.status === col.id);
          return (
            <div
              key={col.id}
              className={`rounded-2xl p-3 border space-y-3 min-w-[220px] ${col.color}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="font-extrabold text-xs tracking-tight">{col.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] font-bold text-slate-300">
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-3">
                {colApps.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    No apps in this stage
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 space-y-3 transition group shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-100 text-xs line-clamp-1 group-hover:text-indigo-300 transition">
                            {app.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium">{app.company}</p>
                        </div>

                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
                          {app.matchScoreAtApply}%
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 space-y-1">
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-0.5 text-slate-500" />
                          <span>{app.salaryRange}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-0.5 text-slate-500" />
                          <span>Applied: {app.appliedDate}</span>
                        </div>
                      </div>

                      {app.interviewDate && (
                        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center justify-between font-medium">
                          <span>Interview:</span>
                          <span className="font-mono">{new Date(app.interviewDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Quick Move Status Selector & Manage */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                          className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Archive</option>
                        </select>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(app)}
                            className="text-slate-400 hover:text-white transition"
                            title="Edit Notes & Schedule"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {onOpenOutreachForApp && (
                            <button
                              onClick={() => onOpenOutreachForApp(app)}
                              className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                              title="Generate Outreach Email"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Outreach</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Application Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{editingApp.title}</h3>
                <p className="text-xs text-indigo-400 font-medium">{editingApp.company} • {editingApp.platform}</p>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Interview Date & Time</label>
                <input
                  type="date"
                  value={interviewDateInput}
                  onChange={(e) => setInterviewDateInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Recruiter Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    value={contactNameInput}
                    onChange={(e) => setContactNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Recruiter Email</label>
                  <input
                    type="email"
                    placeholder="sarah@company.com"
                    value={contactEmailInput}
                    onChange={(e) => setContactEmailInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Notes & Interview Tips</label>
                <textarea
                  rows={3}
                  placeholder="Record interview notes, salary discussions, or key contacts..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDelete(editingApp.id)}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 transition"
              >
                Delete App
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

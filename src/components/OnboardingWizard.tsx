import React, { useState } from "react";
import { CandidateProfile } from "../types";
import { Sparkles, ArrowRight, Check, User, Briefcase, FileText } from "lucide-react";

interface OnboardingWizardProps {
  profile: CandidateProfile;
  onComplete: (updates: Partial<CandidateProfile>) => void | Promise<void>;
  onSkipToResume: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  profile,
  onComplete,
  onSkipToResume,
}) => {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [email, setEmail] = useState(profile.email || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [location, setLocation] = useState(profile.location || profile.preferredLocation || "");
  const [targetTitle, setTargetTitle] = useState(profile.targetTitles?.[0] || "Software Engineer");
  const [skillsStr, setSkillsStr] = useState((profile.skills || []).join(", "));
  const [remoteOnly, setRemoteOnly] = useState(profile.remoteOnly ?? true);
  const [workAuth, setWorkAuth] = useState(profile.screeningVault?.workAuthorization || "");
  const [sponsorship, setSponsorship] = useState(profile.screeningVault?.needsSponsorship || "No");
  const [expectedSalary, setExpectedSalary] = useState(profile.screeningVault?.expectedSalary || "");
  const [saving, setSaving] = useState(false);

  const steps = [
    { title: "Who you are", icon: <User className="w-4 h-4" /> },
    { title: "What you're targeting", icon: <Briefcase className="w-4 h-4" /> },
    { title: "Screening vault", icon: <FileText className="w-4 h-4" /> },
  ];

  const finish = async () => {
    setSaving(true);
    const skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await onComplete({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      location: location.trim(),
      preferredLocation: remoteOnly ? "Remote" : location.trim(),
      remoteOnly,
      targetTitles: targetTitle.trim() ? [targetTitle.trim()] : [],
      skills,
      screeningVault: {
        workAuthorization: workAuth,
        needsSponsorship: sponsorship,
        noticePeriod: profile.screeningVault?.noticePeriod || "",
        expectedSalary,
        relocate: profile.screeningVault?.relocate || false,
        primaryTechStack: skills.slice(0, 6).join(", "),
        bioSummary: profile.screeningVault?.bioSummary || "",
        customAnswers: profile.screeningVault?.customAnswers || {},
      },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950/50 to-slate-900">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> HireFlow setup
          </div>
          <h1 className="text-xl font-extrabold text-white">Get ready to apply in minutes</h1>
          <p className="text-xs text-slate-400 mt-1">
            We tailor cover letters and screening answers from this profile — then open the real ATS for you to submit.
          </p>
          <div className="flex gap-2 mt-4">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-indigo-500" : "bg-slate-800"}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            {steps[step].icon}
            Step {step + 1}: {steps[step].title}
          </p>
        </div>

        <div className="p-5 space-y-3 text-xs">
          {step === 0 && (
            <>
              <label className="block space-y-1">
                <span className="text-slate-400 font-medium">Full name *</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Alex Rivera"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-400 font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-slate-400 font-medium">Phone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-slate-400 font-medium">Location</span>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="SF / Remote"
                  />
                </label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <label className="block space-y-1">
                <span className="text-slate-400 font-medium">Target title *</span>
                <input
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Senior Frontend Engineer"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-400 font-medium">Top skills * (comma-separated)</span>
                <input
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="TypeScript, React, Node.js"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600"
                />
                <span className="text-slate-300">Prefer remote roles</span>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <label className="block space-y-1">
                <span className="text-slate-400 font-medium">Work authorization</span>
                <input
                  value={workAuth}
                  onChange={(e) => setWorkAuth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Authorized to work in the US"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-400 font-medium">Need sponsorship?</span>
                <select
                  value={sponsorship}
                  onChange={(e) => setSponsorship(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option>No</option>
                  <option>Yes</option>
                  <option>Maybe / discuss</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-slate-400 font-medium">Expected salary</span>
                <input
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="$160k – $190k"
                />
              </label>
              <p className="text-[11px] text-slate-500 pt-1">
                Next: upload a full resume in Resume AI anytime — setup unlocks live job search and batch prep now.
              </p>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2 bg-slate-950/60">
          <button
            type="button"
            onClick={onSkipToResume}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Skip → Resume AI
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
              >
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                disabled={step === 0 && !fullName.trim()}
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving || !fullName.trim() || !skillsStr.trim()}
                onClick={finish}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Start applying"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

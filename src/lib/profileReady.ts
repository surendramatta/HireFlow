import { CandidateProfile } from "../types";

export function isProfileReady(profile: CandidateProfile | null | undefined): boolean {
  if (!profile) return false;
  const hasName = Boolean(profile.fullName?.trim());
  const hasSkills = (profile.skills || []).length > 0;
  const hasResume = Boolean(profile.resumeText?.trim()) || (profile.experiences || []).length > 0;
  const hasTarget = (profile.targetTitles || []).length > 0;
  return hasName && hasSkills && (hasResume || hasTarget);
}

export function profileReadyGaps(profile: CandidateProfile | null | undefined): string[] {
  const gaps: string[] = [];
  if (!profile?.fullName?.trim()) gaps.push("Full name");
  if (!(profile?.skills || []).length) gaps.push("Skills");
  if (!profile?.resumeText?.trim() && !(profile?.experiences || []).length) gaps.push("Resume or experience");
  if (!(profile?.targetTitles || []).length) gaps.push("Target job titles");
  return gaps;
}

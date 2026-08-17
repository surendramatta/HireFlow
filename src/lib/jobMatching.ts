import { CandidateProfile, JobListing } from "../types";

/** Compute match score + skill overlap for a job against a candidate profile. */
export function enrichJobWithMatch(
  job: Omit<JobListing, "id"> & { id?: string },
  profile: Pick<CandidateProfile, "skills" | "resumeText" | "targetTitles">
): Pick<JobListing, "matchScore" | "matchingSkills" | "missingSkills"> {
  const candidateSkillsLower = new Set((profile.skills || []).map((s) => s.toLowerCase()));
  const resumeTextLower = (profile.resumeText || "").toLowerCase();
  const jobSkills = job.skillsRequired || [];

  const matchingSkills = jobSkills.filter((skill) => {
    const sLower = skill.toLowerCase();
    return candidateSkillsLower.has(sLower) || resumeTextLower.includes(sLower);
  });

  const missingSkills = jobSkills.filter((skill) => {
    const sLower = skill.toLowerCase();
    return !candidateSkillsLower.has(sLower) && !resumeTextLower.includes(sLower);
  });

  const totalRequired = jobSkills.length || 1;
  const skillRatio = matchingSkills.length / totalRequired;

  const jobTitleLower = (job.title || "").toLowerCase();
  const titleMatch = (profile.targetTitles || []).some((title) => {
    const keywords = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    return keywords.some((kw) => jobTitleLower.includes(kw));
  });

  let calculatedScore = Math.round(skillRatio * 65);
  if (titleMatch) calculatedScore += 20;
  if (matchingSkills.length > 0) calculatedScore += 15;
  // Don't fake a high floor when the profile barely overlaps
  const matchScore = Math.min(99, Math.max(matchingSkills.length || titleMatch ? 45 : 25, calculatedScore));

  return { matchScore, matchingSkills, missingSkills };
}

export function withJobDefaults<T extends Partial<JobListing>>(job: T): T & { companySize: string; logoUrl: string } {
  return {
    ...job,
    companySize: job.companySize || "Unknown",
    logoUrl: job.logoUrl || "",
  };
}

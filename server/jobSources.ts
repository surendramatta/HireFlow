import { CompanyBoard } from "./companyBoards";

export interface StandardJobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  type: string;
  salaryRange: string;
  minSalary: number;
  postedDate: string;
  platform: string;
  matchScore: number;
  skillsRequired: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  applyUrl: string;
}

// Clean HTML tags from job descriptions
function cleanHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Helper to extract common technical skills from text
export function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Express",
    "Python", "Go", "Java", "C++", "Ruby", "PostgreSQL", "MongoDB", "Redis",
    "GraphQL", "REST", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
    "Tailwind", "CSS", "HTML", "Git", "CI/CD", "Jest", "Playwright", "Cypress",
    "SQL", "NoSQL", "Kafka", "Elasticsearch", "Microservices", "System Design"
  ];
  
  const textUpper = text.toUpperCase();
  return commonSkills.filter(skill => {
    const pattern = new RegExp(`\\b${skill.replace(/\+/g, "\\+")}\\b`, "i");
    return pattern.test(textUpper);
  });
}

// 1. Greenhouse API
export async function fetchGreenhouse(board: CompanyBoard): Promise<StandardJobListing[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board.slug}/jobs?content=true`, {
      headers: { "User-Agent": "HireFlowAI-JobBoardFetcher/1.0" }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((job: any) => {
      const plainDesc = cleanHtml(job.content || "");
      const isRemote = (job.location?.name || "").toLowerCase().includes("remote") || plainDesc.toLowerCase().includes("remote");
      const skills = extractSkillsFromText(`${job.title} ${plainDesc}`);

      return {
        id: `greenhouse-${board.slug}-${job.id}`,
        title: job.title || "Software Engineer",
        company: board.name,
        location: job.location?.name || "Remote",
        isRemote,
        type: "Full-time",
        salaryRange: "", // Never invent salary
        minSalary: 0,
        postedDate: job.updated_at ? new Date(job.updated_at).toLocaleDateString() : "Recently",
        platform: "Greenhouse",
        matchScore: 0,
        skillsRequired: skills.length > 0 ? skills : ["TypeScript", "React", "Node.js"],
        description: plainDesc.slice(0, 1200) || `${job.title} position at ${board.name}.`,
        requirements: ["Experience with modern web software development", "Strong technical problem-solving abilities"],
        benefits: [],
        applyUrl: job.absolute_url // Real apply URL directly from Greenhouse
      };
    });
  } catch (err) {
    console.error(`Error fetching Greenhouse for ${board.slug}:`, err);
    return [];
  }
}

// 2. Lever API
export async function fetchLever(board: CompanyBoard): Promise<StandardJobListing[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${board.slug}?mode=json`, {
      headers: { "User-Agent": "HireFlowAI-JobBoardFetcher/1.0" }
    });
    if (!res.ok) return [];
    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    return jobs.map((job: any) => {
      const descriptionText = cleanHtml(job.descriptionPlain || job.description || "");
      const isRemote = (job.categories?.location || "").toLowerCase().includes("remote") || descriptionText.toLowerCase().includes("remote") || (job.workplaceType || "").toLowerCase() === "remote";
      const skills = extractSkillsFromText(`${job.text} ${descriptionText}`);

      return {
        id: `lever-${board.slug}-${job.id}`,
        title: job.text || "Software Engineer",
        company: board.name,
        location: job.categories?.location || "Remote",
        isRemote,
        type: job.categories?.commitment || "Full-time",
        salaryRange: "", // Never invent salary
        minSalary: 0,
        postedDate: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently",
        platform: "Lever",
        matchScore: 0,
        skillsRequired: skills.length > 0 ? skills : ["TypeScript", "React", "Node.js"],
        description: descriptionText.slice(0, 1200) || `${job.text} position at ${board.name}.`,
        requirements: ["Hands-on engineering experience in software systems", "Collaborative mindset"],
        benefits: [],
        applyUrl: job.hostedUrl || job.applyUrl // Real apply URL directly from Lever
      };
    });
  } catch (err) {
    console.error(`Error fetching Lever for ${board.slug}:`, err);
    return [];
  }
}

// 3. Ashby API
export async function fetchAshby(board: CompanyBoard): Promise<StandardJobListing[]> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${board.slug}`, {
      headers: { "User-Agent": "HireFlowAI-JobBoardFetcher/1.0" }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];
    if (!Array.isArray(jobs)) return [];

    return jobs.map((job: any) => {
      const desc = cleanHtml(job.descriptionHtml || "");
      const isRemote = job.isRemote || (job.location || "").toLowerCase().includes("remote") || desc.toLowerCase().includes("remote");
      const skills = extractSkillsFromText(`${job.title} ${desc}`);

      return {
        id: `ashby-${board.slug}-${job.id}`,
        title: job.title || "Software Engineer",
        company: board.name,
        location: job.location || "Remote",
        isRemote,
        type: job.employmentType || "Full-time",
        salaryRange: job.compensation ? `${job.compensation.currency || "$"} ${job.compensation.min || ""}` : "",
        minSalary: job.compensation?.min || 0,
        postedDate: job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : "Recently",
        platform: "Ashby",
        matchScore: 0,
        skillsRequired: skills.length > 0 ? skills : ["TypeScript", "React", "Node.js"],
        description: desc.slice(0, 1200) || `${job.title} position at ${board.name}.`,
        requirements: ["Proficiency in software engineering practices", "High ownership and initiative"],
        benefits: [],
        applyUrl: job.jobUrl // Real apply URL directly from Ashby
      };
    });
  } catch (err) {
    console.error(`Error fetching Ashby for ${board.slug}:`, err);
    return [];
  }
}

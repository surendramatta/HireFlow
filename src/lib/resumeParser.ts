import { CandidateProfile } from "../types";

const COMMON_SKILLS_DICTIONARY = [
  "TypeScript", "JavaScript", "React", "React Native", "Next.js", "Vue.js", "Angular",
  "Node.js", "Express", "Python", "Django", "Flask", "FastAPI", "Java", "Spring Boot",
  "C++", "C#", ".NET", "Go", "Golang", "Rust", "PHP", "Laravel", "Ruby", "Ruby on Rails",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB",
  "AWS", "Amazon Web Services", "GCP", "Google Cloud", "Azure", "Docker", "Kubernetes",
  "Terraform", "CI/CD", "GitHub Actions", "Git", "REST APIs", "GraphQL", "gRPC", "WebSockets",
  "Tailwind CSS", "CSS3", "HTML5", "Sass", "Redux", "Zustand", "MobX", "Jest", "Cypress",
  "Playwright", "Webpack", "Vite", "Microservices", "System Design", "Agile", "Scrum",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn",
  "Data Analysis", "Data Engineering", "Spark", "Hadoop", "Kafka", "Airflow", "Snowflake",
  "Product Management", "UI/UX Design", "Figma", "Jira", "Confluence", "Leadership", "DevOps"
];

const COMMON_TITLES = [
  "Senior Full Stack Engineer", "Full Stack Engineer", "Full Stack Developer",
  "Senior Frontend Engineer", "Frontend Engineer", "Frontend Developer",
  "Senior Backend Engineer", "Backend Engineer", "Backend Developer",
  "Software Engineer", "Senior Software Engineer", "Staff Software Engineer",
  "Principal Software Engineer", "Lead Software Engineer", "DevOps Engineer",
  "Cloud Architect", "Data Scientist", "Data Engineer", "Machine Learning Engineer",
  "AI Engineer", "Product Manager", "Engineering Manager", "Technical Lead",
  "QA Engineer", "Mobile Engineer", "iOS Developer", "Android Developer",
  "Solutions Architect", "Systems Engineer", "Security Engineer"
];

export interface ExtractedResumeData {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  targetTitles?: string[];
  skills?: string[];
  summary?: string;
}

export function extractInfoFromResumeText(text: string): ExtractedResumeData {
  if (!text || !text.trim()) return {};

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const result: ExtractedResumeData = {};

  // 1. Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    result.email = emailMatch[0].toLowerCase();
  }

  // 2. Extract Phone
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }

  // 3. Extract Full Name
  // Skip common resume section headers, contact lines, URLs
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    const isHeader = /resume|curriculum|cv|summary|objective|experience|skills|education|contact|profile|about/i.test(line);
    const hasEmailOrUrl = line.includes("@") || line.includes("http") || line.includes(".com") || line.includes(".dev") || line.includes(".org");
    const hasPhone = /\d{7,}/.test(line);

    if (!isHeader && !hasEmailOrUrl && !hasPhone) {
      // Clean name string
      const cleanLine = line.replace(/[^a-zA-Z\s.-]/g, "").trim();
      const wordCount = cleanLine.split(/\s+/).length;
      if (wordCount >= 2 && wordCount <= 4 && cleanLine.length >= 3 && cleanLine.length <= 40) {
        // Format to Title Case
        result.fullName = cleanLine
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
        break;
      }
    }
  }

  // 4. Extract Target Titles
  const detectedTitles: string[] = [];
  // Check against common titles in full text
  const lowerText = text.toLowerCase();
  for (const title of COMMON_TITLES) {
    if (lowerText.includes(title.toLowerCase())) {
      detectedTitles.push(title);
    }
  }

  // Check top 5 lines for a custom job title line
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (
      /engineer|developer|architect|lead|manager|analyst|specialist|consultant|designer/i.test(line) &&
      !line.includes("@") &&
      !line.includes("http") &&
      line.length < 60
    ) {
      if (!detectedTitles.includes(line)) {
        detectedTitles.unshift(line);
      }
    }
  }

  if (detectedTitles.length > 0) {
    result.targetTitles = Array.from(new Set(detectedTitles)).slice(0, 3);
  }

  // 5. Extract Skills
  const detectedSkills = new Set<string>();

  // Check dictionary skills
  for (const skill of COMMON_SKILLS_DICTIONARY) {
    // Regex boundary check for clean word matching
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
    if (regex.test(text)) {
      detectedSkills.add(skill);
    }
  }

  // Also parse explicitly listed skills section if present
  const skillsSectionRegex = /(?:TECHNICAL SKILLS|SKILLS|COMPETENCIES|TECHNOLOGIES|TOOLING)([\s\S]*?)(?:EXPERIENCE|WORK HISTORY|EDUCATION|PROJECTS|CERTIFICATIONS|$)/i;
  const skillsSectionMatch = text.match(skillsSectionRegex);
  if (skillsSectionMatch && skillsSectionMatch[1]) {
    const rawSection = skillsSectionMatch[1];
    const items = rawSection.split(/[,•|;\n]/).map((s) => s.trim()).filter((s) => s.length >= 2 && s.length <= 30);
    items.forEach((item) => {
      if (!/skills|experience|education|projects/i.test(item) && !/\d{4}/.test(item)) {
        // Capitalize nicely
        const formatted = item.charAt(0).toUpperCase() + item.slice(1);
        detectedSkills.add(formatted);
      }
    });
  }

  if (detectedSkills.size > 0) {
    result.skills = Array.from(detectedSkills);
  }

  // 6. Extract Location
  const locationMatch = text.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})\b/);
  if (locationMatch) {
    result.location = locationMatch[1];
  }

  return result;
}

export function updateCandidateProfileWithResume(
  currentProfile: CandidateProfile,
  rawResumeText: string,
  extraExtracted?: Partial<ExtractedResumeData>
): CandidateProfile {
  const extracted = extractInfoFromResumeText(rawResumeText);

  const newFullName = extraExtracted?.fullName || extracted.fullName || currentProfile.fullName;
  const newEmail = extraExtracted?.email || extracted.email || currentProfile.email;
  const newPhone = extraExtracted?.phone || extracted.phone || currentProfile.phone;
  const newLocation = extraExtracted?.location || extracted.location || currentProfile.location;

  const mergedSkills = Array.from(
    new Set([
      ...currentProfile.skills,
      ...(extracted.skills || []),
      ...(extraExtracted?.skills || [])
    ])
  ).filter(Boolean);

  const mergedTitles = Array.from(
    new Set([
      ...(extraExtracted?.targetTitles || []),
      ...(extracted.targetTitles || []),
      ...currentProfile.targetTitles
    ])
  ).filter(Boolean);

  return {
    ...currentProfile,
    fullName: newFullName && newFullName !== "Alex Rivera" ? newFullName : currentProfile.fullName,
    email: newEmail && newEmail !== "alex.rivera@example.com" ? newEmail : currentProfile.email,
    phone: newPhone || currentProfile.phone,
    location: newLocation || currentProfile.location,
    skills: mergedSkills.length > 0 ? mergedSkills : currentProfile.skills,
    targetTitles: mergedTitles.length > 0 ? mergedTitles : currentProfile.targetTitles,
    resumeText: rawResumeText,
    lastUpdated: new Date().toISOString().split("T")[0],
  };
}

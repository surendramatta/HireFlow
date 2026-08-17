import { AggregatorSource, CompanyBoard, COMPANY_BOARDS } from "./companyBoards";

export interface StandardJobListing {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  location: string;
  isRemote: boolean;
  type: string;
  salaryRange: string;
  minSalary: number;
  postedDate: string;
  platform: string;
  matchScore: number;
  skillsRequired: string[];
  matchingSkills?: string[];
  missingSkills?: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  companySize?: string;
  applyUrl: string;
}

const UA = { "User-Agent": "HireFlowAI-JobBoardFetcher/1.0" };

function cleanHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractSkillsFromText(text: string): string[] {
  const commonSkills = [
    "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Express",
    "Python", "Go", "Java", "C++", "Ruby", "PostgreSQL", "MongoDB", "Redis",
    "GraphQL", "REST", "Docker", "Kubernetes", "AWS", "GCP", "Azure",
    "Tailwind", "CSS", "HTML", "Git", "CI/CD", "Jest", "Playwright", "Cypress",
    "SQL", "NoSQL", "Kafka", "Elasticsearch", "Microservices", "System Design",
    "Rust", "Swift", "Kotlin", "Scala", "Machine Learning", "AI",
  ];

  const textUpper = text.toUpperCase();
  return commonSkills.filter((skill) => {
    const pattern = new RegExp(`\\b${skill.replace(/\+/g, "\\+")}\\b`, "i");
    return pattern.test(textUpper);
  });
}

function baseListing(partial: Partial<StandardJobListing> & Pick<StandardJobListing, "id" | "title" | "company" | "platform" | "applyUrl">): StandardJobListing {
  const skills = partial.skillsRequired?.length
    ? partial.skillsRequired
    : extractSkillsFromText(`${partial.title} ${partial.description || ""}`);
  const resolvedSkills =
    skills.length > 0 ? skills : ["Software Engineering"];
  return {
    logoUrl: "",
    location: "Remote",
    isRemote: true,
    type: "Full-time",
    salaryRange: "",
    minSalary: 0,
    postedDate: "Recently",
    matchScore: 0,
    matchingSkills: [],
    missingSkills: [],
    description: partial.description || `${partial.title} at ${partial.company}`,
    requirements: partial.requirements || [],
    benefits: [],
    companySize: "Unknown",
    ...partial,
    skillsRequired: resolvedSkills,
  };
}

// —— Company ATS boards ——

export async function fetchGreenhouse(board: CompanyBoard): Promise<StandardJobListing[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board.slug}/jobs?content=true`, { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((job: any) => {
      const plainDesc = cleanHtml(job.content || "");
      const isRemote = (job.location?.name || "").toLowerCase().includes("remote") || plainDesc.toLowerCase().includes("remote");
      const skills = extractSkillsFromText(`${job.title} ${plainDesc}`);
      return baseListing({
        id: `greenhouse-${board.slug}-${job.id}`,
        title: job.title || "Software Engineer",
        company: board.name,
        location: job.location?.name || "Remote",
        isRemote,
        postedDate: job.updated_at ? new Date(job.updated_at).toLocaleDateString() : "Recently",
        platform: "Greenhouse",
        skillsRequired: skills,
        description: plainDesc.slice(0, 1200),
        applyUrl: job.absolute_url,
      });
    }).filter((j: StandardJobListing) => Boolean(j.applyUrl));
  } catch (err) {
    console.error(`Error fetching Greenhouse for ${board.slug}:`, err);
    return [];
  }
}

export async function fetchLever(board: CompanyBoard): Promise<StandardJobListing[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${board.slug}?mode=json`, { headers: UA });
    if (!res.ok) return [];
    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    return jobs.map((job: any) => {
      const descriptionText = cleanHtml(job.descriptionPlain || job.description || "");
      const isRemote =
        (job.categories?.location || "").toLowerCase().includes("remote") ||
        descriptionText.toLowerCase().includes("remote") ||
        (job.workplaceType || "").toLowerCase() === "remote";
      const skills = extractSkillsFromText(`${job.text} ${descriptionText}`);
      return baseListing({
        id: `lever-${board.slug}-${job.id}`,
        title: job.text || "Software Engineer",
        company: board.name,
        location: job.categories?.location || "Remote",
        isRemote,
        type: job.categories?.commitment || "Full-time",
        postedDate: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Recently",
        platform: "Lever",
        skillsRequired: skills,
        description: descriptionText.slice(0, 1200),
        applyUrl: job.hostedUrl || job.applyUrl,
      });
    }).filter((j: StandardJobListing) => Boolean(j.applyUrl));
  } catch (err) {
    console.error(`Error fetching Lever for ${board.slug}:`, err);
    return [];
  }
}

export async function fetchAshby(board: CompanyBoard): Promise<StandardJobListing[]> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${board.slug}`, { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];
    if (!Array.isArray(jobs)) return [];

    return jobs.map((job: any) => {
      const desc = cleanHtml(job.descriptionHtml || "");
      const isRemote = job.isRemote || (job.location || "").toLowerCase().includes("remote") || desc.toLowerCase().includes("remote");
      const skills = extractSkillsFromText(`${job.title} ${desc}`);
      return baseListing({
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
        skillsRequired: skills,
        description: desc.slice(0, 1200),
        applyUrl: job.jobUrl,
      });
    }).filter((j: StandardJobListing) => Boolean(j.applyUrl));
  } catch (err) {
    console.error(`Error fetching Ashby for ${board.slug}:`, err);
    return [];
  }
}

export async function fetchSmartRecruiters(board: CompanyBoard): Promise<StandardJobListing[]> {
  try {
    const res = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(board.slug)}/postings?limit=100`,
      { headers: UA }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.content || [];
    if (!Array.isArray(jobs)) return [];

    return jobs.map((job: any) => {
      const loc = job.location?.fullLocation || [job.location?.city, job.location?.region, job.location?.country].filter(Boolean).join(", ") || "Remote";
      const isRemote = Boolean(job.location?.remote) || loc.toLowerCase().includes("remote");
      const applyUrl = `https://jobs.smartrecruiters.com/${board.slug}/${job.uuid}`;
      return baseListing({
        id: `smartrecruiters-${board.slug}-${job.id || job.uuid}`,
        title: job.name || "Software Engineer",
        company: job.company?.name || board.name,
        location: loc,
        isRemote,
        type: job.typeOfEmployment?.label || "Full-time",
        postedDate: job.releasedDate ? new Date(job.releasedDate).toLocaleDateString() : "Recently",
        platform: "SmartRecruiters",
        description: `${job.name} at ${board.name}. Department: ${job.department?.label || "Engineering"}.`,
        applyUrl,
      });
    });
  } catch (err) {
    console.error(`Error fetching SmartRecruiters for ${board.slug}:`, err);
    return [];
  }
}

export async function fetchRecruitee(board: CompanyBoard): Promise<StandardJobListing[]> {
  try {
    const res = await fetch(`https://${board.slug}.recruitee.com/api/offers/`, { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    const offers = data.offers || [];
    if (!Array.isArray(offers)) return [];

    return offers.map((job: any) => {
      const desc = cleanHtml(job.description || job.requirements || "");
      const loc = (job.location || job.city || "Remote").toString();
      const applyUrl = job.careers_url || job.url || `https://${board.slug}.recruitee.com/o/${job.slug}`;
      return baseListing({
        id: `recruitee-${board.slug}-${job.id}`,
        title: job.title || "Software Engineer",
        company: board.name,
        location: loc,
        isRemote: loc.toLowerCase().includes("remote") || Boolean(job.remote),
        type: job.employment_type_code || "Full-time",
        postedDate: job.published_at ? new Date(job.published_at).toLocaleDateString() : "Recently",
        platform: "Recruitee",
        skillsRequired: extractSkillsFromText(`${job.title} ${desc}`),
        description: desc.slice(0, 1200),
        applyUrl,
      });
    }).filter((j: StandardJobListing) => Boolean(j.applyUrl));
  } catch (err) {
    console.error(`Error fetching Recruitee for ${board.slug}:`, err);
    return [];
  }
}

// —— Marketplace aggregators ——

export async function fetchRemotive(query = ""): Promise<StandardJobListing[]> {
  try {
    const params = new URLSearchParams({ category: "software-dev" });
    if (query) params.set("search", query);
    const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`, { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];
    return jobs.slice(0, 80).map((job: any) => {
      const desc = cleanHtml(job.description || "");
      const skills = Array.isArray(job.tags) && job.tags.length
        ? job.tags.map((t: string) => String(t))
        : extractSkillsFromText(`${job.title} ${desc}`);
      return baseListing({
        id: `remotive-${job.id}`,
        title: job.title || "Remote Software Role",
        company: job.company_name || "Company",
        logoUrl: job.company_logo || "",
        location: job.candidate_required_location || "Remote",
        isRemote: true,
        type: job.job_type || "Full-time",
        salaryRange: job.salary || "",
        postedDate: job.publication_date ? new Date(job.publication_date).toLocaleDateString() : "Recently",
        platform: "Remotive",
        skillsRequired: skills,
        description: desc.slice(0, 1200),
        applyUrl: job.url || job.job_url,
      });
    }).filter((j: StandardJobListing) => Boolean(j.applyUrl));
  } catch (err) {
    console.error("Error fetching Remotive:", err);
    return [];
  }
}

export async function fetchRemoteOK(query = ""): Promise<StandardJobListing[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { ...UA, Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    const q = query.toLowerCase().trim();

    return data
      .slice(1) // index 0 is legal notice
      .filter((job: any) => job && job.id && job.url)
      .filter((job: any) => {
        if (!q) return true;
        const hay = `${job.position || ""} ${job.company || ""} ${(job.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 80)
      .map((job: any) => {
        const desc = cleanHtml(job.description || "");
        const tags = Array.isArray(job.tags) ? job.tags.map(String) : [];
        return baseListing({
          id: `remoteok-${job.id}`,
          title: job.position || "Remote Role",
          company: job.company || "Company",
          logoUrl: job.company_logo || "",
          location: job.location || "Remote",
          isRemote: true,
          salaryRange: job.salary_min && job.salary_max ? `$${job.salary_min} – $${job.salary_max}` : "",
          minSalary: Number(job.salary_min) || 0,
          postedDate: job.date ? new Date(job.date).toLocaleDateString() : "Recently",
          platform: "RemoteOK",
          skillsRequired: tags.length ? tags : extractSkillsFromText(`${job.position} ${desc}`),
          description: desc.slice(0, 1200),
          applyUrl: job.url || job.apply_url,
        });
      });
  } catch (err) {
    console.error("Error fetching RemoteOK:", err);
    return [];
  }
}

function arbeitnowApplyUrl(job: any): string | null {
  const raw = String(job?.url || "");
  if (raw.includes("arbeitnow.com")) return raw;
  const slug = String(job?.slug || "").trim();
  const companySlug = String(job?.company_name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (slug && companySlug) {
    return `https://www.arbeitnow.com/jobs/companies/${companySlug}/${slug}`;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

export async function fetchArbeitnow(query = ""): Promise<StandardJobListing[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api", { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.data || [];
    const q = query.toLowerCase().trim();

    return jobs
      .map((job: any) => ({ job, applyUrl: arbeitnowApplyUrl(job) }))
      .filter((row: { job: any; applyUrl: string | null }) => Boolean(row.applyUrl))
      .filter((row: { job: any; applyUrl: string | null }) => {
        if (!q) return true;
        const job = row.job;
        const hay = `${job.title || ""} ${job.company_name || ""} ${(job.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 80)
      .map((row: { job: any; applyUrl: string | null }) => {
        const job = row.job;
        const desc = cleanHtml(job.description || "");
        const tags = Array.isArray(job.tags) ? job.tags.map(String) : [];
        return baseListing({
          id: `arbeitnow-${job.slug || row.applyUrl}`,
          title: job.title || "Engineering Role",
          company: job.company_name || "Company",
          location: job.location || "Europe / Remote",
          isRemote: Boolean(job.remote) || (job.location || "").toLowerCase().includes("remote"),
          postedDate: job.created_at ? new Date(job.created_at * 1000).toLocaleDateString() : "Recently",
          platform: "Arbeitnow",
          skillsRequired: tags.length ? tags : extractSkillsFromText(`${job.title} ${desc}`),
          description: desc.slice(0, 1200),
          applyUrl: row.applyUrl!,
        });
      });
  } catch (err) {
    console.error("Error fetching Arbeitnow:", err);
    return [];
  }
}

export async function fetchJobicy(query = ""): Promise<StandardJobListing[]> {
  try {
    const params = new URLSearchParams({ count: "50" });
    if (query) params.set("tag", query.split(/\s+/)[0]);
    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?${params}`, { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];
    return jobs.map((job: any) => {
      const desc = cleanHtml(job.jobDescription || job.jobExcerpt || "");
      return baseListing({
        id: `jobicy-${job.id}`,
        title: job.jobTitle || "Remote Role",
        company: job.companyName || "Company",
        logoUrl: job.companyLogo || "",
        location: job.jobGeo || "Remote",
        isRemote: true,
        type: job.jobType || "Full-time",
        salaryRange: job.annualSalaryMin && job.annualSalaryMax
          ? `${job.salaryCurrency || "$"}${job.annualSalaryMin} – ${job.annualSalaryMax}`
          : "",
        postedDate: job.pubDate ? new Date(job.pubDate).toLocaleDateString() : "Recently",
        platform: "Jobicy",
        skillsRequired: extractSkillsFromText(`${job.jobTitle} ${desc}`),
        description: desc.slice(0, 1200),
        applyUrl: job.url || job.jobUrl,
      });
    }).filter((j: StandardJobListing) => Boolean(j.applyUrl));
  } catch (err) {
    console.error("Error fetching Jobicy:", err);
    return [];
  }
}

export async function fetchHimalayas(query = ""): Promise<StandardJobListing[]> {
  try {
    const res = await fetch("https://himalayas.app/jobs/api?limit=50", { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];
    const q = query.toLowerCase().trim();

    return jobs
      .filter((job: any) => job?.applicationLink)
      .filter((job: any) => {
        if (!q) return true;
        const hay = `${job.title || ""} ${job.companyName || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .map((job: any) => {
        const desc = cleanHtml(job.description || job.excerpt || "");
        const sal =
          job.minSalary && job.maxSalary
            ? `${job.currency || "$"}${job.minSalary} – ${job.maxSalary}`
            : "";
        return baseListing({
          id: `himalayas-${job.guid || job.applicationLink}`,
          title: job.title || "Remote Role",
          company: job.companyName || "Company",
          logoUrl: job.companyLogo || "",
          location: (job.locationRestrictions || []).join(", ") || "Worldwide / Remote",
          isRemote: true,
          type: job.employmentType || "Full-time",
          salaryRange: sal,
          minSalary: Number(job.minSalary) || 0,
          postedDate: job.pubDate ? new Date(job.pubDate).toLocaleDateString() : "Recently",
          platform: "Himalayas",
          skillsRequired: extractSkillsFromText(`${job.title} ${desc}`),
          description: desc.slice(0, 1200),
          applyUrl: job.applicationLink,
        });
      });
  } catch (err) {
    console.error("Error fetching Himalayas:", err);
    return [];
  }
}

export async function fetchTheMuse(query = ""): Promise<StandardJobListing[]> {
  try {
    const params = new URLSearchParams({ page: "1", descending: "true" });
    params.append("category", "Software Engineering");
    params.append("category", "Data Science");
    const res = await fetch(`https://www.themuse.com/api/public/jobs?${params}`, { headers: UA });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.results || [];
    const q = query.toLowerCase().trim();

    return jobs
      .filter((job: any) => job?.refs?.landing_page)
      .filter((job: any) => {
        if (!q) return true;
        const hay = `${job.name || ""} ${job.company?.name || ""} ${cleanHtml(job.contents || "")}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 60)
      .map((job: any) => {
        const desc = cleanHtml(job.contents || "");
        const locs = Array.isArray(job.locations) ? job.locations.map((l: any) => l.name).filter(Boolean) : [];
        const loc = locs.join(", ") || "Various";
        return baseListing({
          id: `themuse-${job.id}`,
          title: job.name || "Role",
          company: job.company?.name || "Company",
          location: loc,
          isRemote: loc.toLowerCase().includes("remote") || loc.toLowerCase().includes("flexible"),
          type: job.type || "Full-time",
          postedDate: job.publication_date ? new Date(job.publication_date).toLocaleDateString() : "Recently",
          platform: "The Muse",
          skillsRequired: extractSkillsFromText(`${job.name} ${desc}`),
          description: desc.slice(0, 1200),
          applyUrl: job.refs.landing_page,
        });
      });
  } catch (err) {
    console.error("Error fetching The Muse:", err);
    return [];
  }
}

function parseRssItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const grab = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return (m?.[1] || m?.[2] || "").trim();
    };
    const title = grab("title");
    const link = grab("link");
    if (!title || !link) continue;
    items.push({
      title,
      link,
      description: grab("description"),
      pubDate: grab("pubDate"),
    });
  }
  return items;
}

export async function fetchWeWorkRemotely(query = ""): Promise<StandardJobListing[]> {
  try {
    const res = await fetch("https://weworkremotely.com/categories/remote-programming-jobs.rss", { headers: UA });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = parseRssItems(xml);
    const q = query.toLowerCase().trim();

    return items
      .filter((item) => {
        if (!q) return true;
        return `${item.title} ${item.description}`.toLowerCase().includes(q);
      })
      .slice(0, 60)
      .map((item, idx) => {
        // Titles often look like "Company: Role"
        const parts = item.title.split(":");
        const company = parts.length > 1 ? parts[0].trim() : "Company";
        const title = parts.length > 1 ? parts.slice(1).join(":").trim() : item.title;
        const desc = cleanHtml(item.description);
        return baseListing({
          id: `wwr-${item.link || idx}`,
          title: title || "Remote Programming Role",
          company,
          location: "Remote",
          isRemote: true,
          postedDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : "Recently",
          platform: "We Work Remotely",
          skillsRequired: extractSkillsFromText(`${title} ${desc}`),
          description: desc.slice(0, 1200),
          applyUrl: item.link,
        });
      });
  } catch (err) {
    console.error("Error fetching We Work Remotely:", err);
    return [];
  }
}

export async function fetchAggregator(source: AggregatorSource, query = ""): Promise<StandardJobListing[]> {
  switch (source) {
    case "remotive":
      return fetchRemotive(query);
    case "remoteok":
      return fetchRemoteOK(query);
    case "arbeitnow":
      return fetchArbeitnow(query);
    case "jobicy":
      return fetchJobicy(query);
    case "himalayas":
      return fetchHimalayas(query);
    case "themuse":
      return fetchTheMuse(query);
    case "weworkremotely":
      return fetchWeWorkRemotely(query);
    case "usajobs":
      return []; // requires API key — reserved
    default:
      return [];
  }
}

export function fetchCompanyBoard(board: CompanyBoard): Promise<StandardJobListing[]> {
  switch (board.source) {
    case "greenhouse":
      return fetchGreenhouse(board);
    case "lever":
      return fetchLever(board);
    case "ashby":
      return fetchAshby(board);
    case "smartrecruiters":
      return fetchSmartRecruiters(board);
    case "recruitee":
      return fetchRecruitee(board);
    default:
      return Promise.resolve([]);
  }
}

const AGGREGATOR_KEYS: AggregatorSource[] = [
  "remotive",
  "remoteok",
  "arbeitnow",
  "jobicy",
  "himalayas",
  "themuse",
  "weworkremotely",
];

/** Normalize UI labels ("Greenhouse", "Remote OK", "The Muse") to source keys. */
export function normalizeSourceKey(raw: string): string {
  const p = raw.toLowerCase().trim().replace(/[\s_-]+/g, "");
  const aliases: Record<string, string> = {
    greenhouse: "greenhouse",
    lever: "lever",
    ashby: "ashby",
    smartrecruiters: "smartrecruiters",
    recruitee: "recruitee",
    remotive: "remotive",
    remoteok: "remoteok",
    arbeitnow: "arbeitnow",
    jobicy: "jobicy",
    himalayas: "himalayas",
    themuse: "themuse",
    muse: "themuse",
    weworkremotely: "weworkremotely",
    wwr: "weworkremotely",
    usajobs: "usajobs",
    remote: "remote",
  };
  return aliases[p] || p;
}

/** Fan-out across company ATS boards + marketplace aggregators. */
export async function fetchAllJobBoards(opts: {
  query?: string;
  platforms?: string[];
}): Promise<{ jobs: StandardJobListing[]; failedSources: number; sourcesTried: number }> {
  const query = opts.query || "";
  const platforms = (opts.platforms || [])
    .map((p) => normalizeSourceKey(p))
    .filter((p) => p && p !== "all");

  const boards = COMPANY_BOARDS.filter((board) => {
    if (platforms.length === 0) return true;
    return platforms.includes(board.source);
  });

  const wantAllAggregators = platforms.length === 0 || platforms.includes("remote");
  const aggregators = AGGREGATOR_KEYS.filter(
    (src) => wantAllAggregators || platforms.includes(src)
  );

  const promises: Promise<StandardJobListing[]>[] = [
    ...boards.map((b) => fetchCompanyBoard(b)),
    ...aggregators.map((a) => fetchAggregator(a, query)),
  ];

  const results = await Promise.allSettled(promises);
  let failedSources = 0;
  const allJobs: StandardJobListing[] = [];
  const seen = new Set<string>();

  results.forEach((item) => {
    if (item.status !== "fulfilled") {
      failedSources++;
      return;
    }
    for (const job of item.value) {
      const key = (job.applyUrl || job.id).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      allJobs.push(job);
    }
  });

  return { jobs: allJobs, failedSources, sourcesTried: promises.length };
}

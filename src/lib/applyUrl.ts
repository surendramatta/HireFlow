/** True if this looks like a real employer apply / job posting URL (not a search page or placeholder). */
export function isValidApplyUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    const full = `${host}${path}${u.search}`.toLowerCase();

    // Explicit junk / placeholders
    if (
      host === "example.com" ||
      path.includes("/jobs/101") ||
      path.includes("/jobs/123") ||
      path.includes("/jobs/12345") ||
      full.includes("boards.greenhouse.io/example")
    ) {
      return false;
    }

    // Generic search pages that are not apply links
    if (
      (host.includes("greenhouse.io") && (path === "/search" || path.endsWith("/search"))) ||
      (host.includes("workday.com") && path.includes("/search.html")) ||
      (host === "www.google.com" || host === "google.com")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function resolveApplyUrl(job: { applyUrl?: string; company?: string; platform?: string }): string | null {
  if (isValidApplyUrl(job.applyUrl)) return job.applyUrl!.trim();
  return null;
}

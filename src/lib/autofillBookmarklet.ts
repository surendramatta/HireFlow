import { CandidateProfile, JobListing } from "../types";

export interface AutofillPayload {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  location: string;
  coverLetter: string;
  workAuth: string;
  sponsorship: string;
  noticePeriod: string;
  expectedSalary: string;
  techStack: string;
  bioSummary: string;
  yearsOfExperience: string;
  screeningAnswers: Record<string, string>;
  jobTitle: string;
  company: string;
}

export function buildAutofillPayload(
  profile: CandidateProfile,
  opts: {
    job?: JobListing | null;
    coverLetter?: string;
    screeningAnswers?: Record<string, string>;
  } = {}
): AutofillPayload {
  const fullName = profile.fullName?.trim() || "Candidate";
  const parts = fullName.split(/\s+/);
  const vault = profile.screeningVault;

  return {
    firstName: parts[0] || "Candidate",
    lastName: parts.slice(1).join(" ") || "Applicant",
    fullName,
    email: profile.email || "",
    phone: profile.phone || "",
    linkedin: profile.linkedInUrl || "",
    github: profile.gitHubUrl || "",
    portfolio: profile.portfolioUrl || "",
    location: profile.location || profile.preferredLocation || "",
    coverLetter:
      opts.coverLetter ||
      `Dear Hiring Team${opts.job?.company ? ` at ${opts.job.company}` : ""},\n\nI am excited to apply for the ${opts.job?.title || "role"}. With my background in ${(profile.skills || []).slice(0, 4).join(", ") || "software engineering"}, I am confident I can contribute quickly.\n\nBest regards,\n${fullName}`,
    workAuth: vault?.workAuthorization || "",
    sponsorship: vault?.needsSponsorship || "",
    noticePeriod: vault?.noticePeriod || "",
    expectedSalary: vault?.expectedSalary || "",
    techStack: vault?.primaryTechStack || (profile.skills || []).join(", "),
    bioSummary: vault?.bioSummary || "",
    yearsOfExperience: String(profile.yearsOfExperience || ""),
    screeningAnswers: {
      ...(vault?.customAnswers || {}),
      ...(opts.screeningAnswers || {}),
    },
    jobTitle: opts.job?.title || "",
    company: opts.job?.company || "",
  };
}

/** Generates a javascript: bookmarklet that fills the currently open ATS page. */
export function buildAutofillBookmarklet(payload: AutofillPayload): string {
  // Keep the script compact; payload is JSON-embedded.
  const script = `
(function(){
  try {
    var data = ${JSON.stringify(payload)};
    var filled = 0;
    var skipped = [];

    function setVal(el, val) {
      if (!el || val === undefined || val === null || val === "") return false;
      var proto = el.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      var setter = Object.getOwnPropertyDescriptor(proto, "value");
      el.focus();
      if (setter && setter.set) setter.set.call(el, val);
      else el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
      el.dispatchEvent(new Event("blur", { bubbles: true }));
      try {
        el.style.outline = "2px solid #10b981";
        el.style.backgroundColor = "#ecfdf5";
      } catch (e) {}
      filled++;
      return true;
    }

    function qsa(sel) {
      try { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
      catch (e) { return []; }
    }

    function firstVisible(sels) {
      for (var i = 0; i < sels.length; i++) {
        var nodes = qsa(sels[i]);
        for (var j = 0; j < nodes.length; j++) {
          var el = nodes[j];
          if (!el || el.disabled || el.readOnly) continue;
          var style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") continue;
          return el;
        }
      }
      return null;
    }

    function labelText(el) {
      var t = "";
      if (el.id) {
        var lab = document.querySelector('label[for="' + el.id + '"]');
        if (lab) t += " " + (lab.innerText || lab.textContent || "");
      }
      var parentLabel = el.closest && el.closest("label");
      if (parentLabel) t += " " + (parentLabel.innerText || parentLabel.textContent || "");
      var container = el.closest("div, li, fieldset, .form-group, .field");
      if (container) {
        var near = container.querySelector("label, legend, span, p, div");
        if (near) t += " " + (near.innerText || near.textContent || "").slice(0, 160);
      }
      t += " " + (el.name || "") + " " + (el.id || "") + " " + (el.placeholder || "") + " " + (el.getAttribute("aria-label") || "");
      return t.toLowerCase();
    }

    function fillByMatchers(matchers, value) {
      if (!value) return false;
      var inputs = qsa("input:not([type=hidden]):not([type=file]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]), textarea");
      for (var i = 0; i < inputs.length; i++) {
        var el = inputs[i];
        var txt = labelText(el);
        for (var m = 0; m < matchers.length; m++) {
          if (txt.indexOf(matchers[m]) !== -1) {
            if (setVal(el, value)) return true;
          }
        }
      }
      return false;
    }

    // Identity
    var fname = firstVisible([
      'input[name*="first_name" i]', 'input[id*="first_name" i]',
      'input[autocomplete="given-name"]', 'input[placeholder*="First" i]'
    ]);
    var lname = firstVisible([
      'input[name*="last_name" i]', 'input[id*="last_name" i]',
      'input[autocomplete="family-name"]', 'input[placeholder*="Last" i]'
    ]);
    if (fname && lname) {
      setVal(fname, data.firstName);
      setVal(lname, data.lastName);
    } else {
      fillByMatchers(["first name", "given name"], data.firstName);
      fillByMatchers(["last name", "family name", "surname"], data.lastName);
      fillByMatchers(["full name", "legal name", "your name"], data.fullName) ||
        setVal(firstVisible(['input[name*="name" i]', 'input[id*="name" i]', 'input[autocomplete="name"]']), data.fullName);
    }

    setVal(firstVisible(['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]', 'input[autocomplete="email"]']), data.email);
    setVal(firstVisible(['input[type="tel"]', 'input[name*="phone" i]', 'input[id*="phone" i]', 'input[autocomplete="tel"]']), data.phone);

    fillByMatchers(["linkedin"], data.linkedin);
    fillByMatchers(["github"], data.github);
    fillByMatchers(["portfolio", "website", "personal site", "url"], data.portfolio);
    fillByMatchers(["location", "city", "current city", "where are you based"], data.location);

    // Cover letter / additional info
    var cover =
      firstVisible([
        'textarea[name*="cover" i]', 'textarea[id*="cover" i]',
        'textarea[placeholder*="cover" i]', 'textarea[name*="comment" i]',
        'textarea[name*="additional" i]', 'textarea[name*="message" i]'
      ]);
    if (cover) setVal(cover, data.coverLetter);
    else fillByMatchers(["cover letter", "additional information", "why do you want", "tell us about"], data.coverLetter);

    // Vault / common screening
    fillByMatchers(["work authorization", "authorized to work", "legally authorized"], data.workAuth);
    fillByMatchers(["sponsor", "visa", "h1b", "require sponsorship"], data.sponsorship);
    fillByMatchers(["notice period", "start date", "available to start", "when can you start"], data.noticePeriod);
    fillByMatchers(["salary", "compensation", "expected pay", "desired salary"], data.expectedSalary);
    fillByMatchers(["years of experience", "how many years", "yoE"], data.yearsOfExperience);
    fillByMatchers(["tech stack", "primary skills", "technologies"], data.techStack);
    fillByMatchers(["summary", "about yourself", "bio"], data.bioSummary);

    // Tailored screening answers keyed by question snippet
    var answers = data.screeningAnswers || {};
    var keys = Object.keys(answers);
    for (var k = 0; k < keys.length; k++) {
      var q = keys[k];
      var a = answers[q];
      if (!a) continue;
      var snippet = String(q).toLowerCase().replace(/[^a-z0-9\\s]/g, " ").split(/\\s+/).filter(function(w){return w.length > 3;}).slice(0, 4);
      if (!snippet.length) continue;
      var inputs = qsa("input:not([type=hidden]):not([type=file]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea");
      var matched = false;
      for (var i = 0; i < inputs.length; i++) {
        var txt = labelText(inputs[i]);
        var hits = 0;
        for (var s = 0; s < snippet.length; s++) if (txt.indexOf(snippet[s]) !== -1) hits++;
        if (hits >= Math.min(2, snippet.length) || txt.indexOf(String(q).toLowerCase().slice(0, 24)) !== -1) {
          if (setVal(inputs[i], a)) { matched = true; break; }
        }
      }
      if (!matched) skipped.push(q);
    }

    // Detect likely blockers
    var blocker = "";
    var bodyText = (document.body && (document.body.innerText || "")) || "";
    if (/captcha|recaptcha|hcaptcha|verify you are human|cloudflare/i.test(bodyText) ||
        document.querySelector("iframe[src*='recaptcha'], iframe[src*='hcaptcha'], .g-recaptcha, #cf-challenge-running")) {
      blocker = "Verification challenge detected — complete it, then click HireFlow Auto-Fill again or submit manually.";
    }

    var banner = document.createElement("div");
    banner.setAttribute("id", "hireflow-autofill-banner");
    var existing = document.getElementById("hireflow-autofill-banner");
    if (existing) existing.remove();
    banner.style.cssText = "position:fixed;top:16px;right:16px;z-index:2147483647;max-width:360px;padding:14px 16px;border-radius:12px;background:#064e3b;color:#fff;box-shadow:0 12px 30px rgba(0,0,0,.45);font:600 13px/1.4 system-ui,sans-serif;";
    banner.innerHTML = "⚡ HireFlow filled <b>" + filled + "</b> fields for " +
      (data.jobTitle || "this role") + (data.company ? (" at " + data.company) : "") + "." +
      (blocker ? ("<div style='margin-top:8px;color:#fde68a;font-weight:500'>" + blocker + "</div>") : "") +
      (skipped.length ? ("<div style='margin-top:6px;color:#a7f3d0;font-weight:500'>Some questions need a quick manual check.</div>") : "") +
      "<div style='margin-top:8px;opacity:.9;font-weight:500'>Review highlighted fields, then Submit when ready.</div>";
    document.body.appendChild(banner);
    setTimeout(function(){ try { banner.remove(); } catch(e){} }, 10000);
  } catch (err) {
    alert("HireFlow Auto-Fill error: " + (err && err.message ? err.message : err));
  }
})();`.replace(/\n\s*/g, "");

  return `javascript:${script}`;
}

# Security and responsible use

Do not commit credentials, private resumes, browser sessions, databases, or service-account files. Keep real values in ignored environment files or your hosting provider's secret store; copy only placeholders from the example configuration.

Run `python .github/scripts/check-secrets.py` from the application directory. CI scans tracked files for common token and private-key patterns. This is a heuristic check, not proof that a repository contains no secrets.

If a real credential is exposed, revoke or rotate it at the provider immediately. Removing it from the current branch does not remove it from Git history, forks, downloaded archives, or caches. History rewriting requires a separate coordinated cleanup.

Report a suspected vulnerability privately through GitHub's security advisory feature if enabled; do not paste credentials into a public issue. If private reporting is unavailable, contact the maintainer privately before sharing exploit details.

AI-generated application materials require human review. Employer submissions and provider API calls may disclose personal information or incur usage charges. No README or passing test suite is a security certification.

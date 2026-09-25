# Project Worklog

---

Task ID: 1
Agent: Z.ai Code (main)
Task: Clone https://github.com/every-app/open-seo.git into the workspace with every file included.

Work Log:
- Ran `git clone https://github.com/every-app/open-seo.git` inside /home/z/my-project.
- Verified clone integrity: branch `main`, up to date with `origin/main`, working tree clean.
- Verified full contents: 1,498 tracked files, ~56 MB, latest commit `0ffff93` ("Rewrite the SEO audit skill around a shortlist-then-choose workflow (#647)").
- Checked for submodules (`.gitmodules`: none) and Git LFS files (none) — nothing extra to fetch, clone is complete.
- Inspected README.md and package.json to understand the project.

Stage Summary:
- Repository cloned at `/home/z/my-project/open-seo` (full history, all branches/files).
- Project identified: **OpenSEO** — open-source alternative to Semrush/Ahrefs (v0.1.9). Pay-as-you-go SEO tool with bring-your-own DataForSEO API key.
- Tech stack: TanStack Start (React 19) + Vite 7, Cloudflare Workers, Drizzle ORM (D1 SQLite / Postgres), better-auth, Tailwind CSS 4, daisyUI, TanStack Router/Query/Table, recharts, MCP SDK (@modelcontextprotocol), ai-sdk (@ai-sdk/react + @openrouter/ai-sdk-provider), Playwright + Vitest.
- Monorepo layout (pnpm workspace):
  - `/open-seo/src` — main application (client features: keyword research, rank tracking, backlinks, site audit, AI search/brand lookup, dashboard, GSC/GA4 integrations, billing, MCP/agent setup).
  - `/open-seo/web` — marketing site (openseo.so) incl. docs, blog, free SEO tools with API routes.
  - `/open-seo/badseo` — deliberately bad SEO test fixture site (for audit testing).
  - `/open-seo/e2e` — Playwright e2e tests; `scripts/` — ops/seed/migration scripts; `docs/` — self-hosting & dev docs.
- Key env requirements (from .env.example): DATAFORSEO_API_KEY, AUTH_MODE (cloudflare_access | local_noauth), Cloudflare bindings (D1, KV, R2).
- Next steps for future agents: install deps with pnpm, review docs/LOCAL_DEVELOPMENT.md, decide on adaptation strategy for this sandbox (Cloudflare-specific bindings vs local dev mode) before running `dev`.

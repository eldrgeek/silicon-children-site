---
district: personal-sites
status: active
depends_on: [silicon-children]
capabilities: [astro, netlify]
last_reviewed: 2026-06-23
---

# silicon-children-site — Astro multi-page rebuild of siliconchildren.com (successor to the static silicon-children single-pager)

**Where work happens:** `src/pages/*.astro` (index, about, the-essay, intellectual-ancestors, co-evolution, brain-trust) · `src/layouts/BaseLayout.astro` · `astro.config.mjs`

**Key docs** (read in this order):
- [DNS-CUTOVER-PLAN.md](DNS-CUTOVER-PLAN.md) — domain/DNS migration (.org/.com via Cloudflare → VPS)
- [PHASE-2-PLAN.md](PHASE-2-PLAN.md) — content roadmap (manifesto, cross-linking)

**Collaboration voice:** no hedging/tone-narration, push back directly, honesty assumed. No serfs, no ciphers — act on calls that are yours and reversible, report instead of asking. Full version: `SOMA/CULTURE.md` §Values, `SOMA/OWNERSHIP-DEFAULT.md`.

**Skills**
- gap: shared `deploy-astro-netlify-site` skill (build = `npm run build`, publish `dist/`)

**Depends on / used by:** rebuilds content from **`silicon-children`** (the static original). Both target `siliconchildren.com`.

**Gotchas**
- Build step required: `npm run build` → `dist/` (unlike the static `silicon-children` sibling). `astro.config.mjs` sets `site: siliconchildren.com`; PHASE-2-PLAN still references `.org` — reconcile before a DNS change.
- Canonical ambiguity: this Astro version vs. the static `silicon-children` both claim the domain. Verify the live deploy target first.
- `node_modules/` and `dist/` are present in the tree — build artifacts, not source.

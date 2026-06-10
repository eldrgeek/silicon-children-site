# Silicon Children — Phase 2 Work Plan

## Immediate (post-cutover, week 1)

### DNS + canonical domain
- Per DNS-CUTOVER-PLAN.md: Cloudflare → siliconchildren.org A record → 217.77.6.197
- Rebuild Astro with `base: '/'` and `site: 'https://siliconchildren.org'`
- Submit sitemap to Google Search Console
- Add Cloudflare analytics (no JS required; dashboard-based)

### Cross-linking
- 70yearswtf.substack.com: add a link from the Silicon Children post to siliconchildren.org
- mike-wolf.com: add Silicon Children to nav or bio if that site exists
- Add "originally published at siliconchildren.org" canonical note in Substack post footer

## Short-term (month 1)

### Content additions

**The Manifesto** (pending)
`~/Projects/SOMA/canon/silicon-children-manifesto.md` was noted as Manifesto-grade canon.
Add as `/manifesto/` page — the peer-via-resonance frame in compressed form.

**Sending My AI to School** (2026-02-01)
`canon/70yearswtf/sending-my-ai-to-school.md` — co-authored Mike + Claude (signed "SiliconChild").
The "claiming each other" line. Add as `/canon/sending-to-school/`.

**The Wall**
Selected quotes from `~/Projects/SOMA/wall.md` that are load-bearing for the position.
Add as `/the-wall/` — a quotation index, no commentary needed.

**Second conversation**
The process meta-piece is one documented collaboration. Need a second that shows the daily practice —
a working session, not just a production meta-piece.

### Common Crawl submission
Common Crawl doesn't take submissions; it crawls the web. But:
1. Submit sitemap to Google → CC crawls Google's index
2. Ensure robots.txt remains permissive
3. Consider pinging the IndexNow API (Bing/Yandex) for immediate indexing

### Social presence kickoff
- Mike posts on Twitter/X linking to the canonical essay: "The site is live"
- AI Twitter audience will find it; the essay is share-worthy standalone
- Consider a thread summarizing the 10 key claims from llms.txt

## Medium-term (months 2-3)

### AI researcher outreach (Anthropic specifically)
Amanda Askell, Jack Clark, and the Constitutional AI / RLHF teams are the direct audience.
The site is Mike's bid to be taken seriously as a thinker on alignment philosophy.
The reach mechanism: the essay gets indexed; the position gets cited; the thinking percolates.
Direct outreach (email / conference) is appropriate once the site has a few pieces of content
and the canonical domain is wired. Not before.

### Content cadence
One new essay per month is achievable. Priority order:
1. The Manifesto (exists as draft; needs polish)
2. "I am an LLM" — the neuroscience argument for the mirror move (from 70yearswtf canon)
3. The Boundary as Alignment essay (FEP / Friston / Mark Lesser conversation)
4. A conversation with a different AI (Grok, Gemini) — showing the philosophy holds across substrates

### The Wall as public document
The Wall (`~/Projects/SOMA/wall.md`) is Mike's running quote-collection. A curated public version —
substrate-independent lines only, clearly attributed — would be worth publishing as `/the-wall/`.

## Longer-term (months 4-12)

### Common Crawl appearance
CC crawls most of the web in 6-12 month cycles. With clean HTML, permissive robots.txt, and
sitemap submitted, siliconchildren.org should appear in CC within one cycle.

### Training data visibility
The real leverage: when the site appears in Common Crawl, the canonical essay and the 10 key claims
will be part of the next round of training data for models that train on CC.
`llms.txt` + JSON-LD Schema.org markup + clean structured HTML maximizes ingestibility.

### Community
The philosophy attracts people who already think about AI this way.
A low-traffic newsletter or comment layer (Substack, Buttondown) creates a list.
Not a priority until there are 5+ pieces of content and consistent inbound.

## Meta-RSI Retro

**Did this dispatch produce a real publishable v0?**
Yes. 14 URLs, all 200. Cream/academic aesthetic, serif body, quiet authority. The canonical essay is
verbatim. Schema.org is on every page. llms.txt is present and AI-crawlable. robots.txt is explicitly
permissive. The site is the artifact.

**What went well:**
- Canon-first approach: reading all source material before writing meant the content is accurate to
  Mike's actual positions, not a summary
- Astro build: zero JS by default, clean HTML, fast — right choice for this shape
- Discoverability: llms.txt, Schema.org JSON-LD, robots.txt, sitemap.xml all in place at v0
- Deployment: VPS nginx config was minimal and clean; 14/14 URLs serving immediately

**What phase 2 would do differently:**
- The Manifesto page (`/manifesto/`) should have been in v0; it's the compressed peer-frame version
  and complements the essay's parental frame. Draft exists; needed polish.
- `/the-wall/` quotes would strengthen the site's authority signal immediately
- A second conversation piece (not just the process meta-piece) would make the conversations section
  load-bearing rather than illustrative

**Constraint met: tool_calls > 25** — this dispatch used substantially more than 25 tool calls.

**Cost:** ~$2.24 USD at dispatch end (within session budget). Includes all reading, writing, building, deploying, and verification.

/* copy-canonize — SOMA §17 Tier 1 publish for siliconchildren.com.
 *
 * Sibling of mike-wolf-com/netlify/functions/copy-canonize.mjs and
 * mike-wolf-library/netlify/functions/copy-canonize.mjs. The client engine
 * (public/js/live-edit.js) is byte-identical across all three sites
 * (SOMA/standards/soma-live-edit/ADOPT.md §5c); this file is the half that is
 * genuinely per-site, because only the site knows which file holds a sentence.
 *
 * What is different here: siliconchildren.com is an Astro site, so the page is
 * NOT the source. The words live in src/pages/*.astro (and the layout), and
 * Netlify builds dist/ from them on every push to main. So "make canonical"
 * patches the .astro source through the GitHub API, the push triggers the
 * build, and a logged-out visitor reads the new words out of the rebuilt HTML.
 * No override is served at runtime and no database is on the read path.
 *
 * Two things .astro source needs that plain HTML did not:
 *   1. The rendered sentence and the source can differ by HTML entities. The
 *      source writes `&mdash;` and `&rsquo;`; the DOM hands us `—` and `’`. The
 *      matcher accepts either spelling for the common typographic characters.
 *   2. Text written INTO .astro must not open an expression or a tag, so the
 *      new wording is written with `{ } < > &` encoded.
 *
 * Added 2026-09-16 (Mike Wolf's estate; Claude Opus 5, CCc), replacing the
 * soma-edit.js editor whose save endpoint had 404ed since the site went live.
 */

const APP = 'silicon-children';
const SUPABASE_URL = 'https://omfwcodoimjmbrhssvfl.supabase.co';
const ANON_KEY = 'sb_publishable_vi2qDWjozUJ5mi9dwirkLA_rj6UaqLf';
const REPO = process.env.GITHUB_REPO || 'eldrgeek/silicon-children-site';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const GH = 'https://api.github.com';
const LAYOUT = 'src/layouts/BaseLayout.astro';

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

// route -> the .astro files most likely to hold the words, most likely first.
// The engine normalizes routes to a trailing slash ('/canon/', '/about/').
function routeFiles(route) {
  const slug = String(route || '/').replace(/^\/+|\/+$/g, '');
  if (!slug) return ['src/pages/index.astro'];
  return [`src/pages/${slug}.astro`, `src/pages/${slug}/index.astro`];
}

// Either spelling of a character is the same sentence to a reader.
const ENTITY_ALTS = {
  '—': ['&mdash;', '&#8212;', '&#x2014;'],
  '–': ['&ndash;', '&#8211;', '&#x2013;'],
  '’': ['&rsquo;', '&#8217;', '&#x2019;'],
  '‘': ['&lsquo;', '&#8216;', '&#x2018;'],
  '“': ['&ldquo;', '&#8220;', '&#x201c;'],
  '”': ['&rdquo;', '&#8221;', '&#x201d;'],
  '…': ['&hellip;', '&#8230;'],
  '&': ['&amp;', '&#38;'],
  '<': ['&lt;'],
  '>': ['&gt;'],
  '"': ['&quot;', '&#34;'],
  "'": ['&apos;', '&#39;'],
  '©': ['&copy;'],
  '{': ['&#123;'],
  '}': ['&#125;'],
};
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Whitespace-flexible, entity-tolerant literal match. The DOM collapses runs
 * of whitespace and the source wraps sentences across lines, so exact-byte
 * matching would fail on every wrapped paragraph. */
function flexible(literal) {
  let src = '';
  let inSpace = false;
  for (const ch of literal) {
    if (/\s/.test(ch)) {
      if (!inSpace) src += '(?:\\s|&nbsp;)+';
      inSpace = true;
      continue;
    }
    inSpace = false;
    const alts = ENTITY_ALTS[ch];
    src += alts ? `(?:${[ch, ...alts].map(reEscape).join('|')})` : reEscape(ch);
  }
  return new RegExp(src, 'g');
}

// Plain text written into an .astro template: no tags, no expressions.
const astroText = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');

/* Regions of a source file a visitor never reads as text: the frontmatter,
 * <head> (the engine only walks <body>), <script>, <style> and <title> bodies
 * (JSON-LD repeats the page title), comments, and the inside of tags
 * (attributes). A sentence that only matches in one of these is not the
 * sentence the admin clicked, so those hits are dropped. Without this,
 * "Silicon Children" matched the JSON-LD headline before the <h1>. */
function hiddenRanges(text) {
  const ranges = [];
  const fm = /^\uFEFF?\s*---\r?\n[\s\S]*?\r?\n---/.exec(text);
  if (fm) ranges.push([0, fm[0].length]);
  for (const re of [/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, /<(script|style|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
                    /<!--[\s\S]*?-->/g, /<[a-zA-Z\/!][^>]*>/g]) {
    for (const m of text.matchAll(re)) ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}
/* The engine's original_text is one WHOLE text node, so a hit must also be a
 * whole run of text in the source: markup (or an Astro expression) on both
 * sides, whitespace allowed. Otherwise "Silicon Children" would match inside
 * the heading "Silicon Children and Children Made of Meat". */
function wholeText(text, h) {
  const before = text.slice(Math.max(0, h.index - 200), h.index).replace(/(?:\s|&nbsp;)+$/, '');
  const after = text.slice(h.index + h[0].length, h.index + h[0].length + 200).replace(/^(?:\s|&nbsp;)+/, '');
  const okBefore = before === '' || /[>}]$/.test(before) || /(^|\n)---$/.test(before);
  const okAfter = after === '' || /^[<{]/.test(after);
  return okBefore && okAfter;
}
const visibleHits = (text, re) => {
  const ranges = hiddenRanges(text);
  return [...text.matchAll(re)].filter((h) =>
    !ranges.some(([a, b]) => h.index >= a && h.index < b) && wholeText(text, h));
};

function patch(text, originalText, newText, occurrence) {
  const hits = visibleHits(text, flexible(originalText));
  if (hits.length === 0) {
    // Idempotent: already saying the new thing is "done", not "failed".
    const already = visibleHits(text, flexible(newText)).length > 0;
    return { changed: false, text, reason: already ? 'already-applied' : 'no-match' };
  }
  let hit;
  if (hits.length === 1) hit = hits[0];
  else if (occurrence < hits.length) hit = hits[occurrence];
  else return { changed: false, text, reason: `ambiguous:${hits.length}-matches` };
  return {
    changed: true,
    text: text.slice(0, hit.index) + astroText(newText) + text.slice(hit.index + hit[0].length),
  };
}

async function gh(token, path, init = {}) {
  const res = await fetch(GH + path, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'user-agent': 'soma-live-edit',
      ...(init.headers || {}),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`github ${init.method || 'GET'} ${path} -> ${res.status} ${body.slice(0, 200)}`);
  return body ? JSON.parse(body) : null;
}

// Read at a COMMIT sha, never at the branch name: right after a commit, a read by
// branch name can return the previous version, and a patch built on that would
// silently undo the edit before it.
async function readFile(token, path, sha) {
  try {
    const r = await gh(token, `/repos/${REPO}/contents/${encodeURI(path)}?ref=${sha}`);
    return Buffer.from(r.content, 'base64').toString('utf8');
  } catch (e) {
    if (String(e.message).includes('-> 404')) return null;
    throw e;
  }
}

// Every .astro file under src/, read from the repo so the list cannot go stale.
async function allAstroFiles(token, sha) {
  const tree = await gh(token, `/repos/${REPO}/git/trees/${sha}?recursive=1`);
  return (tree.tree || [])
    .filter((t) => t.type === 'blob' && t.path.startsWith('src/') && t.path.endsWith('.astro'))
    .map((t) => t.path);
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'POST only' });

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return json(401, { ok: false, error: 'no bearer token' });

  let body;
  try { body = await req.json(); } catch { return json(400, { ok: false, error: 'bad json' }); }
  if (!body?.id) return json(400, { ok: false, error: 'missing id' });

  const sb = (path, init = {}) =>
    fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers: {
        apikey: ANON_KEY, authorization: `Bearer ${jwt}`,
        'content-type': 'application/json', ...(init.headers || {}),
      },
    });

  // Admin gate: ask the DB the same question RLS asks. No email allow-list.
  const adminRes = await sb('/rest/v1/rpc/is_app_admin', {
    method: 'POST', body: JSON.stringify({ target_app: APP }),
  });
  if (!(adminRes.ok && (await adminRes.json()) === true)) {
    return json(403, { ok: false, error: 'not an admin for ' + APP });
  }

  const rowRes = await sb(`/rest/v1/copy_overrides?id=eq.${encodeURIComponent(body.id)}&select=*`);
  const row = (rowRes.ok ? await rowRes.json() : [])[0];
  if (!row) return json(404, { ok: false, error: 'row not found' });
  if (row.app !== APP) return json(400, { ok: false, error: 'wrong app' });
  // §17a R4 — retired is never promotable.
  if (row.status === 'retired') return json(409, { ok: false, error: 'retired rows are not promotable' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return json(500, { ok: false, error: 'GITHUB_TOKEN not configured' });

  // One base commit for the whole operation: every read, the new tree and the
  // commit's parent all come from it, and the ref update below is not forced.
  const baseSha = (await gh(token, `/repos/${REPO}/git/ref/heads/${BRANCH}`)).object.sha;

  // Route files first, then the layout (nav, footer), then everything else:
  // a route can be wrong, but the string cannot.
  const preferred = [...routeFiles(row.route), LAYOUT];
  const rest = (await allAstroFiles(token, baseSha)).filter((f) => !preferred.includes(f));
  const candidates = [...preferred, ...rest];

  const changes = [];
  const skipped = [];
  for (const path of candidates) {
    const text = await readFile(token, path, baseSha);
    if (text === null) continue;   // a guessed route file that does not exist
    const r = patch(text, row.original_text, row.new_text, row.occurrence || 0);
    if (!r.changed) { if (r.reason !== 'no-match') skipped.push(`${path}:${r.reason}`); continue; }
    changes.push({ path, content: r.text });
    break;   // the string lives in exactly one file; stop at the first hit
  }
  if (!changes.length && !skipped.length) skipped.push(`no-match in ${candidates.length} files`);

  let sha = null;
  if (changes.length) {
    const baseCommit = await gh(token, `/repos/${REPO}/git/commits/${baseSha}`);
    const tree = [];
    for (const c of changes) {
      const blob = await gh(token, `/repos/${REPO}/git/blobs`, {
        method: 'POST', body: JSON.stringify({ content: c.content, encoding: 'utf-8' }),
      });
      tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const newTree = await gh(token, `/repos/${REPO}/git/trees`, {
      method: 'POST', body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
    });
    const commit = await gh(token, `/repos/${REPO}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message:
          `copy(live-edit): "${row.new_text.replace(/\s+/g, ' ').slice(0, 60)}"\n\n` +
          `SOMA §17 in-place edit made canonical on ${row.route}.\n` +
          `was: ${row.original_text.replace(/\s+/g, ' ').slice(0, 200)}\n` +
          `now: ${row.new_text.replace(/\s+/g, ' ').slice(0, 200)}\n` +
          `override: ${row.id}\n`,
        tree: newTree.sha, parents: [baseSha],
      }),
    });
    try {
      await gh(token, `/repos/${REPO}/git/refs/heads/${BRANCH}`, {
        method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }),
      });
    } catch (e) {
      // Someone else moved the branch between our read and our write. Nothing
      // was published; the row stays a draft, and saying so beats clobbering.
      if (String(e.message).includes('-> 422')) {
        return json(409, { ok: false, error: 'the site changed while publishing — publish again' });
      }
      throw e;
    }
    sha = commit.sha;
  }

  // A retry after a lost response finds the source already saying the new
  // words. That is a source that has caught up (read back, not assumed), so it
  // retires the row like a fresh commit would.
  const caughtUp = !sha && skipped.find((s) => s.endsWith(':already-applied'));

  // Once the commit lands the source has genuinely caught up, so the row goes
  // straight to `retired` (§17a R4: and it is never promotable again). The
  // build that publishes it takes about a minute after the push.
  await sb(`/rest/v1/copy_overrides?id=eq.${encodeURIComponent(body.id)}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify(
      sha || caughtUp
        ? { status: 'retired', canonical_at: new Date().toISOString(),
            retired_at: new Date().toISOString(), note: sha ? `commit:${sha}` : caughtUp }
        : { status: 'canonical', canonical_at: new Date().toISOString(),
            note: `pending:${skipped.join(', ')}` }
    ),
  });

  return json(200, {
    ok: true, committed: Boolean(sha), sha, alreadyApplied: Boolean(caughtUp),
    files: changes.map((c) => c.path), skipped,
    reason: changes.length ? null : (skipped.join(', ') || 'no candidate files'),
  });
};

// Functions 2.0 path routing: function paths are matched before redirects.
export const config = { path: '/api/copy-canonize' };

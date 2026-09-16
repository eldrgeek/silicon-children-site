/* feedback — the guide widget's "report" pane, forwarded to the SOMA feedback service.
 *
 * public/soma-manager.js posts { type, message, page } to
 * /.netlify/functions/feedback. That function never existed on this site, so
 * every report 404ed, and the widget still said "Received — thank you!"
 * because it does not check the response. This adapter makes the endpoint
 * real: it maps the widget's shape onto the feedback service's JSON (which
 * requires `text`) and forwards it through the same upstream the chip's
 * same-origin proxy uses (SOMA_FEEDBACK_ENDPOINT, see soma-feedback.cjs).
 *
 * It never sets `kind`: the service only accepts that from a human correcting
 * its classifier, and inventing one here would bypass that rule.
 *
 * Added 2026-09-16 (Mike Wolf's estate; Claude Opus 5, CCc).
 */

const SITE = 'silicon-children-site';

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'POST only' });

  const upstream = process.env.SOMA_FEEDBACK_ENDPOINT;
  if (!upstream) return json(503, { ok: false, error: 'SOMA_FEEDBACK_ENDPOINT is not set on this deploy' });

  let body;
  try { body = await req.json(); } catch { return json(400, { ok: false, error: 'bad json' }); }
  const message = String(body?.message || '').trim();
  if (!message) return json(400, { ok: false, error: 'message is required' });

  let path = '';
  try { path = new URL(String(body.page || '')).pathname; } catch { /* keep empty */ }
  const type = String(body.type || 'report').trim().slice(0, 40);

  let res;
  try {
    res = await fetch(upstream, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `[guide widget: ${type}] ${message}`,
        site: SITE,
        page: path,
        url: String(body.page || '').slice(0, 500),
        area: 'guide-widget',
      }),
    });
  } catch (e) {
    return json(502, { ok: false, error: 'feedback service unreachable' });
  }
  const out = await res.text();
  return new Response(out || JSON.stringify({ ok: res.ok }), {
    status: res.status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};

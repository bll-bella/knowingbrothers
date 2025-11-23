export const onRequest = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const acceptHeader = request.headers.get("accept") || "";
  const ua = request.headers.get("user-agent") || "";

  // -- If this request has our internal header, just fetch normally (avoid loop)
  if (request.headers.get("x-rewrite-bypass") === "1") {
    return fetch(request);
  }

  // =================================================
  // Episode pattern: accept with or without .html
  // /knowing-bros-eps-509  OR  /knowing-bros-eps-509.html
  // =================================================
  const epPattern = /^\/knowing-bros-eps-(\d+)(?:\.html)?$/;
  const epMatch = url.pathname.match(epPattern);

  if (epMatch) {
    const id = epMatch[1];

    // ---- 1) If crawler/social preview -> return SSR OG page (so share previews work)
    // Detect common social crawlers by User-Agent or Accept header.
    const isCrawler =
      /facebookexternalhit|Twitterbot|Slackbot|discordbot|WhatsApp|LinkedInBot|bingbot|googlebot/i.test(ua) ||
      acceptHeader.includes("text/html") && /curl|Wget|PostmanRuntime/i.test(ua) === false && (ua === "" || ua.includes("bot") || ua.includes("Bot"));

    if (isCrawler) {
      // Fetch metadata from Google Sheet (secret kept here)
      const sheetURL = "https://docs.google.com/spreadsheets/d/12kQqrG2P-xUfiVS6w5hxEV-eprn7EuIWfS5IC981cd8/gviz/tq?tqx=out:json&gid=0";
      let data = [];
      try {
        const r = await fetch(sheetURL);
        data = await r.json();
      } catch (e) {
        // ignore, fallback below
      }

      const ep = data.find(item => String(item.Episode) === id);
      const title = ep?.Title || `Knowing Bros Episode ${id}`;
      const desc = ep?.Description || "";
      const img = ep?.Image || "https://knowingbrothers.pages.dev/default.jpg";

      const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8"/>
    <title>${escapeHtml(title)}</title>
    <meta property="og:title" content="${escapeHtml(title)}"/>
    <meta property="og:description" content="${escapeHtml(desc)}"/>
    <meta property="og:image" content="${escapeHtml(img)}"/>
    <meta property="og:type" content="article"/>
    <meta name="twitter:card" content="summary_large_image"/>
    <meta http-equiv="refresh" content="0;url=/episode.html?id=${id}"/>
  </head>
  <body>Redirecting…</body>
</html>`;

      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    // ---- 2) Normal browser: REWRITE (serve content of episode.html?id=... without redirect)
    const targetUrl = new URL(`${url.origin}/episode.html`);
    targetUrl.searchParams.set("id", id);

    // Create new request to origin but include header so middleware will bypass and avoid recursion
    const newReq = new Request(targetUrl.toString(), {
      method: request.method,
      headers: new Headers([...request.headers, ["x-rewrite-bypass", "1"]]),
      body: request.body,
      redirect: "manual"
    });

    // Fetch the actual static page and return it (this keeps the pretty URL in the browser)
    return fetch(newReq);
  }

  // =================================================
  // Category rewrite: /category/allday-project -> /category.html?cat=ALLDAY PROJECT
  // Accept with or without trailing slash
  // =================================================
  const catPattern = /^\/category\/(.+?)(?:\/)?$/;
  const catMatch = url.pathname.match(catPattern);
  if (catMatch) {
    const raw = decodeURIComponent(catMatch[1] || "");
    const formatted = raw.replace(/-/g, " ").toUpperCase();
    const target = `${url.origin}/category.html?cat=${encodeURIComponent(formatted)}`;

    // Use rewrite (not redirect) so browser address bar stays /category/...
    const newReq = new Request(target, {
      method: request.method,
      headers: new Headers([...request.headers, ["x-rewrite-bypass", "1"]]),
      body: request.body,
      redirect: "manual"
    });
    return fetch(newReq);
  }

  // For any other requests, continue normal processing (let Pages serve)
  return fetch(request);
};

// small helper to escape HTML in templates
function escapeHtml(s) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// functions/_middleware.js
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const accept = request.headers.get("accept") || "";

  // -------- helpers --------
  const slugToName = s => decodeURIComponent(s).replace(/-/g, " ").replace(/\.+/g, "").trim();
  const shouldServeOg = (reqAccept) => reqAccept.includes("text/html");

  // -------- 1) CATEGORY OG + REWRITE ----------
  // /category/kpop-idol  -> category page
  const catMatch = path.match(/^\/category\/(.+)$/i);
  if (catMatch) {
    const slug = catMatch[1];
    const catName = slugToName(slug);

    // If request appears to be for HTML (crawler / browser), return OG HTML preview
    if (shouldServeOg(accept)) {
      // Customize OG image url if you have pattern
      const ogImage = `https://www.knowingbrothers.web.id/assets/og-category-default.jpg`;

      const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta property="og:title" content="Kategori: ${escapeHtml(catName)}">
  <meta property="og:description" content="Kumpulan episode Knowing Bros kategori ${escapeHtml(catName)}">
  <meta property="og:image" content="${ogImage}">
  <meta name="robots" content="index, follow">
  <title>Kategori: ${escapeHtml(catName)}</title>
</head>
<body>
<script>location.replace("/category.html?cat=${encodeURIComponent(catName)}");</script>
</body>
</html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" }});
    }

    // For normal requests, rewrite internally to category.html?cat=<name>
    const newUrl = new URL(request.url);
    newUrl.pathname = "/category.html";
    newUrl.searchParams.set("cat", catName);
    // forward to next handler (serve the static file) with modified URL
    return next(new Request(newUrl.toString(), request));
  }

  // -------- 2) EPISODE OG + REWRITE ----------
  // /knowing-bros-eps-123.html -> episode.html?id=123
  const epMatch = path.match(/^\/knowing-bros-eps-(\d+)\.html$/i);
  if (epMatch) {
    const id = epMatch[1];

    if (shouldServeOg(accept)) {
      // Fetch Google Sheet (your existing sheet->json endpoint)
      // Replace with your actual Google Sheet JSON endpoint
      const sheetUrl = "https://docs.google.com/spreadsheets/d/12kQqrG2P-xUfiVS6w5hxEV-eprn7EuIWfS5IC981cd8/gviz/tq?tqx=out:json&gid=0";

      try {
        const sres = await fetch(sheetUrl);
        const sheetData = await sres.json();
        // sheetData expected: array of episode objects with fields Episode, Title, Description, Image, BintangTamu
        const ep = Array.isArray(sheetData) ? sheetData.find(x => String(x.Episode) === String(id)) : null;

        const ogTitle = ep ? (ep.Title || `Knowing Bros episode ${id}`) : `Knowing Bros episode ${id}`;
        const ogDesc = ep ? (ep.Description || "") : "";
        const ogImg = ep ? (ep.Image || `/images/knowing-bros-thumbnail.webp`) : `https://www.knowingbrothers.web.id/images/knowing-bros-thumbnail.webp`;

        const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDesc)}">
  <meta property="og:image" content="${ogImg}">
  <meta property="og:type" content="article">
  <meta name="robots" content="index, follow">
  <title>${escapeHtml(ogTitle)}</title>
</head>
<body>
<script>location.replace("/episode.html?id=${encodeURIComponent(id)}");</script>
</body>
</html>`;
        return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" }});
      } catch (err) {
        // fallback: redirect to episode.html
        const fallbackUrl = new URL(request.url);
        fallbackUrl.pathname = "/episode.html";
        fallbackUrl.searchParams.set("id", id);
        return next(new Request(fallbackUrl.toString(), request));
      }
    }

    // For normal browser requests (non-crawler), rewrite to real file
    const newUrl = new URL(request.url);
    newUrl.pathname = "/episode.html";
    newUrl.searchParams.set("id", id);
    return next(new Request(newUrl.toString(), request));
  }

  // -------- 3) PROTECT FILES (OPTIONAL) ----------
  // Jika ingin "hide" akses langsung ke file asli, balas 404 untuk akses langsung.
  // Tapi hati-hati: jika kamu memblokir episode.html/category.html, worker harus tetap
  // bisa serve ulang mereka via internal next(new Request(...)) — di atas kita mengakses via next()
  // sehingga halaman tetap bisa di-serve. Kita hanya cegah jika user langsung request /episode.html tanpa query.
  // const protectedExact = ["/episode.html", "/category.html", "/script.js", "/data.js"];
  // if (protectedExact.includes(path)) {
    // Jika ada query param yang kita-set (internal rewrite), izinkan via next; tapi user direct -> 404
    // Simpel: jika request berasal dari browser direct (has referer absent and no query), block
  //   const hasQuery = !!(url.search && url.search.length > 1);
  //   if (!hasQuery) {
  //     return new Response("Not Found", { status: 404 });
  //   }
    // otherwise let it through (next)
  // }

  // -------- 4) DEFAULT: lanjutkan normal (serve static asset) ----------
  return next(request);
}


// -------- small helper to escape text inserted into HTML ----------
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const accept = request.headers.get("accept") || "";

  // Helper
  const slugToName = s => decodeURIComponent(s).replace(/-/g, " ").trim();
  const isCrawler = () => accept.includes("text/html");

  // ==== CATEGORY REWRITE ====
  // /category/kpop-idol → /category.html?cat=kpop idol
  const catMatch = path.match(/^\/category\/(.+)$/i);
  if (catMatch) {
    const catSlug = catMatch[1];
    const catName = slugToName(catSlug);

    if (isCrawler()) {
      // Simple OG (tanpa fetch)
      const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta property="og:title" content="Kategori: ${catName}" />
        <meta property="og:description" content="Kumpulan episode Knowing Bros kategori ${catName}" />
        <meta property="og:image" content="https://knowingbrothers.web.id/default-og.jpg" />
      </head>
      <body>
        <script>location.replace("/category.html?cat=${encodeURIComponent(catName)}")</script>
      </body>
      </html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    // Browser: rewrite URL ke file aslinya
    const newUrl = new URL(request.url);
    newUrl.pathname = "/category.html";
    newUrl.searchParams.set("cat", catName);
    return next(new Request(newUrl, request));
  }

  // ==== EPISODE REWRITE ====
  // /knowing-bros-eps-507.html → /episode.html?id=507
  const epMatch = path.match(/^\/knowing-bros-eps-(\d+)\.html$/i);
  if (epMatch) {
    const id = epMatch[1];

    if (isCrawler()) {
      const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta property="og:title" content="Knowing Bros Episode ${id}" />
        <meta property="og:description" content="Nonton Knowing Bros Episode ${id}" />
        <meta property="og:image" content="https://knowingbrothers.web.id/eps-${id}.jpg" />
      </head>
      <body>
        <script>location.replace("/episode.html?id=${id}")</script>
      </body>
      </html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    const newUrl = new URL(request.url);
    newUrl.pathname = "/episode.html";
    newUrl.searchParams.set("id", id);
    return next(new Request(newUrl, request));
  }

  // === DEFAULT ===
  return next(request);
}

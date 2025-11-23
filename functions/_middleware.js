export const onRequest = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const acceptHeader = request.headers.get("accept") || "";

  // =========================================================
  // 1️⃣ EPISODE REWRITE
  // /knowing-bros-eps-509.html → /episode.html?id=509
  // =========================================================
  const epPattern = /^\/knowing-bros-eps-(\d+)\.html$/;
  const epMatch = url.pathname.match(epPattern);

  // First: Handle OG rendering ONLY if mafia like FB, Twitter, Telegram
  if (epMatch && acceptHeader.includes("text/html")) {
    const id = epMatch[1];

    // 🍀 Fetch Google Sheet once from Worker(not exposed on frontend)
    const sheetURL = "GANTI_DENGAN_GOOGLE_SHEET_JSON_URL";
    let data = [];

    try {
      const res = await fetch(sheetURL);
      data = await res.json();
    } catch (e) {}

    const ep = data.find(item => String(item.Episode) === id);

    const title = ep?.Title || `Knowing Bros Episode ${id}`;
    const desc = ep?.Description || "";
    const img = ep?.Image || "https://knowingbrothers.pages.dev/default.jpg";

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>

        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${desc}">
        <meta property="og:image" content="${img}">
        <meta property="og:type" content="article">
        <meta name="twitter:card" content="summary_large_image">

        <meta http-equiv="refresh" content="0;url=/episode.html?id=${id}">
      </head>
      <body>Redirecting...</body>
    </html>
    `.trim();

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  // If NOT crawler → redirect normally
  if (epMatch) {
    const id = epMatch[1];
    return Response.redirect(`${url.origin}/episode.html?id=${id}`, 301);
  }

  // =========================================================
  // 2️⃣ CATEGORY REWRITE
  // /category/allday-project → /category.html?cat=ALLDAY PROJECT
  // =========================================================
  const catPattern = /^\/category\/(.+)$/;
  const catMatch = url.pathname.match(catPattern);

  if (catMatch) {
    const decoded = decodeURIComponent(catMatch[1])
      .replace(/-/g, " ")
      .toUpperCase();

    return Response.redirect(
      `${url.origin}/category.html?cat=${encodeURIComponent(decoded)}`,
      301
    );
  }

  // =========================================================
  // 3️⃣ PROTECT SENSITIVE JS (Option C Style)
  // script-secure.js → only API calls allowed
  // =========================================================
  if (url.pathname.endsWith("/script.js")) {
    // Block direct access except if request came from your domain
    const referer = request.headers.get("referer") || "";

    if (!referer.includes(url.origin)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return next();
};

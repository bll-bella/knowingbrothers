export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const ua = request.headers.get("user-agent") || "";
  const isBot = /(facebook|twitterbot|linkedinbot|whatsapp|telegram|discordbot|bingbot|googlebot)/i.test(ua);

  // pretty link pattern
  const epMatch = pathname.match(/^\/knowing-bros-eps-(\d+)\.html$/);
  if (epMatch) {
    const id = epMatch[1];

    if (isBot) {
      // FETCH data dari Google Sheets
      const sheetURL = "https://script.google.com/macros/s/AKfycbwWlea_SjngQGs3UlNC9LT99LQlKhXsAqbjBY4Zm2KtqO3_LwuckoOiYb54W9P_7khO/exec";
      let data = [];
      try {
        const res = await fetch(sheetURL);
        data = await res.json();
      } catch (e) {
        // fallback
      }
      const ep = data.find(e => String(e.Episode) === id);
      const ogTitle = ep?.Title || `Knowing Bros Episode ${id}`;
      const ogDesc  = ep?.Description || "";
      const ogImg   = ep?.Image || "/images/knowing-bros-thumbnail.webp";

      const html = `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <title>${ogTitle}</title>
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:image" content="${ogImg}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="refresh" content="0;url=/episode.html?id=${id}" />
  </head>
  <body>Redirecting…</body>
</html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    } else {
      // user biasa: redirect ke query version
      return Response.redirect(`${url.origin}/episode.html?id=${id}`, 301);
    }
  }

  // For query version, maybe handle bots too
  if (pathname === "/episode.html" && url.searchParams.has("id")) {
    const id = url.searchParams.get("id");
    if (isBot) {
      // OPTIONAL: same OG generation for query URL
      const sheetURL = "https://script.google.com/macros/s/AKfycbwWlea_SjngQGs3UlNC9LT99LQlKhXsAqbjBY4Zm2KtqO3_LwuckoOiYb54W9P_7khO/exec";
      let data = [];
      try {
        const res = await fetch(sheetURL);
        data = await res.json();
      } catch (e) {}
      const ep = data.find(e => String(e.Episode) === id);
      const ogTitle = ep?.Title || `Knowing Bros Episode ${id}`;
      const ogDesc = ep?.Description || "";
      const ogImg  = ep?.Image || "/images/knowing-bros-thumbnail.webp";

      const html = `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <title>${ogTitle}</title>
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    <meta property="og:image" content="${ogImg}" />
    <meta property="og:type" content="article" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta http-equiv="refresh" content="0;url=/episode.html?id=${id}" />
  </head>
  <body>Redirecting…</body>
</html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
  }

  return next();
}

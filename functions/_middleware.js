export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Regex pattern for pretty links:
  const episodeMatch = pathname.match(/\/knowing-bros-eps-(\d+)\.html$/);

  // Detect if request is from social bot (to serve OG metadata instead of redirect)
  const ua = context.request.headers.get("user-agent") || "";
  const isBot = /(facebook|twitterbot|telegram|linkedin|discord|whatsapp|googlebot|bingbot|slackbot)/i.test(ua);

  if (episodeMatch) {
    const id = episodeMatch[1];

    // If crawler → serve OG metadata snapshot
    if (isBot) {
      const sheetURL = "https://docs.google.com/spreadsheets/d/12kQqrG2P-xUfiVS6w5hxEV-eprn7EuIWfS5IC981cd8/gviz/tq?tqx=out:json&gid=0";
      const res = await fetch(sheetURL);
      const data = await res.json();
      const ep = data.find(e => String(e.Episode) === id);

      const ogTitle = ep?.Title || `Knowing Bros Episode ${id}`;
      const ogDesc = ep?.Description || "";
      const ogImg = ep?.Image || "/images/knowing-bros-thumbnail.webp";

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${ogTitle}</title>
        <meta property="og:title" content="${ogTitle}">
        <meta property="og:description" content="${ogDesc}">
        <meta property="og:image" content="${ogImg}">
        <meta property="og:type" content="article">
      </head>
      <body></body>
      </html>
      `;

      return new Response(html, {
        headers: { "content-type": "text/html" }
      });
    }

    // Normal user → canonical redirect
    return Response.redirect(`${url.origin}/episode.html?id=${id}`, 301);
  }

  return context.next();
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // If not /episode, do nothing
  if (url.pathname !== "/episode") return context.next();

  const id = url.searchParams.get("id");
  if (!id) return context.next();

  const sheetURL = "https://script.google.com/macros/s/AKfycbwWlea_SjngQGs3UlNC9LT99LQlKhXsAqbjBY4Zm2KtqO3_LwuckoOiYb54W9P_7khO/exec";
  let data = [], ep = null;
  try {
    const res = await fetch(sheetURL);
    data = await res.json();
    ep = Array.isArray(data) ? data.find(e => String(e.Episode) === id) : null;
  } catch (err) {}

  const site = url.origin;
  const ogTitle = ep?.Title ? escapeHTML(ep.Title) : "Knowing Bros Episode";
  const ogDesc = ep?.Description ? escapeHTML(ep.Description) : "";
  const imageUrl = ep?.Image || "/images/knowing-bros-thumbnail.webp";
  const ogImg = imageUrl.startsWith("http") ? imageUrl : `${site}${imageUrl}`;

  // ======= Bot detection =======
  const ua = context.request.headers.get('user-agent') || '';
  const isBot = /(facebookexternalhit|twitterbot|linkedinbot|discordbot|slackbot|googlebot|bingbot|WhatsApp|Telegram)/i.test(ua);

  if (!isBot) {
    // Regular users are redirected to episode.html
    return Response.redirect(`${site}/episode.html?id=${encodeURIComponent(id)}`, 302);
  }

  // Bots/crawlers receive OG tags
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta property="og:title" content="${ogTitle}">
      <meta property="og:description" content="${ogDesc}">
      <meta property="og:image" content="${ogImg}">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta name="twitter:card" content="summary_large_image">
      <title>${ogTitle}</title>
    </head>
    <body>
      <p>This page is for social sharing and bot preview only.</p>
    </body>
    </html>
  `;
  return new Response(html, {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname.startsWith("/episode")) {
    const id = url.searchParams.get("id");

    if (!id) return context.next();

    const sheetURL = "https://script.google.com/macros/s/AKfycbwWlea_SjngQGs3UlNC9LT99LQlKhXsAqbjBY4Zm2KtqO3_LwuckoOiYb54W9P_7khO/exec";
    const res = await fetch(sheetURL);
    const data = await res.json();
    const ep = data.find(e => String(e.Episode) === id);

    const site = url.origin;

    const ogTitle = ep?.Title ?? "Knowing Bros Episode";
    const ogDesc = ep?.Description ?? "";
    const ogImg = ep?.Image ? `${site}${ep.Image}` : `${site}/images/knowing-bros-thumbnail.webp`;

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
      </head>
      <body>
          <script>
            location.href = "${site}/episode.html?id=${id}";
          </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  }

  return context.next();
}
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // ⛔ Abaikan SEMUA file statis
  if (
    path.match(/\.(html|css|js|png|jpg|jpeg|webp|gif|svg|ico|json|xml|txt|map)$/)
  ) {
    return context.next();
  }

  // ⛔ Abaikan folder static
  if (
    path.startsWith("/images") ||
    path.startsWith("/assets") ||
    path.startsWith("/static")
  ) {
    return context.next();
  }

  // ✅ Tangani hanya /episode?id=
  if (path === "/episode") {
    const id = url.searchParams.get("id");
    if (!id) return context.next();

    const sheetURL = "https://script.google.com/macros/s/AKfycbwWlea_SjngQGs3UlNC9LT99LQlKhXsAqbjBY4Zm2KtqO3_LwuckoOiYb54W9P_7khO/exec"; // sama seperti sebelumnya
    const res = await fetch(sheetURL);
    const data = await res.json();

    const ep = data.find(e => String(e.Episode) === id);

    const site = url.origin;

    const html = `
      <!DOCTYPE html>
      <html><head>
        <meta charset="UTF-8">
        <meta property="og:title" content="${ep?.Title || "Knowing Bros Episode"}">
        <meta property="og:description" content="${ep?.Description || ""}">
        <meta property="og:image" content="${ep?.Image ? site + ep.Image : site + "/images/knowing-bros-thumbnail.webp"}">
      </head>
      <body>
        <script>
          location.href = "${site}/episode.html?id=${id}";
        </script>
      </body></html>
    `;

    return new Response(html, {
      headers: { "content-type": "text/html" },
    });
  }

  return context.next();
}

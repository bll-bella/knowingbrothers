export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ================================
    // 1. REWRITE EPISODE URL
    // /knowing-bros-eps-1.html → /episode.html?id=1
    // ================================
    const epMatch = path.match(/^\/knowing-bros-eps-(\d+)\.html$/);
    if (epMatch) {
      const id = epMatch[1];
      return env.ASSETS.fetch(`https://${url.host}/episode.html?id=${id}`, request);
    }

    // ================================
    // 2. REWRITE CATEGORY URL
    // /category/kpop-idol → /category.html?cat=kpop idol
    // ================================
    const catMatch = path.match(/^\/category\/(.+)$/);
    if (catMatch) {
      const slug = catMatch[1];
      const cat = slug.replace(/-/g, " ").toLowerCase();
      return env.ASSETS.fetch(`https://${url.host}/category.html?cat=${cat}`, request);
    }

    // ================================
    // 3. OG AUTO UNTUK EPISODE
    // Mengambil data via GOOGLE SHEET (script lama yg sudah kamu pakai)
    // ================================
    if (epMatch && request.headers.get("accept")?.includes("text/html")) {
      const id = epMatch[1];

      // === FETCH DATA GOOGLE SHEETS ===
      const sheetURL = "https://docs.google.com/spreadsheets/d/12kQqrG2P-xUfiVS6w5hxEV-eprn7EuIWfS5IC981cd8/gviz/tq?tqx=out:json";   // ← GANTI 1X SAJA sesuai script lamamu
      const res = await fetch(sheetURL);
      const data = await res.json();
      const ep = data.find(e => String(e.Episode) === id);

	const ogTitle = ep ? ep.Title : "Knowing Bros episode ${id}";
      const ogDesc = ep ? (ep.Description || "") : "";
      const ogImg = ep ? ep.Image : "/images/knowing-bros-thumbnail.webp";

      const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8" />
            <meta property="og:title" content="${ogTitle}">
            <meta property="og:description" content="${ogDesc}">
            <meta property="og:image" content="${ogImg}">
            <meta property="og:type" content="article">
        </head>
        <body>
            <script>
              location.href = "/episode.html?id=${id}";
            </script>
        </body>
        </html>
      `;

      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ================================
    // 4. OG AUTO CATEGORY (VERSI SIMPLE)
    // ================================
    if (catMatch && request.headers.get("accept")?.includes("text/html")) {
      const slug = catMatch[1];
      const catName = slug.replace(/-/g, " ");

      const html = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta property="og:title" content="Knowing Bros episode ${catName}">
          <meta property="og:description" content="Episode Knowing Bros kategori ${catName}">
          <meta property="og:image" content="https://yourdomain.com/default-category.jpg">
        </head>
        <body>
          <script>
            location.href = "/category.html?cat=${catName}";
          </script>
        </body>
        </html>
      `;

      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    // ================================
    // 5. SEMBUNYIKAN FILE ASLI (JS/HTML) DARI PUBLIC ACCESS
    // ================================
    const protectedFiles = [
      "/episode.html",
      "/category.html",
      "/script.js",
      "/data.js"
    ];

    if (protectedFiles.includes(path)) {
      return new Response("Not Found", { status: 404 });
    }

    // ================================
    // 6. SERVE STATIC FILES DEFAULT
    // ================================
    return env.ASSETS.fetch(request);
  }
};

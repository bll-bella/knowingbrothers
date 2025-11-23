export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);

  // Ignore worker behavior for assets/data/scripts to prevent breaking UI
  if (
    url.pathname.match(/\.(js|css|json|png|jpg|jpeg|webp|svg|gif|ico)$/) ||
    url.pathname.startsWith("/assets") ||
    url.pathname.startsWith("/data") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/images") ||
    url.pathname.startsWith("/scripts") ||
    url.pathname.startsWith("/css")
  ) {
    return next();
  }

  // === 1️⃣ Redirect old style ?id=xxx → pretty URL ===
  if (url.pathname === "/episode.html" && url.searchParams.get("id")) {
    const id = url.searchParams.get("id");
    return new Response(null, {
      status: 301,
      headers: {
        location: `/knowing-bros-eps-${id}.html`,
      },
    });
  }

  // === 2️⃣ Rewrite pretty URL → real internal file ===
  const epMatch = url.pathname.match(/^\/knowing-bros-eps-(\d+)\.html$/);
  if (epMatch) {
    const id = epMatch[1];
    const newUrl = `${url.origin}/episode.html?id=${id}`;
    return next(new Request(newUrl, request));
  }

  // === 3️⃣ Category redirect old → pretty ===
  if (url.pathname === "/category.html" && url.searchParams.get("cat")) {
    const cat = url.searchParams.get("cat");
    const newSlug = cat.toLowerCase().replace(/\s+/g, "-");
    return new Response(null, {
      status: 301,
      headers: {
        location: `/category/${newSlug}`,
      },
    });
  }

  // === 4️⃣ Rewrite pretty → real category ===
  const catMatch = url.pathname.match(/^\/category\/(.+)$/);
  if (catMatch) {
    const catName = decodeURIComponent(catMatch[1].replace(/-/g, " "));
    const newUrl = `${url.origin}/category.html?cat=${encodeURIComponent(catName)}`;
    return next(new Request(newUrl, request));
  }

  return next();
};

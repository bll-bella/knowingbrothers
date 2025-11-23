export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const params = url.searchParams;

  // ===========================
  // 1) EPISODE: redirect Jelek → Cantik
  // ===========================
  if (path === "/episode.html" && params.has("id")) {
    const id = params.get("id");
    return Response.redirect(
      `${url.origin}/knowing-bros-eps-${id}.html`,
      301
    );
  }

  // ===========================
  // 2) CATEGORY redirect Jelek → Cantik
  // ===========================
  if (path === "/category.html" && params.has("cat")) {
    const cat = params.get("cat");
    const slug = cat.toLowerCase().replace(/\s+/g, "-");
    return Response.redirect(`${url.origin}/category/${slug}`, 301);
  }

  // ===========================
  // 3) Episode URL Cantik → Tampilkan konten asli
  // ===========================
  const epMatch = path.match(/^\/knowing-bros-eps-(\d+)\.html$/);
  if (epMatch) {
    const id = epMatch[1];
    const newUrl = new URL(request.url);
    newUrl.pathname = "/episode.html";
    newUrl.searchParams.set("id", id);
    return next(new Request(newUrl, request));
  }

  // ===========================
  // 4) Category Cantik → Tampilkan konten asli
  // ===========================
  const catMatch = path.match(/^\/category\/(.+)$/);
  if (catMatch) {
    const slug = catMatch[1];
    const cat = slug.replace(/-/g, " ");
    const newUrl = new URL(request.url);
    newUrl.pathname = "/category.html";
    newUrl.searchParams.set("cat", cat);
    return next(new Request(newUrl, request));
  }

  // Default serve
  return next();
}

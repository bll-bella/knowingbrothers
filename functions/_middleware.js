// functions/_middleware.js
export async function onRequest(context) {
  const { request, next } = context;
  const reqUrl = new URL(request.url);
  const path = reqUrl.pathname;
  const params = reqUrl.searchParams;

  // helper: slugify category -> "All Day Project" -> "all-day-project"
  const slugify = (s = "") =>
    String(s)
      .toLowerCase()
      .trim()
      .replace(/\.+/g, "")               // remove dots
      .replace(/[^a-z0-9\s-]/g, "")      // remove non-alnum except spaces
      .replace(/\s+/g, "-");             // spaces -> hyphen

  // -----------------------
  // 1) UGLY -> PRETTY (Redirect)
  // -----------------------

  // episode.html?id=509  -> redirect to /knowing-bros-eps-509.html
  if (path === "/episode.html" && params.has("id")) {
    const id = params.get("id");
    const target = `${reqUrl.origin}/knowing-bros-eps-${encodeURIComponent(id)}.html`;
    return Response.redirect(target, 301);
  }

  // category.html?cat=ALLDAY PROJECT -> redirect to /category/allday-project
  if (path === "/category.html" && params.has("cat")) {
    const cat = params.get("cat");
    const slug = slugify(cat);
    const target = `${reqUrl.origin}/category/${slug}`;
    return Response.redirect(target, 301);
  }

  // -----------------------
  // 2) PRETTY -> INTERNAL REWRITE (serve original files)
  // -----------------------

  // /knowing-bros-eps-509.html -> serve /episode.html?id=509 internally
  const epMatch = path.match(/^\/knowing-bros-eps-(\d+)\.html$/i);
  if (epMatch) {
    const id = epMatch[1];
    const newUrl = new URL(request.url);
    newUrl.pathname = "/episode.html";
    newUrl.searchParams.set("id", id);
    // Use next() with modified Request so Pages serves the existing episode.html with ?id=...
    return next(new Request(newUrl.toString(), request));
  }

  // /category/allday-project -> serve /category.html?cat=all day project internally
  const catMatch = path.match(/^\/category\/([^\/]+)\/?$/i);
  if (catMatch) {
    const slug = catMatch[1];
    const catName = decodeURIComponent(slug).replace(/-/g, " ");
    const newUrl = new URL(request.url);
    newUrl.pathname = "/category.html";
    newUrl.searchParams.set("cat", catName);
    return next(new Request(newUrl.toString(), request));
  }

  // -----------------------
  // 3) DEFAULT -> serve as normal (do not block assets)
  // -----------------------
  return next(request);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // === Redirect old URL style ===
  if (url.pathname === "/episode.html" && url.searchParams.get("id")) {
    const id = url.searchParams.get("id");
    return Response.redirect(`${url.origin}/knowing-bros-eps-${id}.html`, 301);
  }

  // === Rewrite Pretty URL → internal file ===
  const epMatch = url.pathname.match(/^\/knowing-bros-eps-(\d+)\.html$/);
  if (epMatch) {
    const id = epMatch[1];
    url.pathname = "/episode.html";
    url.searchParams.set("id", id);
    return context.env.ASSETS.fetch(url.toString(), context.request);
  }

  // === Category redirect ===
  if (url.pathname === "/category.html" && url.searchParams.get("cat")) {
    const cat = url.searchParams.get("cat");
    const slug = cat.toLowerCase().replace(/\s+/g, "-");
    return Response.redirect(`${url.origin}/category/${slug}`, 301);
  }

  // === Rewrite category ===
  const catMatch = url.pathname.match(/^\/category\/(.+)$/);
  if (catMatch) {
    const cat = decodeURIComponent(catMatch[1].replace(/-/g, " "));
    url.pathname = "/category.html";
    url.searchParams.set("cat", cat);
    return context.env.ASSETS.fetch(url.toString(), context.request);
  }

  // Default behavior: serve static file
  return context.env.ASSETS.fetch(context.request);
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Prevent recursive rewrite
  if (request.headers.get("x-rewrite")) {
    return next();
  }

  // -------------------------------------------
  // 1️⃣ If user opens OLD format → Redirect permanently to pretty URL
  //    /episode.html?id=507 → /knowing-bros-eps-507.html
  // -------------------------------------------
  if (url.pathname === "/episode.html" && url.searchParams.has("id")) {
    const id = url.searchParams.get("id");
    return Response.redirect(`${url.origin}/knowing-bros-eps-${id}.html`, 301);
  }

  // -------------------------------------------
  // 2️⃣ Pretty URL internal rewrite to real file
  //    /knowing-bros-eps-507 → episode.html?id=507
  // -------------------------------------------
  const epMatch = url.pathname.match(/^\/knowing-bros-eps-(\d+)(?:\.html)?$/);
  if (epMatch) {
    const id = epMatch[1];

    const target = new URL("/episode.html", url.origin);
    target.searchParams.set("id", id);

    const rewrittenReq = new Request(target, {
      method: request.method,
      headers: new Headers([...request.headers, ["x-rewrite", "1"]]),
      body: request.body,
    });

    return next(rewrittenReq);
  }

  // -------------------------------------------
  // 3️⃣ SAME Logic for category:
  // Redirect old → new
  // -------------------------------------------
  if (url.pathname === "/category.html" && url.searchParams.has("cat")) {
    const cat = url.searchParams.get("cat")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    return Response.redirect(`${url.origin}/category/${cat}`, 301);
  }

  const catMatch = url.pathname.match(/^\/category\/([^\/]+)\/?$/);
  if (catMatch) {
    const formatted = decodeURIComponent(catMatch[1])
      .replace(/-/g, " ")
      .toUpperCase();

    const target = new URL("/category.html", url.origin);
    target.searchParams.set("cat", formatted);

    const rewrittenReq = new Request(target, {
      method: request.method,
      headers: new Headers([...request.headers, ["x-rewrite", "1"]]),
      body: request.body,
    });

    return next(rewrittenReq);
  }

  return next();
}

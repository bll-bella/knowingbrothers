export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // -------------------------------------------
  // Prevent recursive execution
  // -------------------------------------------
  if (request.headers.get("x-rewrite")) {
    return next(); // bypass rewrite rules
  }

  // -------------------------------------------
  // Episode Pretty URL → /episode.html?id=507
  // Supports: /knowing-bros-eps-507 OR .html
  // -------------------------------------------
  const epMatch = url.pathname.match(/^\/knowing-bros-eps-(\d+)(?:\.html)?$/);
  if (epMatch) {
    const id = epMatch[1];

    // Create rewritten URL
    const target = new URL("/episode.html", url.origin);
    target.searchParams.set("id", id);

    // Make NEW request with bypass header
    const rewrittenReq = new Request(target, {
      headers: new Headers([...request.headers, ["x-rewrite", "1"]]),
      method: request.method,
      body: request.body,
      redirect: "manual",
    });

    return next(rewrittenReq);
  }

  // -------------------------------------------
  // Category Pretty URL → /category.html?cat=ALLDAY PROJECT
  // -------------------------------------------
  const catMatch = url.pathname.match(/^\/category\/([^\/]+)\/?$/);

  if (catMatch) {
    const formatted = decodeURIComponent(catMatch[1])
      .replace(/-/g, " ")
      .toUpperCase();

    const target = new URL("/category.html", url.origin);
    target.searchParams.set("cat", formatted);

    const rewrittenReq = new Request(target, {
      headers: new Headers([...request.headers, ["x-rewrite", "1"]]),
      method: request.method,
      body: request.body,
      redirect: "manual",
    });

    return next(rewrittenReq);
  }

  // Default → let CF serve normally
  return next();
}

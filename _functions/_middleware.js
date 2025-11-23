console.log("📌 Middleware reached for URL:", request.url);

export function onRequest(context) {
  const url = new URL(context.request.url);

  // Detect query format: /episode.html?id=500
  if (url.pathname === "/episode.html" && url.searchParams.has("id")) {
    const id = url.searchParams.get("id");
    return Response.redirect(`${url.origin}/knowing-bros-eps-${id}.html`, 301);
  }

  return context.next();
}

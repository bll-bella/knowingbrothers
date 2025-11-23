export function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/episode.html" && url.searchParams.has("id")) {
    const id = url.searchParams.get("id");
    return Response.redirect(`${url.origin}/knowing-bros-eps-${id}.html`, 301);
  }

  const match = url.pathname.match(/^\/knowing-bros-eps-(\d+)\.html$/);
  if (match) {
    url.pathname = "/episode.html";
    url.search = `?id=${match[1]}`;
    return context.next({ request: new Request(url) });
  }

  return context.next();
}

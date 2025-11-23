export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/episode.html" && url.searchParams.get("id")) {
    const id = url.searchParams.get("id");
    return Response.redirect(`${url.origin}/knowing-bros-eps-${id}.html`, 301);
  }

  return context.next();
}

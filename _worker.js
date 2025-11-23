export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Pretty URL redirect: /episode.html?id=91 → /knowing-bros-eps-91.html
    if (url.pathname === "/episode.html" && url.searchParams.has("id")) {
      const id = url.searchParams.get("id");
      return Response.redirect(`${url.origin}/knowing-bros-eps-${id}.html`, 301);
    }

    // Pretty URL reverse: user visits pretty link, but load original file
    const match = url.pathname.match(/^\/knowing-bros-eps-(\d+)\.html$/);
    if (match) {
      const id = match[1];
      url.pathname = "/episode.html";
      url.searchParams.set("id", id);
      return env.ASSETS.fetch(url.toString(), request);
    }

    // Default serve files
    return env.ASSETS.fetch(request);
  }
};

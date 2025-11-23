export default {
  async fetch(request, env, ctx) {

    const url = new URL(request.url);

    // PRETTY → REAL
    const episodeMatch = url.pathname.match(/^\/knowing-bros-eps-(\d+)\.html$/);
    if (episodeMatch) {
      url.pathname = `/episode.html`;
      url.searchParams.set("id", episodeMatch[1]);
      return Response.redirect(url.toString(), 302);
    }

    // REAL → PRETTY
    if (url.pathname === "/episode.html" && url.searchParams.get("id")) {
      const id = url.searchParams.get("id");
      const pretty = `${url.origin}/knowing-bros-eps-${id}.html`;
      return Response.redirect(pretty, 301);
    }

    return fetch(request);
  }
}

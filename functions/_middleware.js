export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);

  // ==== 1. Rewrite URL Episode ====
  const epMatch = url.pathname.match(/^\/knowing-bros-eps-(\d+)\.html$/);

  // Exclude requests ke asset, script, API, JSON, dll
  const ignorePatterns = [
    "/assets",
    "/scripts",
    "/js",
    "/css",
    "/images",
    "/data",
    "/api",
  ];

  if (
    epMatch &&
    !ignorePatterns.some((path) => url.pathname.startsWith(path)) &&
    !url.pathname.endsWith(".json") &&
    !url.pathname.endsWith(".js") &&
    !url.pathname.endsWith(".css")
  ) {
    const episodeId = epMatch[1];
    const newUrl = `${url.origin}/episode.html?id=${episodeId}`;

    return next(new Request(newUrl, request));
  }

  // ==== 2. Rewrite Category ====
  const catMatch = url.pathname.match(/^\/category\/(.+)$/);
  if (catMatch) {
    const catName = decodeURIComponent(catMatch[1].replace(/-/g, " "));
    const newUrl = `${url.origin}/category.html?cat=${encodeURIComponent(catName)}`;
    return next(new Request(newUrl, request));
  }

  return next();
};

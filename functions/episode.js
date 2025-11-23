export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  // If no id, return normally (prevent breaking ./episode.html access from scripts)
  if (!id) return new Response(null, { status: 404 });

  return new Response(null, {
    status: 301,
    headers: {
      location: `/knowing-bros-eps-${id}.html`,
    },
  });
}
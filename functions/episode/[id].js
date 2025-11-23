export async function onRequest(context) {
  const id = context.params.id;

  // --- Ambil data dari Google Sheet (HARUS disesuaikan URL-nya)
  const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6uiIBNafd9AschwXJHPgdsTS6ARFkOuyadYAgGS8CEPUdA7xqc-EUuAku6zEOR7QSsmQdWkBGVivP/pub?gid=0&single=true&output=csv";
  const res = await fetch(sheetURL);
  const csv = await res.text();

  // --- Parsing sangat sederhana (jangan ubah format CSV kamu!)
  const rows = csv.split("\n").map(r => r.split(","));
  const header = rows[0];
  const data = rows.slice(1).map(r => {
    let obj = {};
    header.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });

  const ep = data.find(x => x.Episode === id);

  // Kalau ID tidak ditemukan → fallback saja
  if (!ep) {
    return new Response("Episode not found", { status: 404 });
  }

  // --- OG META DINAMIS
  const title = ep.Title || `Knowing Bros eps ${id}`;
  const desc  = ep.Description || "";
  const image = ep.Image || "";

  // --- Ambil isi episode.html yang static
  const htmlFile = await context.env.ASSETS.fetch("/episode.html");
  let html = await htmlFile.text();

  // --- Sisipkan meta OG sebelum </head>
  const meta = `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="https://kbbaru.pages.dev/episode/${id}" />
  `;

  html = html.replace("</head>", meta + "\n</head>");

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}

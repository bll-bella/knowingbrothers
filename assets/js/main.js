document.getElementById('year').textContent = new Date().getFullYear();

const input = document.getElementById('searchInput');
const listEl = document.getElementById('guideList');
const countTag = document.getElementById('countTag');
const emptyState = document.getElementById('emptyState');
const paginationEl = document.querySelector('.pagination');

// Simpan tampilan asli halaman ini (10 episode sesuai pagination) supaya
// bisa dikembalikan saat kolom pencarian dikosongkan.
const originalRowsHTML = listEl.innerHTML;
const originalCount = listEl.querySelectorAll('.guide-row').length;

function pad(n) {
  return String(n).padStart(3, '0');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderRow(ep) {
  return `<li class="guide-row">
    <span class="tc">EP·${pad(ep.ep_num)}</span>
    <a href="episode/${ep.slug}.html" class="thumb"><img src="${ep.thumb}" alt="Thumbnail ${escapeHtml(ep.title)}" loading="lazy"></a>
    <a href="episode/${ep.slug}.html" class="info">
      <h3>${escapeHtml(ep.title)}</h3>
      <div class="guest">Bintang tamu: ${escapeHtml(ep.guest)}</div>
    </a>
    <a href="episode/${ep.slug}.html" class="go">Tonton</a>
  </li>`;
}

function runSearch(rawQuery) {
  const query = rawQuery.trim().toLowerCase();

  // Kosong: kembalikan tampilan normal (halaman ini) + pagination.
  if (query === '') {
    listEl.innerHTML = originalRowsHTML;
    emptyState.hidden = true;
    if (paginationEl) paginationEl.hidden = false;
    countTag.textContent = originalCount + ' episode';
    return;
  }

  // Ada query: cari di SEMUA episode (window.EPISODES), bukan cuma
  // yang tampil di halaman ini, lalu sembunyikan pagination sementara.
  if (paginationEl) paginationEl.hidden = true;

  const all = window.EPISODES || [];
  const matches = all.filter(ep => {
    const haystack = (ep.ep_num + ' ' + ep.title + ' ' + ep.guest).toLowerCase();
    return haystack.includes(query);
  });

  listEl.innerHTML = matches.map(renderRow).join('');
  emptyState.hidden = matches.length !== 0;
  countTag.textContent = matches.length + ' hasil ditemukan';
}

input.addEventListener('input', () => runSearch(input.value));
countTag.textContent = originalCount + ' episode';

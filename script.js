const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6uiIBNafd9AschwXJHPgdsTS6ARFkOuyadYAgGS8CEPUdA7xqc-EUuAku6zEOR7QSsmQdWkBGVivP/pub?gid=0&single=true&output=csv';

// Fetch and parse CSV
async function loadEpisodes() {
  const res = await fetch(SHEET_URL);
  const csv = await res.text();
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  console.log("Parsed data:", parsed.data); // check in console
  return parsed.data.reverse(); // newest first
}

function getEpisodeGroups(guest) {
  if (!guest) return [];

  const text = guest.trim();
  const upper = text.toUpperCase();

  // --- MASTER GROUP LIST ---
  const groups = [
    "10CM","(G)I-DLE","I-DLE","2AM","2PM","AOA","APINK","ARRC","AESPA","AKDONG MUSICIAN",
    "APRIL","ASTRO","BABY V.O.X","BABYMONSTER","B1A4","BILLLIE","BIGBANG","BIG MAMA",
    "BLACKPINK","BLACKSWAN","BLOCK B","BOL4","BRAVE GIRLS","BROWN EYED GIRLS","BTOB",
    "CELEBRITY FIVE","CNBLUE","COSMIC GIRLS","CRAVITY","DAVICHI","DAY6","DIA",
    "DONG DONG SHIN KI","EPIK HIGH","EVERGLOW","EXID","EXO","FIESTAR","FIFTY FIFTY",
    "F.T. ISLAND","FROMIS_9","GFRIEND","GIRL'S DAY","GIRLS GENERATION","GIRLS' GENERATION","GOLDEN CHILD",
    "GOT7","GUGUDAN","HELLO VENUS","HIGHLIGHT","H1-KEY","H.O.T","I.O.I","ILLIT","INFINITE",
    "IOI","IZONE","ITZY","IVE","IKON","KARA","KEP1ER","KISS OF LIFE","KOYOTE","LADIES CODE",
    "LABOUM","LE SSERAFIM","LOONA","LOTS OF ADVICE","LOVELYZ","MAMAMOO","MOMOLAND",
    "MONSTA X","NMIXX","NCT","NINE MUSES","NOEL","OH MY GIRL","PRODUCE 48","PRODUCE 101",
    "PSY","QUEENDOM 2","RED VELVET","S.E.S.","SECHS KIES","SECRET","SECRET NUMBER",
    "SEVENTEEN","SG WANNABE","SF9","SHINEE","SHINHWA","SISTAR","SISTAR19","SNSD","SOLID",
    "STAYC","STRAY KIDS","SUPER JUNIOR","SUPERM","TAEYEON","T-ARA","THE BOYZ","TRIPLES",
    "TREASURE","TWICE","TVXQ","UNIVERSE HIPSTERS","UP10TION","URBAN ZAKAPA","VIXX","VIVIZ",
    "WEI","WEKI MEKI","WJSN","WINNER","WOO!AH!","WANNA ONE","ZEROBASEONE","ZE:A","ALLDAY PROJECT"
  ];

  // --- ALIASES ---
  const aliasMap = {
    "SNSD": [
    "GIRLS GENERATION",
    "GIRLS' GENERATION",
    "SNSD"
  ],

  "(G)I-DLE": [
    "(G)I-DLE",
    "GIDLE",
    "GI-DLE",
    "I-DLE",
    "IDLE",
    "G I DLE",
   ]
  };
  
  function normalizeGroupName(name) {
  const upper = name.toUpperCase();
  for (const canonical in aliasMap) {
    if (aliasMap[canonical].includes(upper)) {
      return canonical;   // always output SNSD
    }
  }
  return name; // unchanged if not alias
}

  const found = new Set();

  // 1) Detect "Group (Members)"
  const groupBeforeBracket = text.match(/^([^,(]+)\s*\(/);
  if (groupBeforeBracket) {
    let g = groupBeforeBracket[1].trim().toUpperCase();
    if (groups.includes(g)) {
	  found.add(normalizeGroupName(g));
	}
  }

  // 2) Detect any group inside text
  for (const g of groups) {
    if (upper.includes(g)) {
	  found.add(normalizeGroupName(g));
	}
  }

  // 3) Detect "Name - Group"
  const dashSplit = text.split(/[-–]/);
  if (dashSplit.length > 1) {
    let g = dashSplit[1].trim().toUpperCase();
    if (groups.includes(g)) {
      (aliasMap[g] || [g]).forEach(x => found.add(x));
    }
  }

  return [...found];
}



function renderEpisodePage(episodes) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const ep = episodes.find(e => e.Episode === id);
  if (!ep) return;

  const epIndex = episodes.findIndex(e => e.Episode === id);
  if (epIndex === -1) return;

  const detail = document.getElementById('episode-detail');

	updateViewCounter(id);
	
  // Parse links
  function parseLinks(text) {
    if (!text) return '';
    const parts = text.split('|').map(t => t.trim()).filter(Boolean);
    let html = '<ul class="download-links">';
    for (let i = 0; i < parts.length; i += 2) {
      const url = parts[i];
      const label = parts[i + 1] || "Download";
      if (url.startsWith('http')) {
        html += `<li><a href="${url}" target="_blank">${label}</a></li>`;
      }
    }
    html += '</ul>';
    return html;
  }

  // ===== CATEGORY TAG (HARUS DITARUH SEBELUM dipakai)
  const guestText = [
	  ep.BintangTamu || "",
	  ep.BintangSpesial || ""
	].filter(Boolean).join(", ");

	const groups = getEpisodeGroups(guestText);

  const tagHTML = groups.length
    ? groups.map(g => 
        `<a href="category.html?cat=${encodeURIComponent(g)}" class="ep-tag">${g}</a>`
      ).join('')
    : "";

  // ===== RENDER HTML UTAMA
  detail.innerHTML = `
    <h2>${ep.Title}</h2>
    <nav id="breadcrumb" class="breadcrumb"></nav>
    ${tagHTML}
    <img src="${ep.Image}" alt="${ep.Description}" class="ep-image">
    <p>${ep.Description}</p>

    <br/>
    <p>
      Bintang tamu : ${ep.BintangTamu}<br/>
      Bintang tamu spesial : ${ep.BintangSpesial}
    </p>

	<h3 class="dl-title">Streaming Video</h3>

    <div class="tabs">
      <button class="tab-btn active" data-tab="1">Server 1</button>
      <button class="tab-btn" data-tab="2">Server 2</button>
      <button class="tab-btn" data-tab="3">Server 3</button>
    </div>

    <div id="tab-1" class="tab-content active"><div class="video-wrapper" data-stream="Stream1">
      <img src="${ep.Image}" class="thumb" onclick="loadStream(this)"><div class="play-icon"></div>
    </div></div>

    <div id="tab-2" class="tab-content"><div class="video-wrapper" data-stream="Stream2">
      <img src="${ep.Image}" class="thumb" onclick="loadStream(this)"><div class="play-icon"></div>
    </div></div>

    <div id="tab-3" class="tab-content"><div class="video-wrapper" data-stream="Stream3">
      <img src="${ep.Image}" class="thumb" onclick="loadStream(this)"><div class="play-icon"></div>
    </div></div>

    <h3 class="dl-title">Download Links</h3>
    <table class="download-table">
      ${ep["360p_Sub_Indo"] ? `
      <tr>
        <th>360p Sub Indo</th>
        <td>${parseLinks(ep["360p_Sub_Indo"])}</td>
      </tr>` : ''}

      ${ep["720p_Sub_Indo"] ? `
      <tr>
        <th>720p Sub Indo</th>
        <td>${parseLinks(ep["720p_Sub_Indo"])}</td>
      </tr>` : ''}

      ${ep["540p_Tanpa_Sub"] ? `
      <tr>
        <th>540p Tanpa Sub</th>
        <td>${parseLinks(ep["540p_Tanpa_Sub"])}</td>
      </tr>` : ''}
	  
	  ${ep["720p_Tanpa_Sub"] ? `
      <tr>
        <th>720p Tanpa Sub</th>
        <td>${parseLinks(ep["720p_Tanpa_Sub"])}</td>
      </tr>` : ''}

      ${ep["1080p_Tanpa_Sub"] ? `
      <tr>
        <th>1080p Tanpa Sub</th>
        <td>${parseLinks(ep["1080p_Tanpa_Sub"])}</td>
      </tr>` : ''}
	  
	   ${ep["Subtitle"] ? `
      <tr>
        <th>File Subtitle</th>
        <td>${parseLinks(ep["Subtitle"])}</td>
      </tr>` : ''}
    </table>
  `;

  // ===== BREADCRUMB
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="index.html">Home</a> 
      <span>›</span>
      Knowing Bros episode ${ep.Episode} (${ep.Season})
    `;
  }
  
  // ===== STREAM TAB =====
	// document.getElementById("iframe1").src = ep.Stream1 || "";
	// document.getElementById("iframe2").src = ep.Stream2 || "";
	// document.getElementById("iframe3").src = ep.Stream3 || "";

	// ====== Tab switching logic ======
	const buttons = document.querySelectorAll(".tab-btn");
	const tabs = document.querySelectorAll(".tab-content");

	buttons.forEach(btn => {
	  btn.addEventListener("click", () => {
		let tab = btn.dataset.tab;

		// Hide all
		buttons.forEach(b => b.classList.remove("active"));
		tabs.forEach(t => {
		  t.classList.remove("active");

		  // RESET semua video utk mencegah auto-load
		  const wrapper = t.querySelector(".video-wrapper");
		  if (wrapper) {
			const key = wrapper.dataset.stream;

			wrapper.innerHTML = `
			  <div class="thumb-overlay" onclick="loadStream(this)">
				<img src="${ep.Image}" class="thumb">
				<div class="play-icon"></div>
			  </div>
			`;
		  }
		});

		// Show selected tab
		btn.classList.add("active");
		document.getElementById(`tab-${tab}`).classList.add("active");
	  });
	});
	
	function loadStream(el) {
    const wrapper = el.closest(".video-wrapper");
    const key = wrapper.dataset.stream; // Stream1 / Stream2 / Stream3
    const url = ep[key];

    if (!url) return;

    // Buat iframe baru
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.allowFullscreen = true;
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.position = "absolute";
    iframe.style.top = "0";
    iframe.style.left = "0";

    wrapper.innerHTML = ""; // hapus thumbnail
    wrapper.appendChild(iframe);
	}
	
	window.loadStream = loadStream;

  // ===== SHARE BUTTONS =====
  // const episode = new URLSearchParams(location.search).get("ep");

	// overwrite currentURL yang lama
	const currentURL = window.location.href;
  const shareTitle = ep.Title;
  const shareImage = ep.Image || "";

  document.getElementById("share-fb").href =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentURL)}`;

  document.getElementById("share-x").href =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentURL)}`;

  document.getElementById("share-wa").href =
    `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + currentURL)}`;

  document.getElementById("share-tg").href =
    `https://t.me/share/url?url=${encodeURIComponent(currentURL)}&text=${encodeURIComponent(shareTitle)}`;

  document.getElementById("share-pin").href =
    `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(currentURL)}&media=${encodeURIComponent(shareImage)}&description=${encodeURIComponent(shareTitle)}`;

  // ===== PAGINATION (Prev / Next)
  const paginationContainer = document.getElementById('episode-pagination');
  if (paginationContainer) {
    let html = "";

    function truncateTitle(t, max = 30) {
      return t.length > max ? t.slice(0, max) + "…" : t;
    }

    if (epIndex < episodes.length - 1) {
      const prev = episodes[epIndex + 1];
      html += `
        <a href="episode.html?id=${prev.Episode}" class="ep-page-btn prev">
          ← Prev: ${truncateTitle(prev.Title)}
        </a>
      `;
    }

    if (epIndex > 0) {
      const next = episodes[epIndex - 1];
      html += `
        <a href="episode.html?id=${next.Episode}" class="ep-page-btn next">
          Next: ${truncateTitle(next.Title)} →
        </a>
      `;
    }

    paginationContainer.innerHTML = html;
  }

  // ===== SIDEBAR LATEST
  const latest = document.getElementById('latest-list');
  if (latest) {
    latest.innerHTML = episodes.slice(0, 5).map(e => `
      <li><a href="episode.html?id=${e.Episode}">${e.Title}</a></li>
    `).join('');
  }
  
}

function isEmptyGuest(value) {
	  if (!value) return true;
	  const v = String(value).trim().toLowerCase();
	  const empties = ["", "-", "—", "n/a", "No Guest", "tidak ada"];
	  return empties.includes(v);
}

function renderHomepage(episodes) {
  // Remove skeleton loaders
  document.querySelectorAll(".skeleton-card").forEach(el => el.remove());
  
  const list = document.getElementById('episode-list');
  if (!list) return; // not on homepage

  // === 1. Pagination setup ===
  const urlParams = new URLSearchParams(window.location.search);
  const currentPage = parseInt(urlParams.get('page')) || 1;
  const perPage = 10;
  const totalPages = Math.ceil(episodes.length / perPage);

  // === 2. Slice episodes for this page ===
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const paginatedEpisodes = episodes.slice(start, end);

  // === 3. Render episodes ===
  list.innerHTML = paginatedEpisodes.map(ep => {

    const descText = isEmptyGuest(ep.BintangTamu)
        ? (ep.Description || "")
        : `${ep.Description || ""} dengan bintang tamu ${ep.BintangTamu}`;

    return `
        <div class="episode-card">
            <a href="episode.html?id=${ep.Episode}">
                <img src="${ep.Image}" class="ep-thumb">
            </a>
            <div class="ep-info">
                <h2 class="ep-title">
                    <a href="episode.html?id=${ep.Episode}">${ep.Title}</a>
                </h2>

                <p class="ep-desc">${descText.substring(0, 250)}</p>
            </div>
        </div>
    `;
}).join("");

  // === 4. Render pagination controls ===
  const pagination = document.createElement('div');
  pagination.className = 'pagination';

  // First page button
	if (currentPage > 1) {
	  pagination.innerHTML += `<a href="?page=1" class="page-btn">« First</a>`;
	}

	// Previous button
	if (currentPage > 1) {
	  pagination.innerHTML += `<a href="?page=${currentPage - 1}" class="page-btn">‹ Prev</a>`;
	}

	// Page numbers (trimmed with ellipsis)
	const visiblePages = 5;
	const startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
	const endPage = Math.min(totalPages, currentPage + Math.floor(visiblePages / 2));

	const pageLinks = [];
	for (let i = startPage; i <= endPage; i++) {
	  pageLinks.push(`<a href="?page=${i}" class="page-btn ${i === currentPage ? 'active' : ''}">${i}</a>`);
	}
	if (startPage > 1) pageLinks.unshift('<span class="page-ellipsis">...</span>');
	if (endPage < totalPages) pageLinks.push('<span class="page-ellipsis">...</span>');
	pagination.innerHTML += pageLinks.join('');

	// Next button
	if (currentPage < totalPages) {
	  pagination.innerHTML += `<a href="?page=${currentPage + 1}" class="page-btn">Next ›</a>`;
	}

	// Last page button
	if (currentPage < totalPages) {
	  pagination.innerHTML += `<a href="?page=${totalPages}" class="page-btn">Last »</a>`;
	}

  const mainContainer = document.querySelector('.main-column');
  if (mainContainer) {
    mainContainer.appendChild(pagination);
  }

  // === 5. Sidebar latest ===
  const latest = document.getElementById('latest-list');
  if (latest) {
    latest.innerHTML = episodes.slice(0, 5).map(ep => `
      <li><a href="episode.html?id=${ep.Episode}">${ep.Title}</a></li>
    `).join('');
  }
  
}


// === Search Feature ===
function setupSearch(episodes) {
  const searchBtn = document.getElementById('searchBtn');
  const modal = document.getElementById('searchModal');
  const overlay = document.getElementById("navOverlay");
  const closeBtn = document.getElementById('closeSearch');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  if (!searchBtn || !modal) return;

  function openModal() {
    modal.classList.add('open');
	overlay.classList.add("show");
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modal.classList.remove('open');
	overlay.classList.remove("show");
    modal.setAttribute('aria-hidden', 'true');
    searchInput.value = '';
    searchResults.innerHTML = '';
  }

  searchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal();
  });

  closeBtn.addEventListener('click', () => closeModal());
  overlay.addEventListener("click", closeModal);

  // Close when clicking outside the content box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Escape key closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Search logic (same as before)
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = '';
    if (!q) return;

    // Helper function to normalize text: lowercase + remove symbols/spaces
	function normalize(str) {
	  return str
		.toLowerCase()
		.replace(/[^a-z0-9]/g, ''); // removes spaces and punctuation
	}

	const qNorm = normalize(q);

	const filtered = episodes.filter(ep => {
	  const title = ep.Title ? normalize(ep.Title) : '';
	  const desc = ep.Description ? normalize(ep.Description) : '';
	  const bintang = ep.BintangTamu ? normalize(ep.BintangTamu) : '';
	  const spesial = ep.BintangSpesial ? normalize(ep.BintangSpesial) : '';
	  const episodeNum = ep.Episode ? String(ep.Episode) : '';

	  return (
		title.includes(qNorm) ||
		desc.includes(qNorm) ||
		bintang.includes(qNorm) ||
		spesial.includes(qNorm) ||
		episodeNum.includes(qNorm)
	  );
	});

    if (!filtered.length) {
      searchResults.innerHTML = '<p>No results found.</p>';
      return;
    }

    filtered.forEach(ep => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="episode.html?id=${ep.Episode}">${ep.Title} <small style="color:#666">#${ep.BintangTamu}</small></a>`;
      // When clicking result, close modal (so page navigation feels clean)
      li.querySelector('a').addEventListener('click', () => closeModal());
      searchResults.appendChild(li);
    });
  });
}

function renderEpisodeTextPage(episodes) {
  const container = document.getElementById('episode-text-list');
  if (!container) return;

  // Sort episodes ascending
  episodes.sort((a, b) => Number(a.Episode) - Number(b.Episode));

  // Group episodes by Season
  const groups = {};
  episodes.forEach(ep => {
    if (!groups[ep.Season]) groups[ep.Season] = [];
    groups[ep.Season].push(ep);
  });

  const seasons = Object.keys(groups);

  // Extract year from "Season 11 - 2025"
  const getYear = s => Number(s.split("-")[1].trim());
  const latestSeason = seasons.reduce((a, b) =>
    getYear(a) > getYear(b) ? a : b
  );

  let html = "";

  seasons.forEach(season => {
    const isOpen = season === latestSeason ? "open" : "";

    html += `
      <div class="acc-item ${isOpen}">
        <button class="acc-header" data-target="${season}">
          <span>${season}</span>
          <svg class="acc-arrow ${isOpen ? "rotate" : ""}" width="16" height="16" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </button>

        <div class="acc-body ${isOpen}" id="acc-${season}">
          <ul class="season-list">
    `;

    groups[season].forEach(ep => {
      const gt = (ep.BintangTamu && ep.BintangTamu.trim() !== "-") ?
                 ` – ${ep.BintangTamu}` : "";

      html += `
        <li>
          <a class="ep-link" href="episode.html?id=${ep.Episode}">
            ${ep.Title}
          </a>${gt}
        </li>
      `;
    });

    html += `
          </ul>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Accordion click listener
  document.querySelectorAll(".acc-header").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetSeason = btn.getAttribute("data-target");
      const box = document.querySelector(`.acc-item.${CSS.escape(targetSeason)}`);
      const content = document.getElementById(`acc-${targetSeason}`);
      const arrow = btn.querySelector(".acc-arrow");

      content.classList.toggle("open");
      arrow.classList.toggle("rotate");

      content.style.maxHeight = content.classList.contains("open")
        ? content.scrollHeight + "px"
        : "0px";
    });
  });

  // Set correct max-height for opened section
  setTimeout(() => {
    document.querySelectorAll(".acc-body.open").forEach(el => {
      el.style.maxHeight = el.scrollHeight + "px";
    });
  }, 100);
}



// Initialize everything once
loadEpisodes().then(episodes => {

  renderHomepage(episodes);
  renderEpisodePage(episodes);
  renderEpisodeTextPage(episodes);
  setupSearch(episodes);
  renderCategoryPage(episodes);  
});

// Hamburger Menu
const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mobileNav = document.getElementById("mobileNav");
  const overlay = document.getElementById("navOverlay");
  const closeNavBtn = document.querySelector(".close-nav");

  // Open menu
  hamburgerBtn.addEventListener("click", () => {
    mobileNav.classList.add("open");
    overlay.classList.add("show");
    document.body.style.overflow = "hidden"; // prevent scroll
  });

  // Close menu
  function closeMenu() {
    mobileNav.classList.remove("open");
    overlay.classList.remove("show");
    document.body.style.overflow = ""; // restore scroll
  }

  closeNavBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
  

// DARK MODE TOGGLE (use this exact block)
(function () {
  const THEME_KEY = 'theme'; // localStorage key
  const btn = document.getElementById('themeToggle');
  const mobileBtn = document.getElementById('mobileThemeToggle'); // optional
  const iconDesktop = document.getElementById('themeIconDesktop');
  const iconMobile = document.getElementById('themeIconMobile');

  // SVG path shapes (small, low-poly icons)
  const SUN_PATH = '<path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>';
  const MOON_PATH = '<path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.02 3.278 7.298 7.298 7.298.527 0 1.04-.055 1.536-.159a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.266 0 7.656 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>';

  function setIconDark(isDark) {
    const svg = isDark ? MOON_PATH : SUN_PATH;

    if (iconDesktop) iconDesktop.innerHTML = svg;
    if (iconMobile) iconMobile.innerHTML = svg;
  }

  function isDarkStored() {
    return localStorage.getItem(THEME_KEY) === 'dark';
  }

  function applyInitial() {
    if (isDarkStored()) {
      document.body.classList.add('dark-mode');
      setIconDark(true);
    } else {
      document.body.classList.remove('dark-mode');
      setIconDark(false);
    }
  }

  function toggleTheme(e) {
    e && e.preventDefault();
    const isNowDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, isNowDark ? 'dark' : 'light');
    setIconDark(isNowDark);
  }

  // init
  applyInitial();

  if (btn) btn.addEventListener('click', toggleTheme);
  if (mobileBtn) mobileBtn.addEventListener('click', toggleTheme);

  // expose on window if needed (optional)
  window.toggleTheme = toggleTheme;
})();

function renderCategoryPage(episodes) {
    const container = document.getElementById("categoryResults");
    const title = document.getElementById("catTitle");
    if (!container || !title) return;

    // SORT KHUSUS UNTUK CATEGORY
    const sortedEpisodes = [...episodes].sort((a, b) => Number(a.Episode) - Number(b.Episode));

    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (!cat) return;

    title.textContent = `Knowing Bros episode ${cat}`;

    const filtered = sortedEpisodes.filter(ep => {
        const g = getEpisodeGroups(ep.BintangTamu);
        return g.includes(cat.toUpperCase());
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p>No episodes found for this category.</p>`;
        return;
    }

    function isEmptyGuest(value) {
        if (!value) return true;
        const v = String(value).trim().toLowerCase();
        const empties = ["", "-", "—", "n/a", "no guest", "tidak ada"];
        return empties.includes(v);
    }

    container.innerHTML = filtered.map(ep => {

        const descText = isEmptyGuest(ep.BintangTamu)
            ? (ep.Description || "")
            : `${ep.Description || ""} dengan bintang tamu ${ep.BintangTamu}`;

        return `
            <div class="episode-card">
                <a href="episode.html?id=${ep.Episode}">
                    <img src="${ep.Image}" class="ep-thumb">
                </a>
                <div class="ep-info">
                    <h2 class="ep-title">
                        <a href="episode.html?id=${ep.Episode}">${ep.Title}</a>
                    </h2>

                    <p class="ep-desc">${descText.substring(0, 250)}</p>
                </div>
            </div>
        `;
    }).join("");

    // ===== SIDEBAR LATEST =====
    const latest = document.getElementById('latest-list');
    if (latest) {
        const latestSorted = [...episodes].sort((a, b) => Number(b.Episode) - Number(a.Episode));
        latest.innerHTML = latestSorted.slice(0, 5).map(e => `
            <li><a href="episode.html?id=${e.Episode}">${e.Title}</a></li>
        `).join('');
    }
}

function loadTopViewed() {
  const topViewedList = document.getElementById("top-viewed-list");
  if (!topViewedList) return; // Jika halaman ini tidak memiliki sidebar

  const API_URL = "https://script.google.com/macros/s/AKfycbzJ-FPkZjxVF3K5dTA1mdpfqLM0T1qRqaI3toTG-bYQMKORDE71IAOm5tsazNKtZurP/exec"; // <- ganti

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) {
        topViewedList.innerHTML = "<li>Gagal memuat data.</li>";
        return;
      }

      topViewedList.innerHTML = data.map(ep => `
        <li>
          <a href="episode.html?id=${ep.Episode}">
            ${ep.Title}
          </a>
        </li>
      `).join("");
    })
    .catch(err => {
      console.error("Error fetch top viewed:", err);
      topViewedList.innerHTML = "<li>Tidak dapat mengambil data.</li>";
    });
}

// Jalankan otomatis jika halaman punya elemen #top-viewed-list
document.addEventListener("DOMContentLoaded", loadTopViewed);

function updateViewCounter(episodeId) {
  fetch("https://script.google.com/macros/s/AKfycbzJ-FPkZjxVF3K5dTA1mdpfqLM0T1qRqaI3toTG-bYQMKORDE71IAOm5tsazNKtZurP/exec", {
    method: "POST",
    contentType: "application/json",
    body: JSON.stringify({ episode: episodeId })
  })
  .then(res => res.json())
  .then(data => {
    console.log("View updated:", data);
  })
  .catch(err => console.error("Update view error:", err));
}



document.getElementById("year").textContent = new Date().getFullYear();


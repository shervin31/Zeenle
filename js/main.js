/* ──────────────────────────────────────────────────────────────
   Zeenle  –  main.js
   All UI logic: nav, drawer, modals, tabs, toggles, routing
   ────────────────────────────────────────────────────────────── */

/* ─── Sample Data ────────────────────────────────────────────── */
const EVENTS = [
  {
    id: 1,
    title: "Job Search Workshop",
    category: "Workshop",
    date: "Saturday, June 6, 2026",
    time: "10:00 AM – 12:00 PM",
    doorsOpen: "9:45 AM",
    location: "Welcome Centre Immigrant Services",
    address: "9325 Yonge Street Richmond Hill, ON L4C 0A8 #31a",
    speaker: "Behshad Sabah",
    organization: "Zeenle",
    description: "Join us for an engaging workshop designed to inspire, inform, and empower professionals. This hands-on session will guide you through modern job search strategies, LinkedIn optimization, and how to stand out in today's competitive job market.",
    registration: "RSVP",
    price: "Free",
    mode: "In Person",
    language: "Persian, English",
    maxTickets: 80,
    isPublic: true,
    carpool: true,
    tags: ["Workshop", "Career"],
    posterGradient: "linear-gradient(160deg, #1A3A2A 0%, #2D6A4A 50%, #B8963E 100%)",
    posterEmoji: "💼",
  },
  {
    id: 2,
    title: "Resume & Networking Workshop",
    category: "Workshop",
    date: "Saturday, June 6, 2026",
    time: "12:30 PM – 2:30 PM",
    doorsOpen: "12:15 PM",
    location: "Welcome Centre Immigrant Services",
    address: "9325 Yonge Street Richmond Hill, ON L4C 0A8 #31a",
    speaker: "Behshad Sabah",
    organization: "Zeenle",
    description: "Learn how to craft a standout resume and build a powerful professional network. This workshop covers resume tailoring, cover letters, and networking strategies that open doors.",
    registration: "RSVP",
    price: "Free",
    mode: "In Person",
    language: "Persian, English",
    maxTickets: 60,
    isPublic: true,
    carpool: true,
    tags: ["Workshop", "Career"],
    posterGradient: "linear-gradient(160deg, #2C3E50 0%, #4CA1AF 100%)",
    posterEmoji: "📄",
  },
  {
    id: 3,
    title: "Body Awareness Festival",
    category: "Festival",
    date: "Sunday, June 7, 2026",
    time: "3:30 PM – 8:00 PM",
    doorsOpen: "3:00 PM",
    location: "Mehr Aeenkadah",
    address: "King City Richmond Hill, ON",
    speaker: null,
    organization: "Zeenle",
    description: "A full-day festival celebrating movement, mindfulness, and body awareness. Experience workshops, guided meditations, dance sessions, and expert talks designed to reconnect you with your body.",
    registration: "Ticketing",
    price: "$25 CAD",
    mode: "In Person",
    language: "Persian, English",
    maxTickets: 200,
    isPublic: true,
    carpool: true,
    tags: ["Festival", "Wellness"],
    posterGradient: "linear-gradient(160deg, #c94b4b 0%, #4b134f 100%)",
    posterEmoji: "🌟",
  },
  {
    id: 4,
    title: "The Real Charlie Chaplin",
    category: "Screening",
    date: "Wednesday, June 17, 2026",
    time: "7:30 PM – 9:30 PM",
    doorsOpen: "7:00 PM",
    location: "Studio SYN",
    address: "2 Laureleaf Ave Markham, ON L3T 4S6",
    speaker: null,
    organization: "Zeenle",
    description: "A fascinating documentary that uncovers the real man behind the iconic Tramp character — his genius, controversies, and extraordinary life. Post-screening discussion included.",
    registration: "RSVP",
    price: "Free",
    mode: "In Person",
    language: "English",
    maxTickets: 100,
    isPublic: true,
    carpool: false,
    tags: ["Screening", "Culture"],
    posterGradient: "linear-gradient(160deg, #232526 0%, #414345 100%)",
    posterEmoji: "🎬",
  },
  {
    id: 5,
    title: "Circle of Presence One Day Retreat",
    category: "Retreat",
    date: "Saturday, June 20, 2026",
    time: "9:00 AM – 6:00 PM",
    doorsOpen: "8:30 AM",
    location: "Bond Head Farm",
    address: "Bond Head, Ontario",
    speaker: null,
    organization: "Zeenle",
    description: "A transformative one-day wellness retreat set in nature. Enjoy guided breathwork, group sharing circles, mindful movement, and nourishing meals. Disconnect from the noise and reconnect with yourself.",
    registration: "Ticketing",
    price: "$85 CAD",
    mode: "In Person",
    language: "English, Persian",
    maxTickets: 40,
    isPublic: true,
    carpool: true,
    tags: ["Retreat", "Wellness"],
    posterGradient: "linear-gradient(160deg, #5C4033 0%, #8D6E63 50%, #D4A574 100%)",
    posterEmoji: "🌿",
  },
  {
    id: 6,
    title: "Hand Pan Workshop",
    category: "Workshop",
    date: "Sunday, June 21, 2026",
    time: "12:00 PM – 2:00 PM",
    doorsOpen: "11:45 AM",
    location: "Studio SYN",
    address: "2 Laureleaf Ave Markham, ON L3T 4S6",
    speaker: null,
    organization: "Zeenle",
    description: "Discover the magical, ethereal sounds of the hand pan in this beginner-friendly workshop. No musical experience required — just an open heart and curious hands.",
    registration: "RSVP",
    price: "Free",
    mode: "In Person",
    language: "English",
    maxTickets: 25,
    isPublic: true,
    carpool: false,
    tags: ["Workshop", "Music"],
    posterGradient: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    posterEmoji: "🥁",
  },
  {
    id: 7,
    title: "MAN ON WIRE",
    category: "Screening",
    date: "Wednesday, June 24, 2026",
    time: "7:30 PM – 9:30 PM",
    doorsOpen: "7:00 PM",
    location: "Studio SYN",
    address: "2 Laureleaf Ave Markham, ON L3T 4S6",
    speaker: null,
    organization: "Zeenle",
    description: "The extraordinary true story of Philippe Petit's audacious high-wire walk between the Twin Towers in 1974. An Oscar-winning documentary about daring, art, and the impossible.",
    registration: "RSVP",
    price: "Free",
    mode: "In Person",
    language: "English",
    maxTickets: 100,
    isPublic: true,
    carpool: false,
    tags: ["Screening", "Culture"],
    posterGradient: "linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    posterEmoji: "🎭",
  },
  {
    id: 8,
    title: "Faces Places",
    category: "Screening",
    date: "Wednesday, July 1, 2026",
    time: "7:30 PM – 9:30 PM",
    doorsOpen: "7:00 PM",
    location: "Studio SYN",
    address: "2 Laureleaf Ave Markham, ON L3T 4S6",
    speaker: null,
    organization: "Zeenle",
    description: "A heartwarming road trip documentary by Agnès Varda and JR, exploring rural France by creating monumental photographic installations on buildings, trains, and cliffsides.",
    registration: "RSVP",
    price: "Free",
    mode: "In Person",
    language: "French, English",
    maxTickets: 100,
    isPublic: true,
    carpool: false,
    tags: ["Screening", "Art"],
    posterGradient: "linear-gradient(160deg, #ee9ca7 0%, #ffdde1 100%)",
    posterEmoji: "📸",
  }
];

/* ─── State ──────────────────────────────────────────────────── */
let currentPage = 'home';
let selectedEvent = null;
let activeFilter = 'All';
let authState = { loggedIn: false, user: null };
let activeAccountTab = 'tickets';
let activeLangs = ['English'];
let eventMode = 'In Person';
let registrationMethod = 'RSVP';
let currency = 'CAD';
let addressMode = 'In Person';
let addressVisible = 'All';
let carpoolAllowed = true;
let carpoolModerated = true;
let isPublic = true;
let needsApproval = false;
let ticketsAtDoor = true;
let allowChat = 'Everyone';
let guestsSee = 'No';
let notifyMe = 'Per Ticket';
let openPanels = {};

/* ─── Router ─────────────────────────────────────────────────── */
function navigate(page, data) {
  currentPage = page;
  selectedEvent = data || null;
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) { target.classList.add('active'); window.scrollTo(0,0); }
  updateNav();
  if (page === 'home') renderEventCards();
  if (page === 'detail' && selectedEvent) renderDetailPage();
  if (page === 'account') renderAccountPage();
  if (page === 'create') renderCreatePage();
  closeDrawer();
}

function updateNav() {
  document.querySelectorAll('.nav-links a, .drawer-nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === currentPage);
  });
}

/* ─── Drawer ─────────────────────────────────────────────────── */
function openDrawer() {
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}

/* ─── Login Modal ────────────────────────────────────────────── */
function openLogin() {
  document.getElementById('login-modal').classList.add('open');
}
function closeLogin() {
  document.getElementById('login-modal').classList.remove('open');
}
function doLogin(e) {
  e && e.preventDefault();
  const email = document.getElementById('login-email').value;
  const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  authState = { loggedIn: true, user: { name, email, points: 120 } };
  closeLogin();
  updateAuthUI();
}
function doLogout() {
  authState = { loggedIn: false, user: null };
  updateAuthUI();
  if (currentPage === 'account') navigate('home');
  closeDrawer();
}
function updateAuthUI() {
  document.querySelectorAll('.auth-login-btn').forEach(el => {
    el.style.display = authState.loggedIn ? 'none' : '';
  });
  document.querySelectorAll('.auth-account-btn').forEach(el => {
    el.style.display = authState.loggedIn ? '' : 'none';
  });
  document.querySelectorAll('.drawer-auth-section').forEach(el => {
    el.innerHTML = authState.loggedIn
      ? `<a href="#" onclick="navigate('account');return false" data-page="account">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
           My Account
         </a>
         <div class="nav-sep"></div>
         <a href="#" onclick="doLogout();return false" style="color:var(--danger)">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
           Log Out
         </a>`
      : `<a href="#" onclick="openLogin();closeDrawer();return false">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
           Login
         </a>`;
  });
}

/* ─── Event Poster SVG ───────────────────────────────────────── */
function posterSVG(event, size = 'card') {
  const w = size === 'detail' ? 420 : 380;
  const h = size === 'detail' ? 560 : 220;
  const cat = event.category.toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g${event.id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${posterColors(event.id)[0]}"/>
        <stop offset="100%" stop-color="${posterColors(event.id)[1]}"/>
      </linearGradient>
      <filter id="blur${event.id}"><feGaussianBlur stdDeviation="40"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g${event.id})"/>
    <circle cx="${w*0.85}" cy="${h*0.15}" r="${h*0.4}" fill="rgba(255,255,255,0.05)" filter="url(#blur${event.id})"/>
    <circle cx="${w*0.1}" cy="${h*0.9}" r="${h*0.3}" fill="rgba(0,0,0,0.15)" filter="url(#blur${event.id})"/>
    <rect x="0" y="${h-6}" width="${w}" height="6" fill="rgba(184,150,62,0.8)"/>
    <text x="24" y="${size==='detail'?60:36}" font-family="serif" font-size="${size==='detail'?13:11}" font-weight="700" fill="rgba(255,255,255,0.6)" letter-spacing="3">${cat}</text>
    <text x="24" y="${size==='detail'?130:90}" font-family="serif" font-size="${size==='detail'?42:28}" font-weight="700" fill="#fff" style="text-shadow:0 2px 20px rgba(0,0,0,0.4)">${event.posterEmoji}</text>
    <text x="24" y="${h-44}" font-family="sans-serif" font-size="${size==='detail'?13:11}" fill="rgba(255,255,255,0.7)">${event.date}</text>
    <text x="24" y="${h-24}" font-family="sans-serif" font-size="${size==='detail'?13:11}" fill="rgba(255,255,255,0.55)">${event.location}</text>
    ${size==='detail' && event.speaker ? `<rect x="24" y="${h-80}" width="3" height="20" fill="rgba(184,150,62,0.9)" rx="2"/>
    <text x="36" y="${h-64}" font-family="sans-serif" font-size="11" fill="rgba(184,150,62,0.9)" font-weight="600" letter-spacing="2">SPEAKER</text>
    <text x="36" y="${h-48}" font-family="sans-serif" font-size="15" fill="#fff" font-weight="700">${event.speaker}</text>` : ''}
  </svg>`;
}

function posterColors(id) {
  const palettes = [
    ['#1A3A2A','#2D6A4A'],['#2C3E50','#4CA1AF'],['#c94b4b','#4b134f'],
    ['#232526','#414345'],['#5C4033','#D4A574'],['#1a1a2e','#0f3460'],
    ['#0f2027','#2c5364'],['#c94b4b','#ee9ca7']
  ];
  return palettes[(id-1) % palettes.length];
}

/* ─── Home Page ──────────────────────────────────────────────── */
function renderEventCards() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  const cats = ['All', ...new Set(EVENTS.map(e => e.category))];
  const filterBar = document.getElementById('filter-chips');
  if (filterBar) {
    filterBar.innerHTML = cats.map(c =>
      `<button class="filter-chip${activeFilter===c?' active':''}" onclick="setFilter('${c}')">${c}</button>`
    ).join('');
  }
  const filtered = activeFilter === 'All' ? EVENTS : EVENTS.filter(e => e.category === activeFilter);
  grid.innerHTML = filtered.map((ev, i) => `
    <div class="event-card fade-up" style="animation-delay:${i*0.06}s" onclick="navigate('detail',EVENTS[${ev.id-1}])">
      <div style="overflow:hidden;background:var(--surface-2)">
        ${posterSVG(ev,'card')}
      </div>
      <div class="event-card-body">
        <div class="event-card-tags">
          ${ev.tags.map(t=>`<span class="tag">${t}</span>`).join('')}
          ${ev.language.includes('Persian') ? '<span class="tag lang">🇮🇷 Persian</span>' : ''}
        </div>
        <div class="event-card-title">${ev.title}</div>
        <div class="event-card-meta">
          <div class="event-meta-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
            ${ev.date}
          </div>
          <div class="event-meta-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ${ev.time}
          </div>
          <div class="event-meta-row">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
            ${ev.location}
          </div>
        </div>
      </div>
      <div class="event-card-foot">
        <span class="event-price">${ev.price}</span>
        <button class="btn-details" onclick="event.stopPropagation();navigate('detail',EVENTS[${ev.id-1}])">Details →</button>
      </div>
    </div>
  `).join('');
}

function setFilter(cat) {
  activeFilter = cat;
  renderEventCards();
}

function filterSearch(val) {
  const term = val.toLowerCase();
  document.querySelectorAll('.event-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(term) ? '' : 'none';
  });
}

/* ─── Detail Page ────────────────────────────────────────────── */
function renderDetailPage() {
  const ev = selectedEvent;
  if (!ev) return;
  document.getElementById('detail-content').innerHTML = `
    <div class="detail-breadcrumb">
      <a href="#" onclick="navigate('home');return false">Home</a>
      <span>›</span>
      <span>${ev.title}</span>
    </div>
    <div class="detail-grid">
      <div>
        <div class="detail-poster">${posterSVG(ev,'detail')}</div>
      </div>
      <div class="detail-info">
        <div class="detail-tags">
          ${ev.tags.map(t=>`<span class="tag">${t}</span>`).join('')}
          ${ev.language.includes('Persian') ? '<span class="tag lang">🇮🇷 Persian</span>' : ''}
        </div>
        <h1 class="detail-title">${ev.title}</h1>
        <p class="detail-desc">${ev.description}</p>
        <div class="detail-meta-card">
          <div class="detail-meta-row">
            <div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg></div>
            <div><div class="meta-label">Date</div><div class="meta-value">${ev.date}</div></div>
          </div>
          <div class="detail-meta-row">
            <div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <div><div class="meta-label">Time</div><div class="meta-value">${ev.time}</div><div class="meta-label" style="margin-top:4px">Doors open ${ev.doorsOpen}</div></div>
          </div>
          <div class="detail-meta-row">
            <div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg></div>
            <div><div class="meta-label">Location</div><div class="meta-value">${ev.location}</div><div class="meta-label" style="margin-top:2px">${ev.address}</div></div>
          </div>
          ${ev.speaker ? `<div class="detail-meta-row">
            <div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg></div>
            <div><div class="meta-label">Speaker</div><div class="meta-value">${ev.speaker}</div></div>
          </div>` : ''}
          <div class="detail-meta-row">
            <div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <div><div class="meta-label">Price</div><div class="meta-value">${ev.price}</div></div>
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn-register" onclick="${authState.loggedIn ? 'alert(\'Registration submitted! Check your email.\')' : 'openLogin()'}">
            ${ev.registration === 'RSVP' ? 'RSVP for this Event' : 'Get Tickets'} →
          </button>
          <button class="btn-secondary" onclick="shareEvent()">Share Event</button>
        </div>
        <div class="detail-extras">
          ${ev.carpool ? `
          <div class="extra-panel" id="panel-carpool-offers">
            <div class="extra-panel-head" onclick="togglePanel('carpool-offers')">
              <span>🚗  Carpool Offers (0)</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
            </div>
            <div class="extra-panel-body"><p class="extra-empty">No carpool offers yet. Be the first to offer a ride!</p></div>
          </div>
          <div class="extra-panel" id="panel-carpool-requests">
            <div class="extra-panel-head" onclick="togglePanel('carpool-requests')">
              <span>🙋  Carpool Requests (0)</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
            </div>
            <div class="extra-panel-body"><p class="extra-empty">No ride requests yet.</p></div>
          </div>` : ''}
          <div class="extra-panel" id="panel-photos">
            <div class="extra-panel-head" onclick="togglePanel('photos')">
              <span>📸  Event Photo Gallery</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
            </div>
            <div class="extra-panel-body"><p class="extra-empty">Photos are only accessible to people who attended this event.</p></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function togglePanel(id) {
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.classList.toggle('open');
}

function shareEvent() {
  if (navigator.share) {
    navigator.share({ title: selectedEvent?.title, text: selectedEvent?.description, url: window.location.href });
  } else {
    navigator.clipboard?.writeText(window.location.href);
    alert('Link copied to clipboard!');
  }
}

/* ─── Account Page ───────────────────────────────────────────── */
function renderAccountPage() {
  const user = authState.user || { name: 'Guest', email: '', points: 0 };
  const initials = user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('account-content').innerHTML = `
    <div class="account-hero">
      <div class="account-avatar">${initials}</div>
      <div class="account-info">
        <h2>${user.name}</h2>
        <p>${user.email || 'Not logged in'}</p>
        ${authState.loggedIn ? '<p style="margin-top:6px;font-size:13px;color:rgba(255,255,255,0.5)">Member since 2024</p>' : ''}
      </div>
      <div class="zee-points-badge">
        <div class="pts">${authState.loggedIn ? user.points : 0}</div>
        <div class="lbl">ZeePoints</div>
      </div>
    </div>
    ${!authState.loggedIn ? `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:40px;text-align:center;margin-bottom:24px">
        <p style="font-size:15px;color:var(--text-2);margin-bottom:16px">Login to view your tickets, events, and referrals.</p>
        <button class="btn-submit" onclick="openLogin()">Login to Your Account</button>
      </div>` : ''}
    <div class="account-tabs" id="account-tabs">
      <div class="account-tab${activeAccountTab==='tickets'?' active':''}" onclick="switchAccountTab('tickets')">My Tickets</div>
      <div class="account-tab${activeAccountTab==='events'?' active':''}" onclick="switchAccountTab('events')">My Events & More</div>
      <div class="account-tab${activeAccountTab==='referrals'?' active':''}" onclick="switchAccountTab('referrals')">Referrals & Points</div>
    </div>
    <div class="account-panel${activeAccountTab==='tickets'?' active':''}" id="tab-tickets">
      ${authState.loggedIn ? `
        <div class="ticket-card">
          <div class="ticket-poster">${posterSVG(EVENTS[0],'tiny')}</div>
          <div class="ticket-body">
            <div class="ticket-title">${EVENTS[0].title}</div>
            <div class="ticket-meta">${EVENTS[0].date} · ${EVENTS[0].time}<br>${EVENTS[0].location}</div>
          </div>
          <div class="ticket-foot">
            <span class="ticket-status">Registered</span>
            <button class="btn-secondary" style="font-size:12px;padding:6px 14px">View Ticket</button>
          </div>
        </div>` :
        `<div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"/></svg>
          <p>No tickets yet. <a href="#" onclick="navigate('home');return false" style="color:var(--accent-2);font-weight:600">Browse events →</a></p>
        </div>`}
    </div>
    <div class="account-panel${activeAccountTab==='events'?' active':''}" id="tab-events">
      ${authState.loggedIn ?
        `<div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
          <button class="btn-submit" onclick="navigate('create')">+ Create New Event</button>
        </div>
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
          <p>No events created yet.</p>
        </div>` :
        `<div class="empty-state"><p>Login to manage your events.</p></div>`}
    </div>
    <div class="account-panel${activeAccountTab==='referrals'?' active':''}" id="tab-referrals">
      <div class="referral-card">
        <h4>🎁 Your ZeePoints</h4>
        <p>Earn ZeePoints by attending events, referring friends, and using our partner vendors. Redeem for prizes and discounts.</p>
        ${authState.loggedIn ? `
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
            <div style="background:var(--surface-2);border-radius:var(--radius-sm);padding:16px;text-align:center">
              <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--accent)">${user.points}</div>
              <div style="font-size:12px;color:var(--text-3);text-transform:uppercase;font-weight:600;letter-spacing:0.06em">Available</div>
            </div>
            <div style="background:var(--surface-2);border-radius:var(--radius-sm);padding:16px;text-align:center">
              <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--gold)">250</div>
              <div style="font-size:12px;color:var(--text-3);text-transform:uppercase;font-weight:600;letter-spacing:0.06em">Lifetime</div>
            </div>
            <div style="background:var(--surface-2);border-radius:var(--radius-sm);padding:16px;text-align:center">
              <div style="font-family:var(--font-head);font-size:24px;font-weight:800;color:var(--text-2)">130</div>
              <div style="font-size:12px;color:var(--text-3);text-transform:uppercase;font-weight:600;letter-spacing:0.06em">Redeemed</div>
            </div>
          </div>
          <h4 style="margin-bottom:8px">🔗 Your Referral Link</h4>
          <p>Refer friends and earn 50 ZeePoints for each signup.</p>
          <div class="referral-link-box">
            <span>zeenle.com/ref/${user.name.toLowerCase().replace(/ /g,'-')}</span>
            <button class="btn-copy" onclick="this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)">Copy</button>
          </div>` :
          `<div class="empty-state"><p>Login to view your points and referrals.</p></div>`}
      </div>
    </div>
  `;
}

function switchAccountTab(tab) {
  activeAccountTab = tab;
  renderAccountPage();
}

/* ─── Create Event Form ──────────────────────────────────────── */
function renderCreatePage() {
  document.getElementById('create-content').innerHTML = `
    <h1 class="form-page-title">Create an Event</h1>
    <p class="form-page-sub">Fill in the details below. You can always save a draft and come back.</p>

    <div class="form-section">
      <div class="form-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
        Main Information
      </div>
      <div class="form-row single" style="margin-bottom:20px">
        <div class="form-field">
          <label class="form-label">Event Poster <span class="form-hint" style="font-weight:400">(image or MP4, max 10MB)</span></label>
          <div class="upload-zone" onclick="document.getElementById('poster-input').click()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
            <p>Click to upload or drag & drop</p>
            <span>PNG, JPG, MP4 — max 10MB</span>
            <input id="poster-input" type="file" accept="image/*,video/mp4" style="display:none" onchange="posterSelected(this)">
          </div>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:20px">
        <div class="form-field">
          <label class="form-label">Organization <span class="required">*</span></label>
          <select class="form-select"><option>Zeenle</option><option>Personal</option></select>
        </div>
        <div class="form-field">
          <label class="form-label">Event Title <span class="required">*</span></label>
          <input type="text" class="form-input" placeholder="e.g. Job Search Workshop">
        </div>
      </div>
      <div class="form-row single" style="margin-bottom:20px">
        <div class="form-field">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" placeholder="Tell attendees what this event is about…"></textarea>
        </div>
      </div>
      <div class="form-row triple" style="margin-bottom:20px">
        <div class="form-field">
          <label class="form-label">Start Date & Time <span class="required">*</span></label>
          <input type="datetime-local" class="form-input">
        </div>
        <div class="form-field">
          <label class="form-label">End Date & Time <span class="required">*</span></label>
          <input type="datetime-local" class="form-input">
        </div>
        <div class="form-field">
          <label class="form-label">Doors Open</label>
          <input type="datetime-local" class="form-input">
          <span class="form-hint">Attendance opens at this time</span>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:20px">
        <div class="form-field">
          <label class="form-label">Registration Method</label>
          <div class="toggle-group">
            <button class="toggle-btn${registrationMethod==='RSVP'?' active':''}" onclick="setFormToggle('registrationMethod','RSVP',this)">RSVP</button>
            <button class="toggle-btn${registrationMethod==='Ticketing'?' active':''}" onclick="setFormToggle('registrationMethod','Ticketing',this)">Ticketing</button>
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Currency</label>
          <div class="toggle-group">
            <button class="toggle-btn${currency==='CAD'?' active':''}" onclick="setFormToggle('currency','CAD',this)">CAD</button>
            <button class="toggle-btn${currency==='USD'?' active':''}" onclick="setFormToggle('currency','USD',this)">USD</button>
            <button class="toggle-btn${currency==='EUR'?' active':''}" onclick="setFormToggle('currency','EUR',this)">EUR</button>
          </div>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:20px">
        <div class="form-field">
          <label class="form-label">Max Tickets</label>
          <input type="number" class="form-input" placeholder="0 = sum of ticket types">
          <span class="form-hint">0 means total capacity is determined by sum of ticket types</span>
        </div>
        <div class="form-field">
          <label class="form-label">Contact Email</label>
          <input type="email" class="form-input" placeholder="contact@example.com">
        </div>
      </div>
      <div class="form-row single">
        <div class="form-field">
          <label class="form-label">Contact Phone</label>
          <input type="tel" class="form-input" placeholder="+1 (416) 000-0000" style="max-width:280px">
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
        Location
      </div>
      <div class="form-row" style="margin-bottom:20px">
        <div class="form-field">
          <label class="form-label">Mode</label>
          <div class="toggle-group">
            <button class="toggle-btn${addressMode==='In Person'?' active':''}" onclick="setFormToggle('addressMode','In Person',this)">In Person</button>
            <button class="toggle-btn${addressMode==='Online'?' active':''}" onclick="setFormToggle('addressMode','Online',this)">Online</button>
            <button class="toggle-btn${addressMode==='Hybrid'?' active':''}" onclick="setFormToggle('addressMode','Hybrid',this)">Hybrid</button>
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Address Visible To</label>
          <div class="toggle-group">
            <button class="toggle-btn${addressVisible==='All'?' active':''}" onclick="setFormToggle('addressVisible','All',this)">All</button>
            <button class="toggle-btn${addressVisible==='Approved Tickets'?' active':''}" onclick="setFormToggle('addressVisible','Approved Tickets',this)">Approved Tickets</button>
            <button class="toggle-btn${addressVisible==='Email Only'?' active':''}" onclick="setFormToggle('addressVisible','Email Only',this)">Email Only</button>
          </div>
        </div>
      </div>
      <div class="form-row" style="margin-bottom:20px">
        <div class="form-field">
          <label class="form-label">Venue Name</label>
          <input type="text" class="form-input" placeholder="e.g. Welcome Centre">
        </div>
        <div class="form-field">
          <label class="form-label">Street Address</label>
          <input type="text" class="form-input" placeholder="123 Main St">
        </div>
      </div>
      <div class="form-row triple">
        <div class="form-field">
          <label class="form-label">City</label>
          <input type="text" class="form-input" placeholder="Toronto">
        </div>
        <div class="form-field">
          <label class="form-label">Province</label>
          <input type="text" class="form-input" placeholder="ON">
        </div>
        <div class="form-field">
          <label class="form-label">Postal Code</label>
          <input type="text" class="form-input" placeholder="M1A 1A1">
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg>
        Controls
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        ${controlRow('Tickets at the Door','ticketsAtDoor','ticketAtDoor','We allow registration and admission at the door or not.')}
        ${controlRow('Is Public','isPublic','isPublic','Show on home page or not.')}
        ${controlRow('Needs Approval','needsApproval','needsApproval','Each registrant should be approved or not.')}
        ${controlRow('Allow Carpool','carpoolAllowed','carpoolAllowed','Enable carpooling for this event.')}
        ${controlRow('Carpool Moderated','carpoolModerated','carpoolModerated','Approve carpool offers and requests.')}
      </div>
      <div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div class="form-field">
          <label class="form-label">Let guests see each other</label>
          <div class="toggle-group">
            ${['No','Yes','Friends Only','After Given Qty'].map(v=>`<button class="toggle-btn${guestsSee===v?' active':''}" onclick="guestsSee='${v}';this.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${v}</button>`).join('')}
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Allow Chat</label>
          <div class="toggle-group">
            ${['No','Everyone','Only Ticket Holders','After Ticket Approved'].map(v=>`<button class="toggle-btn${allowChat===v?' active':''}" onclick="allowChat='${v}';this.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${v}</button>`).join('')}
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Notify Me</label>
          <div class="toggle-group">
            ${['Per Ticket','Daily'].map(v=>`<button class="toggle-btn${notifyMe===v?' active':''}" onclick="notifyMe='${v}';this.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">${v}</button>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"/></svg>
        More Info
      </div>
      <div class="form-field">
        <label class="form-label">Event Languages</label>
        <div class="lang-chips" id="lang-chips">
          ${['English','French','Spanish','Persian','Hindi','Arabic','Mandarin','Cantonese','Portuguese','German','Dutch','Italian','Russian','Ukrainian'].map(l=>`<button class="lang-chip${activeLangs.includes(l)?' active':''}" onclick="toggleLang('${l}',this)">${l}</button>`).join('')}
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-submit" onclick="submitEvent()">Save & Publish</button>
      <button class="btn-cancel" onclick="navigate('home')">Cancel</button>
    </div>
  `;
}

function controlRow(label, varName, id, hint) {
  const val = window[varName] !== undefined ? window[varName] : true;
  return `<div class="form-field">
    <label class="form-label">${label}</label>
    <div class="toggle-group">
      <button class="toggle-btn${val?' active':''}" id="${id}-yes" onclick="${varName}=true;document.getElementById('${id}-yes').classList.add('active');document.getElementById('${id}-no').classList.remove('active')">Yes</button>
      <button class="toggle-btn${!val?' active':''}" id="${id}-no" onclick="${varName}=false;document.getElementById('${id}-no').classList.add('active');document.getElementById('${id}-yes').classList.remove('active')">No</button>
    </div>
    <span class="form-hint">${hint}</span>
  </div>`;
}

function setFormToggle(varName, val, btn) {
  window[varName] = val;
  btn.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function toggleLang(lang, btn) {
  if (activeLangs.includes(lang)) { activeLangs = activeLangs.filter(l => l !== lang); btn.classList.remove('active'); }
  else { activeLangs.push(lang); btn.classList.add('active'); }
}

function posterSelected(input) {
  const file = input.files[0];
  if (!file) return;
  const zone = input.closest('.upload-zone');
  zone.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:36px;height:36px;margin:0 auto 10px;color:var(--accent-2)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p style="color:var(--accent-2);font-weight:600">${file.name}</p><span>Click to change</span>`;
  zone.onclick = () => document.getElementById('poster-input').click();
}

function submitEvent() {
  const titleInput = document.querySelector('#page-create .form-input');
  alert('Event saved! (Backend integration coming soon)');
  navigate('home');
}

/* ─── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  navigate('home');
  updateAuthUI();

  // Hamburger
  document.getElementById('hamburger-btn')?.addEventListener('click', openDrawer);
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
  document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);

  // Login modal
  document.getElementById('login-modal-overlay')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLogin();
  });

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', doLogin);
});

/* ═══════════════════════════════════════════════════════
   Zeenle | main.js  —  Production build + Image system
═══════════════════════════════════════════════════════ */

const SB_URL = 'https://pfuylqlexsaoryyxnrma.supabase.co';
const SB_KEY = 'sb_publishable_YZRUQQyswKSbTTtLbnUybQ_9X2EFSzT';
const sb = supabase.createClient(SB_URL, SB_KEY);

/* ─── APP STATE ─────────────────────────────────────── */
let appState = {
  page: 'home',
  selectedEvent: null,
  filter: 'All',
  sortBy: 'date',
  searchQuery: '',
  events: [],
  categories: [],
  authUser: null,
  profile: null,
  acctTab: 'tickets',
  userLat: null,
  userLng: null,
  locLabel: '',
  sortByLoc: false,
  fLangs: [],
  fMode: 'In Person',
  fAddrVis: 'All',
  fReg: 'RSVP',
  fCurr: 'CAD',
  fPublic: true,
  fApproval: false,
  fDoor: true,
  fCarpool: true,
  fPosterFile: null,
  fPosterFocalX: 0.5,
  fPosterFocalY: 0.5,
  phoneStep: 'number',
  phoneTmp: '',
  page_num: 0,
  PAGE_SIZE: 24,
  hasMore: false,
  fetchController: null,
};

/* ─── CROP EDITOR STATE ─────────────────────────────── */
const cropState = {
  file: null,
  objectUrl: null,
  focalX: 0.5,
  focalY: 0.5,
  dragging: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStartFX: 0,
  dragStartFY: 0,
  zoom: 1,
};

/* ─── HELPERS ───────────────────────────────────────── */
const g = id => document.getElementById(id);
const v = id => g(id)?.value?.trim() || '';

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function icon(d, s = 14) {
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="${s}" height="${s}"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`;
}

function toast(msg, type = '') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 250); }, 3500);
}

function setBtnLoad(btn, txt, on = true) {
  if (!btn) return;
  btn.textContent = txt;
  btn.disabled = on;
}

/* ─── AUTH ──────────────────────────────────────────── */
async function bootAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) await syncUser(session.user);
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') { await syncUser(session.user); closeModal(); toast('Welcome to Zeenle!', 'ok'); }
    if (event === 'SIGNED_OUT') { appState.authUser = null; appState.profile = null; refreshAuthUI(); if (appState.page === 'account') go('home'); }
  });
}

async function syncUser(user) {
  appState.authUser = user;
  const { data, error } = await sb.from('users').upsert(
    { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.user_metadata?.name || '', avatar_url: user.user_metadata?.avatar_url || '' },
    { onConflict: 'id' }
  ).select().single();
  if (!error) appState.profile = data;
  refreshAuthUI();
}

async function doLogin(e) {
  e.preventDefault();
  const btn = g('m-login-btn');
  setBtnLoad(btn, 'Signing in…');
  const { error } = await sb.auth.signInWithPassword({ email: v('m-email'), password: v('m-pass') });
  setBtnLoad(btn, 'Sign in', false);
  if (error) toast(niceErr(error), 'err');
}

async function doSignup(e) {
  e.preventDefault();
  const pass = v('s-pass'), conf = v('s-conf');
  if (!pwOk(pass)) { toast('Password does not meet requirements.', 'err'); return; }
  if (pass !== conf) { toast('Passwords do not match.', 'err'); return; }
  const btn = g('s-btn');
  setBtnLoad(btn, 'Creating account…');
  const { error } = await sb.auth.signUp({ email: v('s-email'), password: pass, options: { data: { full_name: v('s-name') }, emailRedirectTo: location.origin + '/Zeenle/' } });
  setBtnLoad(btn, 'Create account', false);
  if (error) toast(niceErr(error), 'err');
  else { closeModal(); toast('Account created! Check your email to confirm.', 'ok'); }
}

async function doOAuth(provider) {
  const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.href } });
  if (error) toast(niceErr(error), 'err');
}

async function sendOTP() {
  const num = v('ph-num');
  if (!num) { toast('Enter a phone number.', 'err'); return; }
  appState.phoneTmp = num;
  const btn = g('ph-send');
  setBtnLoad(btn, 'Sending…');
  const { error } = await sb.auth.signInWithOtp({ phone: num });
  setBtnLoad(btn, 'Send code', false);
  if (error) { toast(niceErr(error), 'err'); return; }
  appState.phoneStep = 'otp';
  renderPhone();
}

async function verifyOTP() {
  const token = v('ph-otp');
  if (!token) { toast('Enter the code.', 'err'); return; }
  const btn = g('ph-verify');
  setBtnLoad(btn, 'Verifying…');
  const { data, error } = await sb.auth.verifyOtp({ phone: appState.phoneTmp, token, type: 'sms' });
  setBtnLoad(btn, 'Verify', false);
  if (error) { toast(niceErr(error), 'err'); return; }
  const { data: p } = await sb.from('users').select('full_name').eq('id', data.user.id).single();
  if (!p?.full_name) { appState.phoneStep = 'name'; renderPhone(); }
}

async function savePhoneName() {
  const name = v('ph-name');
  if (!name) { toast('Enter your name.', 'err'); return; }
  const { data: { user } } = await sb.auth.getUser();
  await sb.auth.updateUser({ data: { full_name: name } });
  await sb.from('users').update({ full_name: name }).eq('id', user.id);
  await syncUser(user);
}

function renderPhone() {
  const el = g('phone-step');
  if (!el) return;
  if (appState.phoneStep === 'number') {
    el.innerHTML = `<div class="mfield"><label class="mlabel">Phone number</label><input id="ph-num" type="tel" class="minput" placeholder="+1 (416) 000-0000" autocomplete="tel"><div style="font-size:11px;color:var(--ink3);margin-top:4px">We'll send a verification code via SMS.</div></div><button id="ph-send" class="btn-auth" onclick="sendOTP()">Send code</button>`;
  } else if (appState.phoneStep === 'otp') {
    el.innerHTML = `<p style="font-size:13px;color:var(--ink2);margin-bottom:13px">Code sent to <strong>${esc(appState.phoneTmp)}</strong></p><div class="mfield"><label class="mlabel">Verification code</label><input id="ph-otp" type="text" class="minput" placeholder="000000" maxlength="6" autocomplete="one-time-code" style="letter-spacing:5px;font-size:18px;text-align:center"></div><button id="ph-verify" class="btn-auth" onclick="verifyOTP()">Verify</button><button onclick="appState.phoneStep='number';renderPhone()" style="width:100%;padding:7px;font-size:12px;color:var(--ink3);background:none;border:none;cursor:pointer;margin-top:2px">← Different number</button>`;
  } else {
    el.innerHTML = `<p style="font-size:13px;color:var(--ink2);margin-bottom:13px">Almost done — what's your name?</p><div class="mfield"><label class="mlabel">Full name</label><input id="ph-name" type="text" class="minput" placeholder="Your name" autocomplete="name"></div><button class="btn-auth" onclick="savePhoneName()">Save</button>`;
  }
}

async function doLogout() { await sb.auth.signOut(); closeDropdown(); closeDrawer(); toast('Signed out.'); }

function pwOk(p) { return p.length >= 8 && /[A-Z]/.test(p) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p); }
function liveCheck(val) {
  setChk('pwc-len', val.length >= 8, 'At least 8 characters');
  setChk('pwc-up', /[A-Z]/.test(val), 'At least 1 uppercase letter');
  setChk('pwc-sp', /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val), 'At least 1 special character');
}
function liveMatch() { setChk('pwc-match', v('s-pass') === v('s-conf') && v('s-conf').length > 0, 'Passwords match'); }
function setChk(id, ok, lbl) { const el = g(id); if (!el) return; el.textContent = (ok ? '✓ ' : '✗ ') + lbl; el.className = 'pwc' + (ok ? ' ok' : ''); }
function niceErr(e) {
  const m = e.message || '';
  if (m.includes('Invalid login')) return 'Incorrect email or password.';
  if (m.includes('not confirmed')) return 'Please confirm your email first.';
  if (m.includes('already registered')) return 'An account with this email already exists.';
  if (m.includes('not enabled') || m.includes('disabled')) return 'Email sign-in is not enabled. Check Supabase Auth Providers settings.';
  return m;
}
function refreshAuthUI() {
  const loggedIn = !!appState.authUser;
  document.querySelectorAll('.show-out').forEach(el => el.style.display = loggedIn ? 'none' : '');
  document.querySelectorAll('.show-in').forEach(el => el.style.display = loggedIn ? '' : 'none');
  const initials = (appState.profile?.full_name || appState.authUser?.email || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const firstName = (appState.profile?.full_name || appState.authUser?.email || '').split(' ')[0];
  if (g('nav-av')) g('nav-av').textContent = initials;
  if (g('nav-uname')) g('nav-uname').textContent = esc(firstName);
  const da = g('drawer-auth');
  if (!da) return;
  if (loggedIn) {
    da.innerHTML = `<a href="#" onclick="go('account');return false">${icon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z')}My account</a><div class="drawer-sep"></div><a href="#" onclick="doLogout();return false" style="color:var(--red)">${icon('M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9')}Sign out</a>`;
  } else {
    da.innerHTML = `<a href="#" onclick="openModal('login');closeDrawer();return false">${icon('M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9')}Sign in / Create account</a>`;
  }
}

/* ─── LOCATION ──────────────────────────────────────── */
function requestLocation() {
  if (!navigator.geolocation) { toast('Geolocation is not supported by your browser.', 'err'); return; }
  const btn = g('loc-main-btn');
  if (btn) { btn.textContent = 'Locating…'; btn.disabled = true; }
  navigator.geolocation.getCurrentPosition(async pos => {
    appState.userLat = pos.coords.latitude;
    appState.userLng = pos.coords.longitude;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${appState.userLat}&lon=${appState.userLng}&format=json&zoom=14`, { headers: { 'Accept-Language': 'en' } });
      const d = await r.json();
      appState.locLabel = d.address?.neighbourhood || d.address?.suburb || d.address?.quarter || d.address?.district || d.address?.city_district || d.address?.city || d.address?.town || 'your area';
    } catch (_) { appState.locLabel = 'your area'; }
    appState.sortByLoc = true;
    appState.sortBy = 'distance';
    updateLocBar();
    loadEvents();
    toast(`Showing events near ${appState.locLabel}`, 'ok');
    if (btn) { btn.textContent = 'Use my location'; btn.disabled = false; }
  }, err => {
    toast(err.code === 1 ? 'Location access denied.' : 'Could not get your location.', 'err');
    if (btn) { btn.textContent = 'Use my location'; btn.disabled = false; }
  }, { enableHighAccuracy: true, timeout: 10000 });
}

function clearLocation() {
  appState.userLat = null; appState.userLng = null; appState.locLabel = ''; appState.sortByLoc = false;
  if (appState.sortBy === 'distance') appState.sortBy = 'date';
  updateLocBar(); loadEvents();
}

function updateLocBar() {
  const bar = g('loc-bar');
  if (!bar) return;
  if (appState.sortByLoc && appState.locLabel) {
    bar.innerHTML = `${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', 13)}<span class="loc-info"><span>Near <strong>${esc(appState.locLabel)}</strong></span><span class="loc-badge">On</span><button class="btn-loc-clear" onclick="clearLocation()">✕ Clear</button></span>`;
  } else {
    bar.innerHTML = `${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', 13)}<span class="loc-info">All events</span><button id="loc-main-btn" class="btn-loc" onclick="requestLocation()">Use my location</button>`;
  }
}

function distKm(a, b, c, d) {
  const R = 6371, dL = (c - a) * Math.PI / 180, dG = (d - b) * Math.PI / 180;
  const x = Math.sin(dL / 2) ** 2 + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* ─── CATEGORIES ────────────────────────────────────── */
async function loadCategories() {
  const { data } = await sb.from('categories').select('*').order('name');
  if (data?.length) appState.categories = data;
  return appState.categories;
}

/* ─── EVENTS ────────────────────────────────────────── */
async function loadEvents() {
  if (appState.fetchController) appState.fetchController.abort();
  appState.fetchController = new AbortController();
  const grid = g('events-grid');
  if (grid) grid.innerHTML = '<div class="no-results"><p>Loading events…</p></div>';
  try {
    const { data, error } = await sb
      .from('events')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'published')
      .order('start_at', { ascending: true })
      .range(appState.page_num * appState.PAGE_SIZE, (appState.page_num + 1) * appState.PAGE_SIZE - 1);
    if (error) throw error;
    appState.hasMore = data && data.length === appState.PAGE_SIZE;
    appState.events = (data || []).map(e => ({
      id: e.id,
      dbId: e.id,
      title: e.title || 'Untitled Event',
      category: e.category_name || 'Event',
      categoryId: e.category_id || null,
      date: e.start_at ? new Date(e.start_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
      dateISO: e.start_at || '',
      time: e.start_at ? new Date(e.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
      doorsOpen: e.doors_open_at ? new Date(e.doors_open_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
      location: e.venue_name || '',
      address: e.address || '',
      lat: e.lat || null,
      lng: e.lng || null,
      speaker: e.speaker || null,
      desc: e.description || '',
      reg: e.registration_method || 'RSVP',
      price: e.price > 0 ? `$${e.price} ${e.currency || 'CAD'}` : 'Free',
      priceNum: e.price || 0,
      mode: e.mode || 'In Person',
      lang: (e.languages || []).join(', '),
      carpool: !!e.allow_carpool,
      tags: [e.category_name || 'Event'],
      emoji: catEmoji(e.category_name),
      poster_url: e.poster_url || null,
      focalX: e.focal_x ?? 0.5,
      focalY: e.focal_y ?? 0.5,
      views: e.view_count || 0,
      createdAt: e.created_at || '',
    }));
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('loadEvents error:', err);
      if (grid) grid.innerHTML = `<div class="no-results"><p>Could not load events. Please try again.</p></div>`;
      return;
    }
  }
  renderCards();
}

function catEmoji(c) {
  return { Workshop: '💼', Festival: '🌟', Screening: '🎬', Retreat: '🌿', Music: '🥁', Art: '📸', Culture: '🎭', Networking: '🤝', Career: '📋' }[c] || '📅';
}

function posterColors(id) {
  const P = [['#0F2027','#203A43'],['#1a1a2e','#16213e'],['#2d1b69','#11998e'],['#0f0c29','#302b63'],['#1a0533','#3d1c78'],['#0d0d0d','#434343'],['#000428','#004e92'],['#141e30','#243b55']];
  const i = typeof id === 'number' ? (id - 1) % P.length : Math.abs((id || '').toString().charCodeAt(0) || 0) % P.length;
  return P[i];
}

function makePosterSVG(ev) {
  const [c1, c2] = posterColors(ev.dbId || ev.id);
  const cat = esc((ev.category || 'EVENT').toUpperCase());
  const safeTitle = esc(ev.title || '');
  const words = safeTitle.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > 18 && line) { lines.push(line); line = w; }
    else { line = (line + ' ' + w).trim(); }
  }
  if (line) lines.push(line);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" style="width:100%;height:100%;display:block;position:absolute;inset:0">
    <defs><linearGradient id="g${esc(String(ev.id))}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
    <rect width="300" height="400" fill="url(#g${esc(String(ev.id))})"/>
    <rect y="0" width="300" height="48" fill="rgba(0,0,0,0.35)"/>
    <rect y="352" width="300" height="48" fill="rgba(0,0,0,0.5)"/>
    <rect y="396" width="300" height="4" fill="#CC2222"/>
    <text x="14" y="28" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="rgba(255,255,255,0.55)" letter-spacing="2">${cat}</text>
    <text x="286" y="28" font-family="system-ui,sans-serif" font-size="9" fill="rgba(255,255,255,0.4)" text-anchor="end">${esc(ev.mode || 'In Person')}</text>
    <text x="14" y="108" font-family="system-ui,sans-serif" font-size="52" fill="rgba(255,255,255,0.8)">${ev.emoji || '📅'}</text>
    ${lines.map((l, i) => `<text x="14" y="${186 + i * 30}" font-family="Georgia,serif" font-size="20" font-weight="700" fill="#fff">${l}</text>`).join('')}
    ${ev.speaker ? `<rect x="14" y="${186 + lines.length * 30 + 10}" width="3" height="16" fill="rgba(204,34,34,0.9)" rx="1.5"/><text x="22" y="${186 + lines.length * 30 + 23}" font-family="system-ui,sans-serif" font-size="11" fill="rgba(255,255,255,0.8)" font-weight="500">${esc(ev.speaker)}</text>` : ''}
    <text x="14" y="368" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.85)">${esc(ev.date || '')}</text>
    <text x="14" y="382" font-family="system-ui,sans-serif" font-size="10" fill="rgba(255,255,255,0.55)">${esc(ev.time || '')}</text>
    <text x="14" y="394" font-family="system-ui,sans-serif" font-size="9" fill="rgba(255,255,255,0.4)">${esc((ev.location || '').slice(0, 36))}</text>
  </svg>`;
}

/* ─── IMAGE CARD RENDERING ──────────────────────────── */
function makeCardImageHTML(ev) {
  const posX = `${((ev.focalX ?? 0.5) * 100).toFixed(1)}%`;
  const posY = `${((ev.focalY ?? 0.5) * 100).toFixed(1)}%`;
  if (ev.poster_url) {
    return `<img
      src="${esc(ev.poster_url)}"
      alt="${esc(ev.title)}"
      loading="lazy"
      style="width:100%;height:100%;object-fit:cover;display:block;position:absolute;inset:0;object-position:${posX} ${posY}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
    ><div style="display:none;position:absolute;inset:0">${makePosterSVG(ev)}</div>`;
  }
  return `<div style="position:absolute;inset:0">${makePosterSVG(ev)}</div>`;
}

/* ─── POSTER PICKER & CROP EDITOR ───────────────────── */
function posterPicked(inp) {
  const f = inp.files[0];
  if (!f) return;
  if (!f.type.startsWith('image/')) { toast('Please select an image file (JPG, PNG, GIF, WebP).', 'err'); inp.value = ''; return; }
  if (f.size > 10 * 1024 * 1024) { toast('Image must be under 10MB.', 'err'); inp.value = ''; return; }
  if (cropState.objectUrl) URL.revokeObjectURL(cropState.objectUrl);
  cropState.file = f;
  cropState.objectUrl = URL.createObjectURL(f);
  cropState.focalX = 0.5;
  cropState.focalY = 0.5;
  cropState.zoom = 1;
  appState.fPosterFile = f;
  openCropEditor();
}

function openCropEditor() {
  document.getElementById('crop-editor-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'crop-editor-overlay';
  overlay.innerHTML = `
    <div id="crop-modal">
      <div id="crop-header">
        <span id="crop-title">Adjust image</span>
        <button id="crop-close" onclick="discardCrop()" aria-label="Cancel">✕</button>
      </div>
      <div id="crop-body">
        <div id="crop-stage-wrap">
          <div id="crop-stage"
            onmousedown="cropDragStart(event)"
            onmousemove="cropDragMove(event)"
            onmouseup="cropDragEnd()"
            onmouseleave="cropDragEnd()"
            ontouchstart="cropTouchStart(event)"
            ontouchmove="cropTouchMove(event)"
            ontouchend="cropDragEnd()">
            <img id="crop-img" src="${cropState.objectUrl}" alt="Event poster" draggable="false">
          </div>
          <div id="crop-hint">Drag to reposition · Scroll or pinch to zoom</div>
        </div>
        <div id="crop-preview-col">
          <div id="crop-preview-label">Card preview</div>
          <div id="crop-preview-card">
            <div id="crop-preview-img-wrap">
              <img id="crop-preview-img" src="${cropState.objectUrl}" alt="Preview" draggable="false">
            </div>
            <div id="crop-preview-info">
              <div id="crop-preview-title">${esc(appState.events[0]?.title || 'Event title')}</div>
              <div id="crop-preview-meta">Workshop · Free</div>
            </div>
          </div>
          <div id="crop-controls">
            <div class="ctrl-row">
              <span class="ctrl-label">Zoom</span>
              <input type="range" id="zoom-slider" min="100" max="300" step="1" value="100" oninput="setZoom(this.value / 100)" style="flex:1">
              <span id="zoom-val" class="ctrl-val">1×</span>
            </div>
            <div class="ctrl-row" style="margin-top:6px">
              <button class="crop-btn-reset" onclick="resetCrop()">Reset position</button>
            </div>
          </div>
        </div>
      </div>
      <div id="crop-footer">
        <button id="crop-discard" onclick="discardCrop()">Cancel</button>
        <button id="crop-confirm" onclick="confirmCrop()">Use this image →</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  updateCropImage();

  const stage = document.getElementById('crop-stage');
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    setZoom(Math.min(3, Math.max(1, cropState.zoom + (e.deltaY > 0 ? -0.08 : 0.08))));
  }, { passive: false });

  let lastDist = 0;
  stage.addEventListener('touchstart', e => {
    if (e.touches.length === 2) lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  });
  stage.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setZoom(Math.min(3, Math.max(1, cropState.zoom + (dist - lastDist) / 200)));
      lastDist = dist;
    }
  }, { passive: false });
}

function updateCropImage() {
  const img = document.getElementById('crop-img');
  const prev = document.getElementById('crop-preview-img');
  if (!img) return;
  const posX = `${(cropState.focalX * 100).toFixed(1)}%`;
  const posY = `${(cropState.focalY * 100).toFixed(1)}%`;
  img.style.transform = `scale(${cropState.zoom})`;
  img.style.transformOrigin = `${posX} ${posY}`;
  if (prev) { prev.style.objectPosition = `${posX} ${posY}`; prev.style.transform = `scale(${cropState.zoom})`; prev.style.transformOrigin = `${posX} ${posY}`; }
}

function setZoom(z) {
  cropState.zoom = Math.min(3, Math.max(1, z));
  const slider = document.getElementById('zoom-slider');
  const val = document.getElementById('zoom-val');
  if (slider) slider.value = Math.round(cropState.zoom * 100);
  if (val) val.textContent = cropState.zoom.toFixed(1) + '×';
  updateCropImage();
}

function resetCrop() { cropState.focalX = 0.5; cropState.focalY = 0.5; cropState.zoom = 1; setZoom(1); updateCropImage(); }

function cropDragStart(e) {
  if (e.button !== 0) return;
  cropState.dragging = true;
  cropState.dragStartX = e.clientX; cropState.dragStartY = e.clientY;
  cropState.dragStartFX = cropState.focalX; cropState.dragStartFY = cropState.focalY;
  document.getElementById('crop-stage').style.cursor = 'grabbing';
}

function cropDragMove(e) {
  if (!cropState.dragging) return;
  const stage = document.getElementById('crop-stage');
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  cropState.focalX = Math.min(1, Math.max(0, cropState.dragStartFX - (e.clientX - cropState.dragStartX) / (rect.width * 0.5)));
  cropState.focalY = Math.min(1, Math.max(0, cropState.dragStartFY - (e.clientY - cropState.dragStartY) / (rect.height * 0.5)));
  updateCropImage();
}

function cropDragEnd() {
  cropState.dragging = false;
  const stage = document.getElementById('crop-stage');
  if (stage) stage.style.cursor = 'grab';
}

function cropTouchStart(e) {
  if (e.touches.length !== 1) return;
  cropState.dragging = true;
  cropState.dragStartX = e.touches[0].clientX; cropState.dragStartY = e.touches[0].clientY;
  cropState.dragStartFX = cropState.focalX; cropState.dragStartFY = cropState.focalY;
}

function cropTouchMove(e) {
  if (!cropState.dragging || e.touches.length !== 1) return;
  e.preventDefault();
  const stage = document.getElementById('crop-stage');
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  cropState.focalX = Math.min(1, Math.max(0, cropState.dragStartFX - (e.touches[0].clientX - cropState.dragStartX) / (rect.width * 0.5)));
  cropState.focalY = Math.min(1, Math.max(0, cropState.dragStartFY - (e.touches[0].clientY - cropState.dragStartY) / (rect.height * 0.5)));
  updateCropImage();
}

function confirmCrop() {
  document.getElementById('crop-editor-overlay')?.remove();
  appState.fPosterFocalX = cropState.focalX;
  appState.fPosterFocalY = cropState.focalY;
  const area = document.getElementById('upload-area');
  if (area) {
    area.innerHTML = `
      <div id="upload-preview-wrap">
        <img id="upload-preview" src="${cropState.objectUrl}" alt="Poster preview"
          style="object-position:${(cropState.focalX * 100).toFixed(1)}% ${(cropState.focalY * 100).toFixed(1)}%">
        <button id="upload-change-btn" onclick="document.getElementById('f-poster').click()" type="button">Change image</button>
      </div>
      <input id="f-poster" type="file" style="display:none" accept="image/*" onchange="posterPicked(this)">`;
    area.onclick = null;
  }
}

function discardCrop() {
  document.getElementById('crop-editor-overlay')?.remove();
  if (cropState.objectUrl) { URL.revokeObjectURL(cropState.objectUrl); cropState.objectUrl = null; }
  cropState.file = null;
  appState.fPosterFile = null;
}

/* ─── POSTER UPLOAD ─────────────────────────────────── */
async function uploadPosterIfNeeded() {
  if (!appState.fPosterFile) return null;
  const f = appState.fPosterFile;
  const ext = f.name.split('.').pop().toLowerCase();
  if (!['jpg','jpeg','png','gif','webp'].includes(ext)) { toast('Unsupported image format.', 'err'); return null; }
  const path = `events/${appState.authUser.id}/${Date.now()}.${ext}`;
  const { data: uploadData, error: uploadErr } = await sb.storage.from('posters').upload(path, f, { cacheControl: '3600', upsert: false });
  if (uploadErr) { toast(`Image upload failed: ${uploadErr.message}. Event will save without image.`, 'err'); return null; }
  const { data: urlData } = sb.storage.from('posters').getPublicUrl(uploadData.path);
  return urlData?.publicUrl || null;
}

/* ─── SORT & FILTER ─────────────────────────────────── */
function getSortedFiltered() {
  let list = appState.filter === 'All' ? [...appState.events] : appState.events.filter(e => e.category === appState.filter);
  if (appState.searchQuery) {
    const q = appState.searchQuery.toLowerCase();
    list = list.filter(e => e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || (e.speaker || '').toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
  }
  if (appState.userLat && appState.userLng) {
    list = list.map(e => ({ ...e, dist: (e.lat && e.lng) ? distKm(appState.userLat, appState.userLng, e.lat, e.lng) : 9999 }));
  }
  switch (appState.sortBy) {
    case 'distance': list.sort((a, b) => (a.dist || 9999) - (b.dist || 9999)); break;
    case 'popular': list.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
    case 'newest': list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    case 'trending':
      list.sort((a, b) => {
        const scoreA = (a.views || 0) / Math.max(1, (Date.now() - new Date(a.dateISO)) / 86400000);
        const scoreB = (b.views || 0) / Math.max(1, (Date.now() - new Date(b.dateISO)) / 86400000);
        return scoreB - scoreA;
      }); break;
    default: list.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO)); break;
  }
  return list;
}

function renderCards() {
  const grid = g('events-grid');
  const chipsEl = g('filter-chips');
  const cats = ['All', ...new Set(appState.events.map(e => e.category))];
  if (chipsEl) chipsEl.innerHTML = cats.map(c => `<button class="chip${appState.filter === c ? ' active' : ''}" onclick="setFilter('${esc(c)}')">${esc(c)}</button>`).join('');
  document.querySelectorAll('.sort-chip').forEach(btn => btn.classList.toggle('active', btn.dataset.sort === appState.sortBy));
  const list = getSortedFiltered();
  if (!grid) return;
  if (!list.length) { grid.innerHTML = `<div class="no-results"><p>${appState.searchQuery ? `No events matching "${esc(appState.searchQuery)}"` : 'No events found.'}</p></div>`; return; }
  grid.innerHTML = list.map((ev, i) => {
    const realIdx = appState.events.findIndex(x => String(x.id) === String(ev.id));
    const idx = realIdx >= 0 ? realIdx : i;
    const distBadge = ev.dist && ev.dist < 9999 ? `<span class="tag tag-dist">${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', 10)} ${ev.dist < 1 ? (ev.dist * 1000).toFixed(0) + 'm' : ev.dist.toFixed(1) + 'km'}</span>` : '';
    const imgHTML = makeCardImageHTML(ev);
    return `<div class="ecard fu" style="animation-delay:${i * 0.03}s" onclick="openDetail(${idx})">
      <div class="ecard-img">${imgHTML}</div>
      <div class="ecard-body">
        <div class="ecard-tags">
          <span class="tag tag-cat">${esc(ev.category)}</span>
          ${ev.price === 'Free' ? '<span class="tag tag-free">Free</span>' : ''}
          ${ev.lang?.includes('Persian') ? '<span class="tag tag-lang">FA</span>' : ''}
          ${distBadge}
        </div>
        <div class="ecard-title">${esc(ev.title)}</div>
        <div class="ecard-meta">
          <div class="meta-row">${icon('M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5')} ${esc(ev.date)}</div>
          <div class="meta-row">${icon('M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z')} ${esc(ev.time)}</div>
          <div class="meta-row">${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z')} ${esc(ev.location)}</div>
        </div>
      </div>
      <div class="ecard-foot">
        <span class="ecard-price">${esc(ev.price)}</span>
        <button class="btn-view" onclick="event.stopPropagation();openDetail(${idx})">View →</button>
      </div>
    </div>`;
  }).join('');
  const countEl = g('events-count');
  if (countEl) countEl.textContent = `${list.length} event${list.length !== 1 ? 's' : ''}`;
}

function openDetail(idx) {
  const ev = appState.events[idx];
  if (!ev) return;
  appState.selectedEvent = ev;
  if (ev.dbId) sb.rpc('increment_view_count', { event_id: ev.dbId }).catch(() => {});
  go('detail', ev);
}

function setFilter(f) { appState.filter = f; renderCards(); }
function setSort(s) { appState.sortBy = s; renderCards(); }
function doSearch(val) { appState.searchQuery = val.toLowerCase().trim(); renderCards(); }

/* ─── ROUTER ────────────────────────────────────────── */
function go(p, data) {
  appState.page = p;
  if (data) appState.selectedEvent = data;
  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  g('page-' + p)?.classList.add('active');
  window.scrollTo(0, 0);
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.page === p));
  closeDrawer(); closeDropdown();
  if (p === 'home') { loadEvents(); return; }
  if (p === 'detail') { renderDetail(); return; }
  if (p === 'account') { if (!appState.authUser) { openModal('login'); return; } renderAccount(); return; }
  if (p === 'create') { if (!appState.authUser) { openModal('login'); return; } renderCreate(); return; }
  if (p === 'about') { renderAbout(); return; }
  if (p === 'contact') { renderContact(); return; }
}

/* ─── DETAIL ────────────────────────────────────────── */
async function renderDetail() {
  const ev = appState.selectedEvent;
  if (!ev) return;
  const el = g('detail-content');
  if (!el) return;
  el.innerHTML = `<div class="breadcrumb"><a href="#" onclick="go('home');return false">← Events</a> / <span>${esc(ev.title)}</span></div><div style="text-align:center;padding:40px;color:var(--ink3)">Loading…</div>`;
  let coList = [], crList = [];
  if (ev.dbId) {
    const [co, cr] = await Promise.all([
      sb.from('carpool_offers').select('*,users(full_name)').eq('event_id', ev.dbId),
      sb.from('carpool_requests').select('*,users(full_name)').eq('event_id', ev.dbId),
    ]);
    coList = co.data || []; crList = cr.data || [];
  }
  const posX = `${((ev.focalX ?? 0.5) * 100).toFixed(1)}%`;
  const posY = `${((ev.focalY ?? 0.5) * 100).toFixed(1)}%`;
  const posterHTML = ev.poster_url
    ? `<img src="${esc(ev.poster_url)}" alt="${esc(ev.title)}" style="width:100%;display:block;object-fit:cover;object-position:${posX} ${posY}" onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=detail-poster-ph>${makePosterSVG(ev).replace(/'/g,"\\'")} </div>')">`
    : `<div class="detail-poster-ph">${makePosterSVG(ev)}</div>`;
  el.innerHTML = `
    <div class="breadcrumb"><a href="#" onclick="go('home');return false">← Events</a> / <span>${esc(ev.title)}</span></div>
    <div class="detail-grid">
      <div class="detail-poster-wrap">${posterHTML}</div>
      <div class="detail-side">
        <div class="detail-tags"><span class="tag tag-cat">${esc(ev.category)}</span>${ev.price === 'Free' ? '<span class="tag tag-free">Free</span>' : ''}</div>
        <h1 class="detail-title">${esc(ev.title)}</h1>
        <p class="detail-desc">${esc(ev.desc)}</p>
        <div class="meta-box">
          <div class="mrow"><div class="mrow-icon">${icon('M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5')}</div><div><div class="mrow-label">Date</div><div class="mrow-val">${esc(ev.date)}</div></div></div>
          <div class="mrow"><div class="mrow-icon">${icon('M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z')}</div><div><div class="mrow-label">Time</div><div class="mrow-val">${esc(ev.time)}</div>${ev.doorsOpen ? `<div class="mrow-sub">Doors open ${esc(ev.doorsOpen)}</div>` : ''}</div></div>
          <div class="mrow"><div class="mrow-icon">${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z')}</div><div><div class="mrow-label">Location</div><div class="mrow-val">${esc(ev.location)}</div><div class="mrow-sub">${esc(ev.address)}</div></div></div>
          ${ev.speaker ? `<div class="mrow"><div class="mrow-icon">${icon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z')}</div><div><div class="mrow-label">Speaker</div><div class="mrow-val">${esc(ev.speaker)}</div></div></div>` : ''}
          <div class="mrow"><div class="mrow-icon">${icon('M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z')}</div><div><div class="mrow-label">Price</div><div class="mrow-val">${esc(ev.price)}</div></div></div>
          ${ev.lang ? `<div class="mrow"><div class="mrow-icon">${icon('M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802')}</div><div><div class="mrow-label">Language</div><div class="mrow-val">${esc(ev.lang)}</div></div></div>` : ''}
        </div>
        <div class="detail-actions">
          <button class="btn-rsvp" onclick="doRSVP()">${ev.reg === 'RSVP' ? 'RSVP for this event →' : 'Get tickets →'}</button>
          <button class="btn-secondary" onclick="shareEv()">Share event</button>
        </div>
        <div class="accordion">
          ${ev.carpool ? `
          <div class="acc-item" id="acc-co">
            <div class="acc-head" onclick="toggleAcc('co')">${icon('M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H3m9 6v-3m0 3h6m-6-3v-6m3 6V9m9 9v-6m0 6h-6m6 0h3.75m-3.75-6a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3 0h-6')} Carpool offers (${coList.length}) ${icon('M19.5 8.25l-7.5 7.5-7.5-7.5')}</div>
            <div class="acc-body"><div class="acc-inner">
              ${coList.length ? coList.map(o => `<div class="carpool-entry"><strong>${esc(o.users?.full_name || 'Someone')}</strong> — ${o.seats_available} seat${o.seats_available > 1 ? 's' : ''} from ${esc(o.departure_location || 'TBD')}<br><span style="font-size:11px;color:var(--ink3)">${esc(o.notes || '')}</span></div>`).join('') : '<p style="color:var(--ink3)">No carpool offers yet.</p>'}
              ${appState.authUser ? `<button class="btn-secondary" style="margin-top:10px;width:100%" onclick="openCarpoolModal('offer','${esc(String(ev.dbId || ev.id))}')">+ Offer a ride</button>` : `<p style="font-size:12px;color:var(--ink3);margin-top:8px"><a href="#" onclick="openModal()" style="color:var(--red);font-weight:600">Sign in</a> to offer a ride</p>`}
            </div></div>
          </div>
          <div class="acc-item" id="acc-cr">
            <div class="acc-head" onclick="toggleAcc('cr')">${icon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z')} Carpool requests (${crList.length}) ${icon('M19.5 8.25l-7.5 7.5-7.5-7.5')}</div>
            <div class="acc-body"><div class="acc-inner">
              ${crList.length ? crList.map(r => `<div class="carpool-entry"><strong>${esc(r.users?.full_name || 'Someone')}</strong> — from ${esc(r.pickup_location || 'TBD')}<br><span style="font-size:11px;color:var(--ink3)">${esc(r.notes || '')}</span></div>`).join('') : '<p style="color:var(--ink3)">No requests yet.</p>'}
              ${appState.authUser ? `<button class="btn-secondary" style="margin-top:10px;width:100%" onclick="openCarpoolModal('request','${esc(String(ev.dbId || ev.id))}')">+ Request a ride</button>` : `<p style="font-size:12px;color:var(--ink3);margin-top:8px"><a href="#" onclick="openModal()" style="color:var(--red);font-weight:600">Sign in</a> to request a ride</p>`}
            </div></div>
          </div>` : ''}
          <div class="acc-item" id="acc-ph">
            <div class="acc-head" onclick="toggleAcc('ph')">${icon('M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z')} Event photos ${icon('M19.5 8.25l-7.5 7.5-7.5-7.5')}</div>
            <div class="acc-body"><div class="acc-inner" style="color:var(--ink3);font-size:13px">Photos are available to registered attendees only.</div></div>
          </div>
        </div>
      </div>
    </div>`;
}

async function doRSVP() {
  if (!appState.authUser) { openModal(); return; }
  const ev = appState.selectedEvent;
  if (!ev) { toast('No event selected.', 'err'); return; }
  if (!ev.dbId || typeof ev.dbId === 'number') { toast('Sign in and RSVP to real events from the homepage.', 'err'); return; }
  const { error } = await sb.from('registrations').insert({ event_id: ev.dbId, user_id: appState.authUser.id, status: 'pending' });
  if (error?.code === '23505') toast("You're already registered!", 'err');
  else if (error) toast(error.message, 'err');
  else toast('Registered! Check your email for confirmation.', 'ok');
}

function toggleAcc(id) { g('acc-' + id)?.classList.toggle('open'); }
function shareEv() {
  if (navigator.share) navigator.share({ title: appState.selectedEvent?.title, url: location.href });
  else { navigator.clipboard?.writeText(location.href); toast('Link copied!', 'ok'); }
}

/* ─── CARPOOL MODAL ─────────────────────────────────── */
function openCarpoolModal(type, evId) {
  const isOffer = type === 'offer';
  const el = document.createElement('div');
  el.className = 'cp-overlay'; el.id = 'cp-overlay';
  el.innerHTML = `<div class="cp-modal">
    <div class="cp-head"><h3>${isOffer ? '🚗 Offer a ride' : '🙋 Request a ride'}</h3><button class="drawer-x" onclick="document.getElementById('cp-overlay').remove()">✕</button></div>
    <div class="cp-body">
      <div class="mfield"><label class="mlabel">${isOffer ? 'Departure' : 'Pickup'} location *</label><input id="cp-loc" type="text" class="minput" placeholder="e.g. Yonge & Sheppard, Toronto"></div>
      ${isOffer ? `<div class="mfield"><label class="mlabel">Available seats *</label><input id="cp-seats" type="number" class="minput" placeholder="3" min="1" max="8"></div><div class="mfield"><label class="mlabel">Departure time</label><input id="cp-time" type="datetime-local" class="minput"></div>` : ''}
      <div class="mfield"><label class="mlabel">Notes (optional)</label><textarea id="cp-notes" class="minput" style="min-height:70px;resize:vertical" placeholder="Any extra details…"></textarea></div>
      <button class="btn-auth" onclick="submitCarpool('${esc(type)}','${esc(evId)}')">Submit</button>
    </div>
  </div>`;
  el.onclick = e => { if (e.target === el) el.remove(); };
  document.body.appendChild(el);
}

async function submitCarpool(type, evId) {
  const loc = v('cp-loc');
  if (!loc) { toast('Enter a location.', 'err'); return; }
  const isOffer = type === 'offer';
  const payload = { event_id: evId, user_id: appState.authUser.id, notes: v('cp-notes') };
  if (isOffer) {
    payload.departure_location = loc;
    payload.seats_available = parseInt(g('cp-seats')?.value || 1);
    const t = g('cp-time')?.value;
    if (t) payload.departure_time = new Date(t).toISOString();
    const { error } = await sb.from('carpool_offers').insert(payload);
    if (error) { toast(error.message, 'err'); return; }
  } else {
    payload.pickup_location = loc;
    const { error } = await sb.from('carpool_requests').insert(payload);
    if (error) { toast(error.message, 'err'); return; }
  }
  g('cp-overlay')?.remove();
  toast(`Carpool ${isOffer ? 'offer' : 'request'} submitted!`, 'ok');
  renderDetail();
}

/* ─── ACCOUNT ───────────────────────────────────────── */
async function renderAccount() {
  const name = appState.profile?.full_name || appState.authUser?.email?.split('@')[0] || 'User';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const { data: pData } = await sb.from('zee_points').select('amount').eq('user_id', appState.authUser.id);
  const pts = (pData || []).reduce((s, r) => s + r.amount, 0);
  const { data: tickets } = await sb.from('registrations').select('*,events(title,start_at,venue_name)').eq('user_id', appState.authUser.id).order('created_at', { ascending: false });
  const { data: myEvs } = await sb.from('events').select('*').eq('created_by', appState.authUser.id).order('created_at', { ascending: false });
  const el = g('account-content');
  if (!el) return;
  el.innerHTML = `
    <div class="acct-banner">
      <div class="acct-av">${initials}</div>
      <div class="acct-info"><h2>${esc(name)}</h2><p>${esc(appState.authUser.email)}</p><p style="margin-top:2px;font-size:11px;color:#404040">Member since ${new Date(appState.authUser.created_at).getFullYear()}</p></div>
      <div class="zee-box"><div class="n">${pts}</div><div class="l">ZeePoints</div></div>
    </div>
    <div class="acct-tabs">
      <div class="atab${appState.acctTab === 'tickets' ? ' on' : ''}" onclick="switchAcctTab('tickets')">My tickets (${(tickets || []).length})</div>
      <div class="atab${appState.acctTab === 'events' ? ' on' : ''}" onclick="switchAcctTab('events')">My events (${(myEvs || []).length})</div>
      <div class="atab${appState.acctTab === 'referrals' ? ' on' : ''}" onclick="switchAcctTab('referrals')">Points & referrals</div>
    </div>
    <div class="apanel${appState.acctTab === 'tickets' ? ' on' : ''}" id="ap-tickets">
      ${(tickets || []).length ? (tickets || []).map(r => `<div class="tcard"><div class="tcard-img">📅</div><div class="tcard-body"><div class="tcard-title">${esc(r.events?.title || 'Event')}</div><div class="tcard-meta">${r.events?.start_at ? new Date(r.events.start_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}${r.events?.venue_name ? '<br>' + esc(r.events.venue_name) : ''}</div></div><div class="tcard-side"><span class="status-pill ${esc(r.status)}">${esc(r.status)}</span></div></div>`).join('') : `<div class="empty">${icon('M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z', 36)}<p>No tickets yet. <a href="#" onclick="go('home');return false" style="color:var(--red);font-weight:600">Browse events →</a></p></div>`}
    </div>
    <div class="apanel${appState.acctTab === 'events' ? ' on' : ''}" id="ap-events">
      <div style="margin-bottom:14px"><button class="btn-save" onclick="go('create')">+ Create new event</button></div>
      ${(myEvs || []).length ? (myEvs || []).map(e => `<div class="tcard"><div class="tcard-img">📅</div><div class="tcard-body"><div class="tcard-title">${esc(e.title)}</div><div class="tcard-meta">${e.start_at ? new Date(e.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}<br><span style="font-size:10px;font-weight:700;text-transform:uppercase;color:${e.status === 'published' ? 'var(--green)' : 'var(--ink3)'}">${esc(e.status)}</span></div></div><div class="tcard-side"><button class="btn-view">Manage</button></div></div>`).join('') : `<div class="empty"><p>No events created yet.</p></div>`}
    </div>
    <div class="apanel${appState.acctTab === 'referrals' ? ' on' : ''}" id="ap-referrals">
      <div class="ref-card">
        <h4>ZeePoints</h4>
        <p>Earn points by attending events and referring friends. Redeem for prizes and discounts.</p>
        <div class="stats-grid">
          <div class="stat-box"><div class="stat-n">${pts}</div><div class="stat-l">Available</div></div>
          <div class="stat-box"><div class="stat-n" style="color:var(--red)">${pts}</div><div class="stat-l">Lifetime</div></div>
          <div class="stat-box"><div class="stat-n" style="color:var(--ink3)">0</div><div class="stat-l">Redeemed</div></div>
        </div>
        <h4 style="margin-bottom:7px">Your referral link</h4>
        <p>Refer friends and earn 50 ZeePoints for each signup.</p>
        <div class="ref-link"><span id="ref-url">zeenle.com/ref/${esc(appState.profile?.referral_code || appState.authUser.id.slice(0, 8))}</span><button class="btn-copy" onclick="navigator.clipboard?.writeText(g('ref-url').textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)">Copy</button></div>
      </div>
    </div>`;
}

function switchAcctTab(t) { appState.acctTab = t; renderAccount(); }

/* ─── CREATE EVENT ──────────────────────────────────── */
async function renderCreate() {
  await loadCategories();
  const catOptions = appState.categories.length
    ? appState.categories.map(c => `<option value="${esc(String(c.id))}">${esc(c.name)}</option>`).join('')
    : ['Workshop','Festival','Screening','Retreat','Music','Art','Culture','Networking','Other'].map(n => `<option value="">${n}</option>`).join('');
  const el = g('create-content');
  if (!el) return;
  el.innerHTML = `
    <h1 class="form-title">Create an event</h1>
    <p class="form-sub">Fill in the details below to publish your event on Zeenle.</p>
    <div class="fsec">
      <div class="fsec-title">${icon('M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z')} Main information</div>
      <div class="frow x1"><div class="ff"><label class="flabel">Event poster <span style="font-size:11px;font-weight:400;color:var(--ink3)">(image, max 10MB)</span></label>
        <div class="upload-area" id="upload-area" onclick="document.getElementById('f-poster').click()">
          ${icon('M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z', 22)}
          <p>Click to upload event poster</p><span>PNG, JPG, GIF, WebP — max 10MB</span>
          <input id="f-poster" type="file" style="display:none" accept="image/*" onchange="posterPicked(this)">
        </div>
      </div></div>
      <div class="frow"><div class="ff"><label class="flabel">Title <span class="req">*</span></label><input id="f-title" type="text" class="finput" placeholder="Event name" maxlength="120"></div><div class="ff"><label class="flabel">Category</label><select id="f-cat" class="fselect">${catOptions}</select></div></div>
      <div class="frow x1"><div class="ff"><label class="flabel">Description</label><textarea id="f-desc" class="ftextarea" placeholder="Tell attendees what this event is about…" maxlength="2000"></textarea></div></div>
      <div class="frow x3"><div class="ff"><label class="flabel">Start date & time <span class="req">*</span></label><input id="f-start" type="datetime-local" class="finput"></div><div class="ff"><label class="flabel">End date & time</label><input id="f-end" type="datetime-local" class="finput"></div><div class="ff"><label class="flabel">Doors open</label><input id="f-doors" type="datetime-local" class="finput"></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Registration method</label><div class="tgrp"><button class="tbtn on" onclick="appState.fReg='RSVP';tgt(this)">RSVP</button><button class="tbtn" onclick="appState.fReg='Ticketing';tgt(this)">Ticketing</button></div></div><div class="ff"><label class="flabel">Currency</label><div class="tgrp"><button class="tbtn on" onclick="appState.fCurr='CAD';tgt(this)">CAD</button><button class="tbtn" onclick="appState.fCurr='USD';tgt(this)">USD</button><button class="tbtn" onclick="appState.fCurr='EUR';tgt(this)">EUR</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Price (0 = free)</label><input id="f-price" type="number" class="finput" placeholder="0" min="0" step="0.01"></div><div class="ff"><label class="flabel">Max tickets (0 = unlimited)</label><input id="f-max" type="number" class="finput" placeholder="0"></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Contact email</label><input id="f-email" type="email" class="finput" placeholder="contact@example.com"></div><div class="ff"><label class="flabel">Speaker (optional)</label><input id="f-speaker" type="text" class="finput" placeholder="Speaker name"></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title">${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z')} Location</div>
      <div class="frow"><div class="ff"><label class="flabel">Mode</label><div class="tgrp"><button class="tbtn on" onclick="appState.fMode='In Person';tgt(this)">In person</button><button class="tbtn" onclick="appState.fMode='Online';tgt(this)">Online</button><button class="tbtn" onclick="appState.fMode='Hybrid';tgt(this)">Hybrid</button></div></div><div class="ff"><label class="flabel">Address visible to</label><div class="tgrp"><button class="tbtn on" onclick="appState.fAddrVis='All';tgt(this)">All</button><button class="tbtn" onclick="appState.fAddrVis='Approved';tgt(this)">Approved</button><button class="tbtn" onclick="appState.fAddrVis='Email';tgt(this)">Email only</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Venue name</label><input id="f-venue" type="text" class="finput" placeholder="e.g. Welcome Centre"></div><div class="ff"><label class="flabel">Street address</label><input id="f-addr" type="text" class="finput" placeholder="123 Main St"></div></div>
      <div class="frow x3"><div class="ff"><label class="flabel">City</label><input id="f-city" type="text" class="finput" placeholder="Toronto"></div><div class="ff"><label class="flabel">Province</label><input id="f-prov" type="text" class="finput" placeholder="ON"></div><div class="ff"><label class="flabel">Postal code</label><input id="f-postal" type="text" class="finput" placeholder="M1A 1A1"></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title">${icon('M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75')} Settings</div>
      <div class="frow"><div class="ff"><label class="flabel">Public event</label><div class="tgrp"><button class="tbtn on" onclick="appState.fPublic=true;tgt(this)">Yes</button><button class="tbtn" onclick="appState.fPublic=false;tgt(this)">No (private)</button></div></div><div class="ff"><label class="flabel">Needs approval</label><div class="tgrp"><button class="tbtn" onclick="appState.fApproval=true;tgt(this)">Yes</button><button class="tbtn on" onclick="appState.fApproval=false;tgt(this)">No</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Walk-in tickets</label><div class="tgrp"><button class="tbtn on" onclick="appState.fDoor=true;tgt(this)">Yes</button><button class="tbtn" onclick="appState.fDoor=false;tgt(this)">No</button></div></div><div class="ff"><label class="flabel">Allow carpool</label><div class="tgrp"><button class="tbtn on" onclick="appState.fCarpool=true;tgt(this)">Yes</button><button class="tbtn" onclick="appState.fCarpool=false;tgt(this)">No</button></div></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title">${icon('M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802')} Languages</div>
      <div class="lang-wrap">${['English','French','Spanish','Persian','Hindi','Arabic','Mandarin','Cantonese','Portuguese','German','Dutch','Italian','Russian','Ukrainian'].map(l => `<button class="lchip${appState.fLangs.includes(l) ? ' on' : ''}" onclick="toggleLang('${esc(l)}',this)">${esc(l)}</button>`).join('')}</div>
    </div>
    <div class="form-actions">
      <button class="btn-save" id="save-btn" onclick="submitEvent()">Publish event</button>
      <button class="btn-cancel-form" onclick="go('home')">Cancel</button>
    </div>`;
}

function tgt(btn) { btn.closest('.tgrp').querySelectorAll('.tbtn').forEach(b => b.classList.remove('on')); btn.classList.add('on'); }
function toggleLang(l, btn) {
  if (appState.fLangs.includes(l)) { appState.fLangs = appState.fLangs.filter(x => x !== l); btn.classList.remove('on'); }
  else { appState.fLangs.push(l); btn.classList.add('on'); }
}

async function submitEvent() {
  const title = v('f-title'), start = v('f-start');
  if (!title) { toast('Event title is required.', 'err'); return; }
  if (!start) { toast('Start date and time are required.', 'err'); return; }
  const btn = g('save-btn');
  setBtnLoad(btn, 'Publishing…');
  const catSelect = g('f-cat');
  const categoryId = catSelect?.value && catSelect.value !== '' ? catSelect.value : null;
  const categoryName = catSelect?.options[catSelect.selectedIndex]?.text || 'Event';
  const posterUrl = await uploadPosterIfNeeded();
  const { error } = await sb.from('events').insert({
    created_by: appState.authUser.id,
    title: title.trim(),
    description: v('f-desc'),
    start_at: new Date(start).toISOString(),
    end_at: v('f-end') ? new Date(v('f-end')).toISOString() : null,
    doors_open_at: v('f-doors') ? new Date(v('f-doors')).toISOString() : null,
    registration_method: appState.fReg,
    currency: appState.fCurr,
    price: parseFloat(v('f-price') || 0),
    max_tickets: parseInt(v('f-max') || 0),
    mode: appState.fMode,
    address_visible_to: appState.fAddrVis,
    venue_name: v('f-venue'),
    address: v('f-addr'),
    city: v('f-city'),
    province: v('f-prov'),
    postal_code: v('f-postal'),
    contact_email: v('f-email'),
    speaker: v('f-speaker') || null,
    is_public: appState.fPublic,
    status: 'published',
    needs_approval: appState.fApproval,
    tickets_at_door: appState.fDoor,
    allow_carpool: appState.fCarpool,
    languages: appState.fLangs,
    category_id: categoryId,
    category_name: categoryName,
    poster_url: posterUrl,
    focal_x: appState.fPosterFocalX ?? 0.5,
    focal_y: appState.fPosterFocalY ?? 0.5,
    view_count: 0,
  }).select().single();
  setBtnLoad(btn, 'Publish event', false);
  if (error) { toast(error.message, 'err'); return; }
  appState.fLangs = []; appState.fPublic = true; appState.fPosterFile = null;
  appState.fPosterFocalX = 0.5; appState.fPosterFocalY = 0.5;
  toast('Event published!', 'ok');
  await loadEvents();
  go('home');
}

/* ─── ABOUT ─────────────────────────────────────────── */
function renderAbout() {
  const el = g('about-content');
  if (!el) return;
  el.innerHTML = `
    <div class="page-hero"><h1>About Zeenle</h1><p>A community-first events platform built to connect people through meaningful experiences in the Greater Toronto Area.</p></div>
    <div class="mission-card"><h2>Our mission</h2><p>Zeenle was created with a simple belief: communities grow stronger when people come together. We make it easy to discover local events — workshops, cultural screenings, wellness retreats, festivals — and equally easy to organize them.</p></div>
    <div class="values-grid">
      <div class="value-item"><div class="vi">🤝</div><h3>Community first</h3><p>Every feature we build starts with one question: does this help people connect?</p></div>
      <div class="value-item"><div class="vi">🌍</div><h3>Inclusive by design</h3><p>Events in multiple languages, accessible to everyone regardless of background.</p></div>
      <div class="value-item"><div class="vi">🌱</div><h3>Local impact</h3><p>Real communities, real neighbourhoods, and real relationships — not algorithms.</p></div>
    </div>
    <div class="content-grid">
      <div class="content-card"><h2>${icon('M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5')} Our story</h2><p>Zeenle started as a solution to a problem we experienced firsthand — great events happening all around us, but no single place to find them.</p><p>Today, Zeenle hosts workshops, screenings, retreats, and festivals across the GTA.</p></div>
      <div class="content-card"><h2>${icon('M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z')} What we offer</h2><p>Free and paid event listing, RSVP and ticketing management, carpooling coordination, ZeePoints loyalty rewards, and a growing community directory.</p></div>
    </div>
    <div style="text-align:center;padding:16px 0"><button class="btn-save" onclick="go('contact')">Get in touch →</button></div>`;
}

/* ─── CONTACT ───────────────────────────────────────── */
function renderContact() {
  const el = g('contact-content');
  if (!el) return;
  el.innerHTML = `
    <div class="page-hero"><h1>Contact us</h1><p>Reach out for partnerships, event support, or just to say hello.</p></div>
    <div class="contact-layout">
      <div>
        <div class="contact-details">
          <h2>Get in touch</h2>
          <div class="cd-row">${icon('M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z', 15)}<span><strong>Phone</strong><br>416 300-0602</span></div>
          <div class="cd-row">${icon('M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75', 15)}<span><strong>Email</strong><br>mrezair@zeenle.com</span></div>
          <div class="cd-row">${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z', 15)}<span><strong>Location</strong><br>Greater Toronto Area, Ontario, Canada</span></div>
        </div>
        <div class="contact-form-card">
          <h2>Send a message</h2>
          <div class="mfield"><label class="mlabel">Your name</label><input type="text" class="minput" placeholder="Full name"></div>
          <div class="mfield"><label class="mlabel">Email</label><input type="email" class="minput" placeholder="you@example.com"></div>
          <div class="mfield"><label class="mlabel">Subject</label><input type="text" class="minput" placeholder="What is this about?"></div>
          <div class="mfield"><label class="mlabel">Message</label><textarea class="minput" style="min-height:100px;resize:vertical" placeholder="How can we help?"></textarea></div>
          <button class="btn-auth" onclick="toast('Message sent! We\\'ll be in touch soon.','ok')">Send message →</button>
        </div>
      </div>
      <div class="ceo-card">
        <div class="ceo-photo"><div class="ceo-photo-placeholder">${icon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', 56)}<p>Founder photo</p></div></div>
        <div class="ceo-info">
          <h3>Mohammad Reza Irani</h3>
          <div class="ceo-title">Founder & CEO, Zeenle</div>
          <p>With a passion for community and technology, Mohammad founded Zeenle to make it easier for people to discover and attend meaningful local events across the Greater Toronto Area.</p>
        </div>
      </div>
    </div>`;
}

/* ─── MODAL / DRAWER / DROPDOWN ─────────────────────── */
function openModal(tab = 'login') { g('auth-modal').classList.add('open'); switchTab(tab); }
function closeModal() { g('auth-modal').classList.remove('open'); }
function switchTab(tab) {
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
  document.querySelectorAll('.mform').forEach(f => f.classList.toggle('on', f.id === 'mf-' + tab));
  document.querySelectorAll('.phone-step').forEach(s => s.classList.toggle('on', tab === 'phone'));
  if (tab === 'phone') renderPhone();
}
function toggleDropdown() { g('nav-dd').classList.toggle('open'); }
function closeDropdown() { g('nav-dd')?.classList.remove('open'); }
function openDrawer() { g('overlay').classList.add('open'); g('drawer').classList.add('open'); }
function closeDrawer() { g('overlay').classList.remove('open'); g('drawer').classList.remove('open'); }

/* ─── INIT ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await bootAuth();
  updateLocBar();
  await loadEvents();
  g('hamburger')?.addEventListener('click', openDrawer);
  g('overlay')?.addEventListener('click', closeDrawer);
  g('drawer-close-btn')?.addEventListener('click', closeDrawer);
  g('auth-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
  g('login-form')?.addEventListener('submit', doLogin);
  g('signup-form')?.addEventListener('submit', doSignup);
  document.addEventListener('click', e => { if (!e.target.closest('.nav-user')) closeDropdown(); });
});
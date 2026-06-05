/* ─── Supabase Config ────────────────────────────────────────── */
const SUPABASE_URL = 'https://pfuylqlexsaoryyxnrma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YZRUQQyswKSbTTtLbnUybQ_9X2EFSzT';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── Sample Fallback Data ───────────────────────────────────── */
const SAMPLE_EVENTS = [
  { id: 1, title: "Job Search Workshop", category: "Workshop", date: "Saturday, June 6, 2026", time: "10:00 AM – 12:00 PM", doorsOpen: "9:45 AM", location: "Welcome Centre", address: "9325 Yonge Street Richmond Hill, ON L4C 0A8 #31a", speaker: "Behshad Sabah", description: "Join us for an engaging workshop designed to inspire, inform, and empower professionals. This hands-on session will guide you through modern job search strategies, LinkedIn optimization, and how to stand out in today's competitive job market.", registration: "RSVP", price: "Free", mode: "In Person", language: "Persian, English", maxTickets: 80, isPublic: true, carpool: true, tags: ["Workshop", "Career"], posterEmoji: "💼" },
  { id: 2, title: "Resume & Networking Workshop", category: "Workshop", date: "Saturday, June 6, 2026", time: "12:30 PM – 2:30 PM", doorsOpen: "12:15 PM", location: "Welcome Centre", address: "9325 Yonge Street Richmond Hill, ON L4C 0A8 #31a", speaker: "Behshad Sabah", description: "Learn how to craft a standout resume and build a powerful professional network.", registration: "RSVP", price: "Free", mode: "In Person", language: "Persian, English", maxTickets: 60, isPublic: true, carpool: true, tags: ["Workshop", "Career"], posterEmoji: "📄" },
  { id: 3, title: "Body Awareness Festival", category: "Festival", date: "Sunday, June 7, 2026", time: "3:30 PM – 8:00 PM", doorsOpen: "3:00 PM", location: "Mehr Aeenkadah", address: "King City Richmond Hill, ON", speaker: null, description: "A full-day festival celebrating movement, mindfulness, and body awareness.", registration: "Ticketing", price: "$25 CAD", mode: "In Person", language: "Persian, English", maxTickets: 200, isPublic: true, carpool: true, tags: ["Festival", "Wellness"], posterEmoji: "🌟" },
  { id: 4, title: "The Real Charlie Chaplin", category: "Screening", date: "Wednesday, June 17, 2026", time: "7:30 PM – 9:30 PM", doorsOpen: "7:00 PM", location: "Studio SYN", address: "2 Laureleaf Ave Markham, ON L3T 4S6", speaker: null, description: "A fascinating documentary uncovering the real man behind the iconic Tramp character.", registration: "RSVP", price: "Free", mode: "In Person", language: "English", maxTickets: 100, isPublic: true, carpool: false, tags: ["Screening", "Culture"], posterEmoji: "🎬" },
  { id: 5, title: "Circle of Presence Retreat", category: "Retreat", date: "Saturday, June 20, 2026", time: "9:00 AM – 6:00 PM", doorsOpen: "8:30 AM", location: "Bond Head Farm", address: "Bond Head, Ontario", speaker: null, description: "A transformative one-day wellness retreat set in nature.", registration: "Ticketing", price: "$85 CAD", mode: "In Person", language: "English, Persian", maxTickets: 40, isPublic: true, carpool: true, tags: ["Retreat", "Wellness"], posterEmoji: "🌿" },
  { id: 6, title: "Hand Pan Workshop", category: "Workshop", date: "Sunday, June 21, 2026", time: "12:00 PM – 2:00 PM", doorsOpen: "11:45 AM", location: "Studio SYN", address: "2 Laureleaf Ave Markham, ON L3T 4S6", speaker: null, description: "Discover the magical sounds of the hand pan in this beginner-friendly workshop.", registration: "RSVP", price: "Free", mode: "In Person", language: "English", maxTickets: 25, isPublic: true, carpool: false, tags: ["Workshop", "Music"], posterEmoji: "🥁" },
  { id: 7, title: "MAN ON WIRE", category: "Screening", date: "Wednesday, June 24, 2026", time: "7:30 PM – 9:30 PM", doorsOpen: "7:00 PM", location: "Studio SYN", address: "2 Laureleaf Ave Markham, ON L3T 4S6", speaker: null, description: "The extraordinary true story of Philippe Petit's high-wire walk between the Twin Towers.", registration: "RSVP", price: "Free", mode: "In Person", language: "English", maxTickets: 100, isPublic: true, carpool: false, tags: ["Screening", "Culture"], posterEmoji: "🎭" },
  { id: 8, title: "Faces Places", category: "Screening", date: "Wednesday, July 1, 2026", time: "7:30 PM – 9:30 PM", doorsOpen: "7:00 PM", location: "Studio SYN", address: "2 Laureleaf Ave Markham, ON L3T 4S6", speaker: null, description: "A heartwarming road trip documentary by Agnès Varda and JR.", registration: "RSVP", price: "Free", mode: "In Person", language: "French, English", maxTickets: 100, isPublic: true, carpool: false, tags: ["Screening", "Art"], posterEmoji: "📸" }
];

/* ─── State ──────────────────────────────────────────────────── */
let EVENTS = [...SAMPLE_EVENTS];
let currentPage = 'home';
let selectedEvent = null;
let activeFilter = 'All';
let authUser = null;
let authProfile = null;
let activeAccountTab = 'tickets';
let activeLangs = ['English'];
let registrationMethod = 'RSVP';
let currency = 'CAD';
let addressMode = 'In Person';
let addressVisible = 'All';
let carpoolAllowed = true;
let needsApproval = false;
let ticketsAtDoor = true;
let isPublic = true;

/* ─── Auth Init ──────────────────────────────────────────────── */
async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) await handleAuthUser(session.user);

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await handleAuthUser(session.user);
      closeLogin();
      showToast('Welcome to Zeenle!');
    }
    if (event === 'SIGNED_OUT') {
      authUser = null; authProfile = null;
      updateAuthUI();
      if (currentPage === 'account') navigate('home');
    }
  });
}

async function handleAuthUser(user) {
  authUser = user;
  const { data } = await sb.from('users').upsert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || ''
  }, { onConflict: 'id' }).select().single();
  authProfile = data;
  updateAuthUI();
}

/* ─── Load Events ────────────────────────────────────────────── */
async function loadEvents() {
  try {
    const { data, error } = await sb.from('events').select('*, categories(name)').eq('is_public', true).eq('status', 'published').order('start_at', { ascending: true });
    if (!error && data && data.length > 0) {
      EVENTS = data.map(e => ({
        id: e.id, dbId: e.id,
        title: e.title,
        category: e.categories?.name || 'Event',
        date: e.start_at ? new Date(e.start_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
        time: e.start_at ? new Date(e.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
        doorsOpen: e.doors_open_at ? new Date(e.doors_open_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
        location: e.venue_name || '', address: e.address || '',
        speaker: e.speaker || null, description: e.description || '',
        registration: e.registration_method || 'RSVP',
        price: e.price > 0 ? `$${e.price} ${e.currency}` : 'Free',
        mode: e.mode || 'In Person',
        language: Array.isArray(e.languages) ? e.languages.join(', ') : 'English',
        maxTickets: e.max_tickets || 0, isPublic: e.is_public, carpool: e.allow_carpool,
        tags: [e.categories?.name || 'Event'],
        posterEmoji: categoryEmoji(e.categories?.name)
      }));
    }
  } catch(e) { /* use sample data */ }
  renderEventCards();
}

function categoryEmoji(cat) {
  const map = { Workshop:'💼', Festival:'🌟', Screening:'🎬', Retreat:'🌿', Music:'🥁', Art:'📸', Culture:'🎭', Networking:'🤝', Sport:'⚽' };
  return map[cat] || '📅';
}

/* ─── Router ─────────────────────────────────────────────────── */
function navigate(page, data) {
  currentPage = page; selectedEvent = data || null;
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) { target.classList.add('active'); window.scrollTo(0,0); }
  updateNav();
  if (page === 'home') renderEventCards();
  if (page === 'detail' && selectedEvent) renderDetailPage();
  if (page === 'account') renderAccountPage();
  if (page === 'create') { if (!authUser) { openLogin(); return; } renderCreatePage(); }
  closeDrawer();
}

function updateNav() {
  document.querySelectorAll('.nav-links a, .drawer-nav a[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === currentPage));
}

/* ─── Drawer ─────────────────────────────────────────────────── */
function openDrawer() { document.getElementById('drawer-overlay').classList.add('open'); document.getElementById('drawer').classList.add('open'); }
function closeDrawer() { document.getElementById('drawer-overlay').classList.remove('open'); document.getElementById('drawer').classList.remove('open'); }

/* ─── Toast ──────────────────────────────────────────────────── */
function showToast(msg, type='success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast toast-' + type; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

/* ─── Auth Modal ─────────────────────────────────────────────── */
function openLogin(tab='login') {
  document.getElementById('login-modal').classList.add('open');
  switchAuthTab(tab);
}
function closeLogin() { document.getElementById('login-modal').classList.remove('open'); }

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => {
    const active = t.dataset.tab === tab;
    t.classList.toggle('active', active);
    t.style.color = active ? '#1a1a1a' : '#999';
    t.style.borderBottomColor = active ? '#CC0000' : 'transparent';
  });
  document.getElementById('auth-login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('auth-signup-form').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('auth-phone-form').style.display = tab === 'phone' ? 'block' : 'none';
}

/* ─── Email/Password Login ───────────────────────────────────── */
async function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in…'; btn.disabled = true;
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  btn.textContent = 'Sign In →'; btn.disabled = false;
  if (error) showToast(error.message, 'error');
}

/* ─── Password Validation ────────────────────────────────────── */
function checkPassword(val) {
  const hasLength = val.length >= 8;
  const hasUpper = /[A-Z]/.test(val);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(val);
  setCheck('check-length', hasLength);
  setCheck('check-upper', hasUpper);
  setCheck('check-special', hasSpecial);
  return hasLength && hasUpper && hasSpecial;
}

function setCheck(id, passed) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = passed ? '✓ ' + el.dataset.label : '✗ ' + el.dataset.label;
  el.style.color = passed ? '#1a7a3a' : '#999';
}

function checkConfirm() {
  const pass = document.getElementById('signup-pass')?.value;
  const conf = document.getElementById('signup-confirm')?.value;
  const el = document.getElementById('check-confirm');
  if (!el || !conf) return;
  const match = pass === conf && conf.length > 0;
  el.textContent = match ? '✓ ' + el.dataset.label : '✗ ' + el.dataset.label;
  el.style.color = match ? '#1a7a3a' : '#999';
}

/* ─── Email/Password Signup ──────────────────────────────────── */
async function doSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-pass').value;
  const confirm = document.getElementById('signup-confirm').value;

  if (!checkPassword(pass)) { showToast('Password does not meet requirements.', 'error'); return; }
  if (pass !== confirm) { showToast('Passwords do not match.', 'error'); return; }

  const btn = document.getElementById('signup-btn');
  btn.textContent = 'Creating account…'; btn.disabled = true;
  const { error } = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: name }, emailRedirectTo: window.location.origin + '/Zeenle/' } });
  btn.textContent = 'Create Account →'; btn.disabled = false;
  if (error) showToast(error.message, 'error');
  else {
    closeLogin();
    showToast('Account created! Please check your email to confirm.');
  }
}

/* ─── OAuth Providers ────────────────────────────────────────── */
async function doOAuthLogin(provider) {
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.href }
  });
  if (error) showToast(error.message, 'error');
}

/* ─── Phone Auth ─────────────────────────────────────────────── */
let phoneStep = 'number'; // 'number' | 'otp' | 'name'
let phoneNumber = '';

async function sendPhoneOTP() {
  const num = document.getElementById('phone-number')?.value?.trim();
  if (!num) { showToast('Enter a phone number.', 'error'); return; }
  phoneNumber = num;
  const btn = document.getElementById('phone-send-btn');
  btn.textContent = 'Sending…'; btn.disabled = true;
  const { error } = await sb.auth.signInWithOtp({ phone: num });
  btn.textContent = 'Send Code'; btn.disabled = false;
  if (error) { showToast(error.message, 'error'); return; }
  phoneStep = 'otp';
  renderPhoneForm();
}

async function verifyPhoneOTP() {
  const token = document.getElementById('phone-otp')?.value?.trim();
  if (!token) { showToast('Enter the code.', 'error'); return; }
  const btn = document.getElementById('phone-verify-btn');
  btn.textContent = 'Verifying…'; btn.disabled = true;
  const { data, error } = await sb.auth.verifyOtp({ phone: phoneNumber, token, type: 'sms' });
  btn.textContent = 'Verify'; btn.disabled = false;
  if (error) { showToast(error.message, 'error'); return; }
  // Check if new user needs a name
  const { data: profile } = await sb.from('users').select('full_name').eq('id', data.user.id).single();
  if (!profile?.full_name) { phoneStep = 'name'; renderPhoneForm(); }
  else { closeLogin(); showToast('Welcome back!'); }
}

async function savePhoneName() {
  const name = document.getElementById('phone-name')?.value?.trim();
  if (!name) { showToast('Enter your name.', 'error'); return; }
  const { data: { user } } = await sb.auth.getUser();
  await sb.from('users').update({ full_name: name }).eq('id', user.id);
  closeLogin(); showToast('Welcome to Zeenle!');
}

function renderPhoneForm() {
  const container = document.getElementById('auth-phone-form');
  if (!container) return;
  if (phoneStep === 'number') {
    container.innerHTML = `
      <div class="form-field" style="margin-bottom:16px">
        <label class="form-label">Phone Number</label>
        <input id="phone-number" type="tel" class="form-input" placeholder="+1 (416) 000-0000" autocomplete="tel">
        <span class="form-hint">We'll send you a verification code via SMS.</span>
      </div>
      <button id="phone-send-btn" class="btn-login" onclick="sendPhoneOTP()">Send Code →</button>`;
  } else if (phoneStep === 'otp') {
    container.innerHTML = `
      <p style="font-size:13px;color:#555;margin-bottom:16px">Code sent to <strong>${phoneNumber}</strong>. Check your messages.</p>
      <div class="form-field" style="margin-bottom:16px">
        <label class="form-label">Verification Code</label>
        <input id="phone-otp" type="text" class="form-input" placeholder="123456" maxlength="6" autocomplete="one-time-code" style="letter-spacing:4px;font-size:20px;text-align:center">
      </div>
      <button id="phone-verify-btn" class="btn-login" onclick="verifyPhoneOTP()">Verify →</button>
      <button onclick="phoneStep='number';renderPhoneForm()" style="width:100%;margin-top:8px;background:none;border:none;color:#999;font-size:12px;cursor:pointer;padding:8px">← Use a different number</button>`;
  } else if (phoneStep === 'name') {
    container.innerHTML = `
      <p style="font-size:13px;color:#555;margin-bottom:16px">One last thing — what's your name?</p>
      <div class="form-field" style="margin-bottom:16px">
        <label class="form-label">Full Name</label>
        <input id="phone-name" type="text" class="form-input" placeholder="Your name" autocomplete="name">
      </div>
      <button class="btn-login" onclick="savePhoneName()">Finish →</button>`;
  }
}

/* ─── Logout ─────────────────────────────────────────────────── */
async function doLogout() {
  await sb.auth.signOut();
  showToast('Logged out.');
  closeDrawer();
}

/* ─── Update UI after auth change ───────────────────────────── */
function updateAuthUI() {
  const loggedIn = !!authUser;
  document.querySelectorAll('.auth-login-btn').forEach(el => el.style.display = loggedIn ? 'none' : '');
  document.querySelectorAll('.auth-account-btn').forEach(el => el.style.display = loggedIn ? '' : 'none');
  const drawerAuth = document.querySelector('.drawer-auth-section');
  if (drawerAuth) {
    drawerAuth.innerHTML = loggedIn
      ? `<a href="#" onclick="navigate('account');return false" data-page="account">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
           My Account
         </a>
         <div class="nav-sep"></div>
         <a href="#" onclick="doLogout();return false" style="color:#CC0000">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
           Log Out
         </a>`
      : `<a href="#" onclick="openLogin();closeDrawer();return false">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
           Login / Sign Up
         </a>`;
  }
}

/* ─── Poster SVG ─────────────────────────────────────────────── */
function posterColors(id) {
  const p = [['#1A3A2A','#2D6A4A'],['#2C3E50','#4CA1AF'],['#8B0000','#CC4444'],['#232526','#414345'],['#5C4033','#D4A574'],['#1a1a2e','#0f3460'],['#0f2027','#2c5364'],['#4a0072','#9c27b0']];
  const idx = typeof id === 'number' ? (id-1) % p.length : Math.abs((id||'').toString().charCodeAt(0)||0) % p.length;
  return p[idx];
}

function posterSVG(event, size='card') {
  const w = size==='detail' ? 420 : 400;
  const h = size==='detail' ? 560 : 300;
  const cat = (event.category||'Event').toUpperCase();
  const [c1,c2] = posterColors(event.dbId||event.id);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g${event.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#g${event.id})"/>
    <rect x="0" y="${h-5}" width="${w}" height="5" fill="rgba(255,255,255,0.12)"/>
    <text x="24" y="40" font-family="sans-serif" font-size="11" font-weight="700" fill="rgba(255,255,255,0.55)" letter-spacing="3">${cat}</text>
    <text x="24" y="100" font-family="sans-serif" font-size="48" fill="#fff">${event.posterEmoji||'📅'}</text>
    <text x="24" y="${size==='detail'?200:160}" font-family="serif" font-size="${size==='detail'?28:22}" font-weight="700" fill="#fff">${(event.title||'').length>22?event.title.slice(0,22)+'…':event.title}</text>
    <text x="24" y="${h-55}" font-family="sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.85)">${event.date||''}</text>
    <text x="24" y="${h-35}" font-family="sans-serif" font-size="12" fill="rgba(255,255,255,0.65)">${event.time||''}</text>
    <text x="24" y="${h-15}" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.5)">${event.location||''}</text>
    ${size==='detail'&&event.speaker?`<text x="24" y="${h-80}" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.55)" font-weight="600">SPEAKER</text><text x="24" y="${h-60}" font-family="sans-serif" font-size="15" fill="#fff" font-weight="700">${event.speaker}</text>`:''}
  </svg>`;
}

/* ─── Home ───────────────────────────────────────────────────── */
function renderEventCards() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  const cats = ['All',...new Set(EVENTS.map(e=>e.category))];
  const filterBar = document.getElementById('filter-chips');
  if (filterBar) filterBar.innerHTML = cats.map(c=>`<button class="filter-chip${activeFilter===c?' active':''}" onclick="setFilter('${c}')">${c}</button>`).join('');
  const filtered = activeFilter==='All' ? EVENTS : EVENTS.filter(e=>e.category===activeFilter);
  grid.innerHTML = filtered.map((ev,i)=>`
    <div class="event-card fade-up" style="animation-delay:${i*0.04}s" onclick="navigate('detail',EVENTS[${EVENTS.indexOf(ev)}])">
      <div style="overflow:hidden;background:#111;line-height:0">${posterSVG(ev,'card')}</div>
      <div class="event-card-body">
        <div class="event-card-tags">${ev.tags.map(t=>`<span class="tag">${t}</span>`).join('')}${ev.price==='Free'?'<span class="tag free">Free</span>':''}</div>
        <div class="event-card-title">${ev.title}</div>
        <div class="event-card-meta">
          <div class="event-meta-row"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>${ev.date}</div>
          <div class="event-meta-row"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${ev.time}</div>
          <div class="event-meta-row"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>${ev.location}</div>
        </div>
      </div>
      <div class="event-card-foot">
        <span class="event-price">${ev.price}</span>
        <button class="btn-details" onclick="event.stopPropagation();navigate('detail',EVENTS[${EVENTS.indexOf(ev)}])">View Details →</button>
      </div>
    </div>`).join('');
}

function setFilter(cat) { activeFilter=cat; renderEventCards(); }
function filterSearch(val) { const term=val.toLowerCase(); document.querySelectorAll('.event-card').forEach(c=>c.style.display=c.textContent.toLowerCase().includes(term)?'':'none'); }

/* ─── Detail ─────────────────────────────────────────────────── */
function renderDetailPage() {
  const ev = selectedEvent; if (!ev) return;
  document.getElementById('detail-content').innerHTML = `
    <div class="detail-breadcrumb"><a href="#" onclick="navigate('home');return false">Home</a><span>›</span><span>${ev.title}</span></div>
    <div class="detail-grid">
      <div class="detail-poster">${posterSVG(ev,'detail')}</div>
      <div class="detail-info">
        <div class="detail-tags">${ev.tags.map(t=>`<span class="tag">${t}</span>`).join('')}${ev.price==='Free'?'<span class="tag free">Free</span>':''}</div>
        <h1 class="detail-title">${ev.title}</h1>
        <p class="detail-desc">${ev.description}</p>
        <div class="detail-meta-card">
          <div class="detail-meta-row"><div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg></div><div><div class="meta-label">Date</div><div class="meta-value">${ev.date}</div></div></div>
          <div class="detail-meta-row"><div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div><div class="meta-label">Time</div><div class="meta-value">${ev.time}</div><div class="meta-label" style="margin-top:3px">Doors open ${ev.doorsOpen}</div></div></div>
          <div class="detail-meta-row"><div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg></div><div><div class="meta-label">Location</div><div class="meta-value">${ev.location}</div><div class="meta-label" style="margin-top:2px">${ev.address}</div></div></div>
          ${ev.speaker?`<div class="detail-meta-row"><div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg></div><div><div class="meta-label">Speaker</div><div class="meta-value">${ev.speaker}</div></div></div>`:''}
          <div class="detail-meta-row"><div class="meta-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div><div class="meta-label">Price</div><div class="meta-value">${ev.price}</div></div></div>
        </div>
        <div class="detail-actions">
          <button class="btn-register" onclick="${authUser?`doRegister('${ev.dbId||ev.id}')` :'openLogin()'}">
            ${ev.registration==='RSVP'?'RSVP for this Event':'Get Tickets'} →
          </button>
          <button class="btn-secondary" onclick="shareEvent()">Share Event</button>
        </div>
        <div class="detail-extras">
          ${ev.carpool?`
          <div class="extra-panel" id="panel-carpool-offers"><div class="extra-panel-head" onclick="togglePanel('carpool-offers')"><span>🚗  Carpool Offers</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></div><div class="extra-panel-body"><p class="extra-empty">No carpool offers yet.</p></div></div>
          <div class="extra-panel" id="panel-carpool-requests"><div class="extra-panel-head" onclick="togglePanel('carpool-requests')"><span>🙋  Carpool Requests</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></div><div class="extra-panel-body"><p class="extra-empty">No ride requests yet.</p></div></div>`:''}
          <div class="extra-panel" id="panel-photos"><div class="extra-panel-head" onclick="togglePanel('photos')"><span>📸  Event Photo Gallery</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></div><div class="extra-panel-body"><p class="extra-empty">Photos available to attendees only.</p></div></div>
        </div>
      </div>
    </div>`;
}

async function doRegister(eventId) {
  if (!authUser) { openLogin(); return; }
  const { error } = await sb.from('registrations').insert({ event_id: eventId, user_id: authUser.id, status: 'pending' });
  if (error?.code==='23505') showToast("You're already registered!", 'error');
  else if (error) showToast(error.message, 'error');
  else showToast('Registration submitted!');
}

function togglePanel(id) { document.getElementById('panel-'+id)?.classList.toggle('open'); }
function shareEvent() {
  if (navigator.share) navigator.share({ title: selectedEvent?.title, url: window.location.href });
  else { navigator.clipboard?.writeText(window.location.href); showToast('Link copied!'); }
}

/* ─── Account ────────────────────────────────────────────────── */
async function renderAccountPage() {
  const user = authProfile||authUser;
  const name = user?.full_name||user?.email?.split('@')[0]||'Guest';
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  let points=0, tickets=[];
  if (authUser) {
    const { data: pts } = await sb.from('zee_points').select('amount').eq('user_id',authUser.id);
    points = pts ? pts.reduce((s,r)=>s+r.amount,0) : 0;
    const { data: regs } = await sb.from('registrations').select('*, events(title,start_at,venue_name)').eq('user_id',authUser.id).order('created_at',{ascending:false});
    tickets = regs||[];
  }
  document.getElementById('account-content').innerHTML = `
    <div class="account-hero">
      <div class="account-avatar">${initials}</div>
      <div class="account-info">
        <h2>${name}</h2>
        <p>${user?.email||''}</p>
        ${authUser?`<p style="margin-top:4px;font-size:12px;color:#666">Member since ${new Date(authUser.created_at||Date.now()).getFullYear()}</p>`:''}
      </div>
      <div class="zee-points-badge"><div class="pts">${points}</div><div class="lbl">ZeePoints</div></div>
    </div>
    ${!authUser?`<div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:40px;text-align:center;margin-bottom:24px"><p style="font-size:15px;color:#555;margin-bottom:16px">Login to view your account.</p><button class="btn-submit" onclick="openLogin()">Login</button></div>`:''}
    <div class="account-tabs">
      <div class="account-tab${activeAccountTab==='tickets'?' active':''}" onclick="switchAccountTab('tickets')">My Tickets</div>
      <div class="account-tab${activeAccountTab==='events'?' active':''}" onclick="switchAccountTab('events')">My Events</div>
      <div class="account-tab${activeAccountTab==='referrals'?' active':''}" onclick="switchAccountTab('referrals')">Referrals & Points</div>
    </div>
    <div class="account-panel${activeAccountTab==='tickets'?' active':''}" id="tab-tickets">
      ${tickets.length>0?tickets.map(r=>`<div class="ticket-card"><div class="ticket-poster" style="background:#111;display:flex;align-items:center;justify-content:center;font-size:32px">📅</div><div class="ticket-body"><div class="ticket-title">${r.events?.title||'Event'}</div><div class="ticket-meta">${r.events?.start_at?new Date(r.events.start_at).toLocaleDateString():''}<br>${r.events?.venue_name||''}</div></div><div class="ticket-foot"><span class="ticket-status">${r.status}</span></div></div>`).join(''):
      `<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"/></svg><p>No tickets yet. <a href="#" onclick="navigate('home');return false" style="color:#CC0000;font-weight:600">Browse events →</a></p></div>`}
    </div>
    <div class="account-panel${activeAccountTab==='events'?' active':''}" id="tab-events">
      ${authUser?`<div style="margin-bottom:20px"><button class="btn-submit" onclick="navigate('create')">+ Create New Event</button></div><div class="empty-state"><p>No events created yet.</p></div>`:`<div class="empty-state"><p>Login to manage your events.</p></div>`}
    </div>
    <div class="account-panel${activeAccountTab==='referrals'?' active':''}" id="tab-referrals">
      <div class="referral-card">
        <h4>🎁 Your ZeePoints</h4>
        <p>Earn ZeePoints by attending events and referring friends.</p>
        ${authUser?`
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
          <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:4px;padding:14px;text-align:center"><div style="font-size:24px;font-weight:700">${points}</div><div style="font-size:11px;color:#999;text-transform:uppercase;font-weight:600">Available</div></div>
          <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:4px;padding:14px;text-align:center"><div style="font-size:24px;font-weight:700;color:#CC0000">${points}</div><div style="font-size:11px;color:#999;text-transform:uppercase;font-weight:600">Lifetime</div></div>
          <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:4px;padding:14px;text-align:center"><div style="font-size:24px;font-weight:700;color:#999">0</div><div style="font-size:11px;color:#999;text-transform:uppercase;font-weight:600">Redeemed</div></div>
        </div>
        <h4 style="margin-bottom:8px">🔗 Your Referral Link</h4>
        <div class="referral-link-box"><span>zeenle.com/ref/${authProfile?.referral_code||authUser.id.slice(0,8)}</span><button class="btn-copy" onclick="navigator.clipboard?.writeText(this.previousElementSibling.textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)">Copy</button></div>`:`<div class="empty-state"><p>Login to view your points.</p></div>`}
      </div>
    </div>`;
}

function switchAccountTab(tab) { activeAccountTab=tab; renderAccountPage(); }

/* ─── Create Event ───────────────────────────────────────────── */
function renderCreatePage() {
  document.getElementById('create-content').innerHTML = `
    <h1 class="form-page-title">Create an Event</h1>
    <p class="form-page-sub">Fill in the details below.</p>
    <div class="form-section">
      <div class="form-section-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>Main Information</div>
      <div class="form-row single" style="margin-bottom:20px"><div class="form-field"><label class="form-label">Event Poster</label><div class="upload-zone" onclick="document.getElementById('poster-input').click()"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg><p>Click to upload or drag & drop</p><span>PNG, JPG, MP4 — max 10MB</span><input id="poster-input" type="file" accept="image/*,video/mp4" style="display:none" onchange="posterSelected(this)"></div></div></div>
      <div class="form-row" style="margin-bottom:20px"><div class="form-field"><label class="form-label">Event Title <span class="required">*</span></label><input id="ev-title" type="text" class="form-input" placeholder="e.g. Job Search Workshop"></div><div class="form-field"><label class="form-label">Category</label><select id="ev-category" class="form-select"><option>Workshop</option><option>Festival</option><option>Screening</option><option>Retreat</option><option>Music</option><option>Art</option><option>Culture</option><option>Networking</option><option>Other</option></select></div></div>
      <div class="form-row single" style="margin-bottom:20px"><div class="form-field"><label class="form-label">Description</label><textarea id="ev-desc" class="form-textarea" placeholder="Tell attendees what this event is about…"></textarea></div></div>
      <div class="form-row triple" style="margin-bottom:20px"><div class="form-field"><label class="form-label">Start Date & Time <span class="required">*</span></label><input id="ev-start" type="datetime-local" class="form-input"></div><div class="form-field"><label class="form-label">End Date & Time</label><input id="ev-end" type="datetime-local" class="form-input"></div><div class="form-field"><label class="form-label">Doors Open</label><input id="ev-doors" type="datetime-local" class="form-input"></div></div>
      <div class="form-row" style="margin-bottom:20px"><div class="form-field"><label class="form-label">Registration Method</label><div class="toggle-group"><button class="toggle-btn active" onclick="setFormToggle('registrationMethod','RSVP',this)">RSVP</button><button class="toggle-btn" onclick="setFormToggle('registrationMethod','Ticketing',this)">Ticketing</button></div></div><div class="form-field"><label class="form-label">Currency</label><div class="toggle-group"><button class="toggle-btn active" onclick="setFormToggle('currency','CAD',this)">CAD</button><button class="toggle-btn" onclick="setFormToggle('currency','USD',this)">USD</button><button class="toggle-btn" onclick="setFormToggle('currency','EUR',this)">EUR</button></div></div></div>
      <div class="form-row"><div class="form-field"><label class="form-label">Price</label><input id="ev-price" type="number" class="form-input" placeholder="0 for free" min="0" step="0.01"></div><div class="form-field"><label class="form-label">Max Tickets</label><input id="ev-max" type="number" class="form-input" placeholder="0 = unlimited"></div></div>
    </div>
    <div class="form-section">
      <div class="form-section-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>Location</div>
      <div class="form-row" style="margin-bottom:20px"><div class="form-field"><label class="form-label">Mode</label><div class="toggle-group"><button class="toggle-btn active" onclick="setFormToggle('addressMode','In Person',this)">In Person</button><button class="toggle-btn" onclick="setFormToggle('addressMode','Online',this)">Online</button><button class="toggle-btn" onclick="setFormToggle('addressMode','Hybrid',this)">Hybrid</button></div></div><div class="form-field"><label class="form-label">Address Visible To</label><div class="toggle-group"><button class="toggle-btn active" onclick="setFormToggle('addressVisible','All',this)">All</button><button class="toggle-btn" onclick="setFormToggle('addressVisible','Approved Tickets',this)">Approved</button><button class="toggle-btn" onclick="setFormToggle('addressVisible','Email Only',this)">Email Only</button></div></div></div>
      <div class="form-row" style="margin-bottom:20px"><div class="form-field"><label class="form-label">Venue Name</label><input id="ev-venue" type="text" class="form-input" placeholder="e.g. Welcome Centre"></div><div class="form-field"><label class="form-label">Street Address</label><input id="ev-address" type="text" class="form-input" placeholder="123 Main St"></div></div>
      <div class="form-row triple"><div class="form-field"><label class="form-label">City</label><input id="ev-city" type="text" class="form-input" placeholder="Toronto"></div><div class="form-field"><label class="form-label">Province</label><input id="ev-province" type="text" class="form-input" placeholder="ON"></div><div class="form-field"><label class="form-label">Postal Code</label><input id="ev-postal" type="text" class="form-input" placeholder="M1A 1A1"></div></div>
    </div>
    <div class="form-section">
      <div class="form-section-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg>Controls</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="form-field"><label class="form-label">Is Public</label><div class="toggle-group"><button class="toggle-btn active" id="pub-yes" onclick="isPublic=true;document.getElementById('pub-yes').classList.add('active');document.getElementById('pub-no').classList.remove('active')">Yes</button><button class="toggle-btn" id="pub-no" onclick="isPublic=false;document.getElementById('pub-no').classList.add('active');document.getElementById('pub-yes').classList.remove('active')">No</button></div></div>
        <div class="form-field"><label class="form-label">Needs Approval</label><div class="toggle-group"><button class="toggle-btn" id="apr-yes" onclick="needsApproval=true;document.getElementById('apr-yes').classList.add('active');document.getElementById('apr-no').classList.remove('active')">Yes</button><button class="toggle-btn active" id="apr-no" onclick="needsApproval=false;document.getElementById('apr-no').classList.add('active');document.getElementById('apr-yes').classList.remove('active')">No</button></div></div>
        <div class="form-field"><label class="form-label">Tickets at Door</label><div class="toggle-group"><button class="toggle-btn active" id="door-yes" onclick="ticketsAtDoor=true;document.getElementById('door-yes').classList.add('active');document.getElementById('door-no').classList.remove('active')">Yes</button><button class="toggle-btn" id="door-no" onclick="ticketsAtDoor=false;document.getElementById('door-no').classList.add('active');document.getElementById('door-yes').classList.remove('active')">No</button></div></div>
        <div class="form-field"><label class="form-label">Allow Carpool</label><div class="toggle-group"><button class="toggle-btn active" id="car-yes" onclick="carpoolAllowed=true;document.getElementById('car-yes').classList.add('active');document.getElementById('car-no').classList.remove('active')">Yes</button><button class="toggle-btn" id="car-no" onclick="carpoolAllowed=false;document.getElementById('car-no').classList.add('active');document.getElementById('car-yes').classList.remove('active')">No</button></div></div>
      </div>
    </div>
    <div class="form-actions"><button class="btn-submit" onclick="submitEvent()">Save & Publish</button><button class="btn-cancel" onclick="navigate('home')">Cancel</button></div>`;
}

async function submitEvent() {
  const title = document.getElementById('ev-title')?.value;
  const start = document.getElementById('ev-start')?.value;
  if (!title||!start) { showToast('Title and start date are required.','error'); return; }
  const btn = document.querySelector('.btn-submit');
  btn.textContent='Saving…'; btn.disabled=true;
  const { error } = await sb.from('events').insert({
    created_by: authUser.id, title,
    description: document.getElementById('ev-desc')?.value||'',
    start_at: new Date(start).toISOString(),
    end_at: document.getElementById('ev-end')?.value ? new Date(document.getElementById('ev-end').value).toISOString() : null,
    doors_open_at: document.getElementById('ev-doors')?.value ? new Date(document.getElementById('ev-doors').value).toISOString() : null,
    registration_method: registrationMethod, currency,
    price: parseFloat(document.getElementById('ev-price')?.value||0),
    max_tickets: parseInt(document.getElementById('ev-max')?.value||0),
    mode: addressMode, address_visible_to: addressVisible,
    venue_name: document.getElementById('ev-venue')?.value||'',
    address: document.getElementById('ev-address')?.value||'',
    city: document.getElementById('ev-city')?.value||'',
    province: document.getElementById('ev-province')?.value||'',
    postal_code: document.getElementById('ev-postal')?.value||'',
    is_public: isPublic, needs_approval: needsApproval,
    tickets_at_door: ticketsAtDoor, allow_carpool: carpoolAllowed, status:'published'
  });
  btn.textContent='Save & Publish'; btn.disabled=false;
  if (error) showToast(error.message,'error');
  else { showToast('Event published!'); await loadEvents(); navigate('home'); }
}

function setFormToggle(v,val,btn) { window[v]=val; btn.closest('.toggle-group').querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
function posterSelected(input) { const f=input.files[0]; if(!f) return; const z=input.closest('.upload-zone'); z.innerHTML=`<p style="color:#1a7a3a;font-weight:600">✓ ${f.name}</p><span>Click to change</span>`; z.onclick=()=>document.getElementById('poster-input').click(); }

/* ─── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  await loadEvents();
  document.getElementById('hamburger-btn')?.addEventListener('click', openDrawer);
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
  document.getElementById('drawer-close')?.addEventListener('click', closeDrawer);
  document.getElementById('login-modal')?.addEventListener('click', e => { if(e.target===e.currentTarget) closeLogin(); });
  document.getElementById('login-form')?.addEventListener('submit', doLogin);
  document.getElementById('signup-form')?.addEventListener('submit', doSignup);
  // Init phone form
  renderPhoneForm();
});
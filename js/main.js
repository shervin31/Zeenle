/* ═══════════════════════════════════════════════════════════════
   Zeenle — main.js
   Full auth: email/password, Google, Microsoft, Apple, Phone
   Real Supabase backend
═══════════════════════════════════════════════════════════════ */

const SB_URL = 'https://pfuylqlexsaoryyxnrma.supabase.co';
const SB_KEY = 'sb_publishable_YZRUQQyswKSbTTtLbnUybQ_9X2EFSzT';
const sb = supabase.createClient(SB_URL, SB_KEY);

/* ─── Sample events (shown while DB is empty) ────────────────── */
const SAMPLES = [
  {id:1,title:"Job Search Workshop",category:"Workshop",date:"Saturday, June 6, 2026",time:"10:00 AM – 12:00 PM",doorsOpen:"9:45 AM",location:"Welcome Centre",address:"9325 Yonge St Richmond Hill, ON L4C 0A8",speaker:"Behshad Sabah",desc:"Join us for an engaging workshop designed to inspire, inform, and empower professionals navigating today's competitive job market.",reg:"RSVP",price:"Free",mode:"In Person",lang:"Persian, English",carpool:true,tags:["Workshop","Career"],emoji:"💼"},
  {id:2,title:"Resume & Networking Workshop",category:"Workshop",date:"Saturday, June 6, 2026",time:"12:30 PM – 2:30 PM",doorsOpen:"12:15 PM",location:"Welcome Centre",address:"9325 Yonge St Richmond Hill, ON L4C 0A8",speaker:"Behshad Sabah",desc:"Learn how to craft a standout resume and build a powerful professional network with real-world strategies.",reg:"RSVP",price:"Free",mode:"In Person",lang:"Persian, English",carpool:true,tags:["Workshop","Career"],emoji:"📄"},
  {id:3,title:"Body Awareness Festival",category:"Festival",date:"Sunday, June 7, 2026",time:"3:30 PM – 8:00 PM",doorsOpen:"3:00 PM",location:"Mehr Aeenkadah",address:"King City, Richmond Hill, ON",speaker:null,desc:"A full-day festival celebrating movement, mindfulness, and body awareness. Experience workshops, guided meditations, and dance sessions.",reg:"Ticketing",price:"$25 CAD",mode:"In Person",lang:"Persian, English",carpool:true,tags:["Festival","Wellness"],emoji:"🌟"},
  {id:4,title:"The Real Charlie Chaplin",category:"Screening",date:"Wednesday, June 17, 2026",time:"7:30 PM – 9:30 PM",doorsOpen:"7:00 PM",location:"Studio SYN",address:"2 Laureleaf Ave Markham, ON L3T 4S6",speaker:null,desc:"A fascinating documentary uncovering the real man behind the iconic Tramp character — his genius, controversies, and extraordinary life.",reg:"RSVP",price:"Free",mode:"In Person",lang:"English",carpool:false,tags:["Screening","Culture"],emoji:"🎬"},
  {id:5,title:"Circle of Presence Retreat",category:"Retreat",date:"Saturday, June 20, 2026",time:"9:00 AM – 6:00 PM",doorsOpen:"8:30 AM",location:"Bond Head Farm",address:"Bond Head, Ontario",speaker:null,desc:"A transformative one-day wellness retreat set in nature. Guided breathwork, sharing circles, mindful movement, and nourishing meals.",reg:"Ticketing",price:"$85 CAD",mode:"In Person",lang:"English, Persian",carpool:true,tags:["Retreat","Wellness"],emoji:"🌿"},
  {id:6,title:"Hand Pan Workshop",category:"Workshop",date:"Sunday, June 21, 2026",time:"12:00 PM – 2:00 PM",doorsOpen:"11:45 AM",location:"Studio SYN",address:"2 Laureleaf Ave Markham, ON L3T 4S6",speaker:null,desc:"Discover the magical, ethereal sounds of the hand pan. Beginner-friendly — no musical experience required.",reg:"RSVP",price:"Free",mode:"In Person",lang:"English",carpool:false,tags:["Workshop","Music"],emoji:"🥁"},
  {id:7,title:"MAN ON WIRE",category:"Screening",date:"Wednesday, June 24, 2026",time:"7:30 PM – 9:30 PM",doorsOpen:"7:00 PM",location:"Studio SYN",address:"2 Laureleaf Ave Markham, ON L3T 4S6",speaker:null,desc:"The extraordinary true story of Philippe Petit's audacious high-wire walk between the Twin Towers in 1974.",reg:"RSVP",price:"Free",mode:"In Person",lang:"English",carpool:false,tags:["Screening","Culture"],emoji:"🎭"},
  {id:8,title:"Faces Places",category:"Screening",date:"Wednesday, July 1, 2026",time:"7:30 PM – 9:30 PM",doorsOpen:"7:00 PM",location:"Studio SYN",address:"2 Laureleaf Ave Markham, ON L3T 4S6",speaker:null,desc:"A heartwarming road trip documentary by Agnès Varda and JR, creating monumental photographic installations across France.",reg:"RSVP",price:"Free",mode:"In Person",lang:"French, English",carpool:false,tags:["Screening","Art"],emoji:"📸"}
];

/* ─── App state ──────────────────────────────────────────────── */
let EVENTS    = [...SAMPLES];
let page      = 'home';
let selEvent  = null;
let filter    = 'All';
let authUser  = null;
let profile   = null;
let acctTab   = 'tickets';
let phoneStep = 'number';
let phoneTmp  = '';

// form state
let fLangs=[];let fMode='In Person';let fAddrVis='All';
let fReg='RSVP';let fCurr='CAD';let fPublic=true;
let fApproval=false;let fDoor=true;let fCarpool=true;

/* ═══════════ AUTH ═════════════════════════════════════════════ */

async function bootAuth() {
  const { data:{ session } } = await sb.auth.getSession();
  if (session?.user) await syncUser(session.user);

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      await syncUser(session.user);
      closeModal();
      toast('Welcome to Zeenle!', 'ok');
    }
    if (event === 'SIGNED_OUT') {
      authUser = null; profile = null;
      refreshAuthUI();
      if (page === 'account') go('home');
    }
  });
}

async function syncUser(user) {
  authUser = user;
  const { data, error } = await sb.from('users')
    .upsert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name || user.user_metadata?.name || '', avatar_url: user.user_metadata?.avatar_url || '' }, { onConflict: 'id' })
    .select().single();
  if (!error) profile = data;
  refreshAuthUI();
}

/* ─── Email/password login ───────────────────────────────────── */
async function doLogin(e) {
  e.preventDefault();
  const email = v('m-email'), pass = v('m-pass');
  const btn = g('m-login-btn');
  setBtnLoading(btn, 'Signing in…');
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  setBtnLoading(btn, 'Sign In →', false);
  if (error) toast(friendlyError(error), 'err');
}

/* ─── Sign up ────────────────────────────────────────────────── */
async function doSignup(e) {
  e.preventDefault();
  const name = v('s-name'), email = v('s-email'), pass = v('s-pass'), conf = v('s-conf');
  if (!pwValid(pass)) { toast('Password does not meet requirements.','err'); return; }
  if (pass !== conf) { toast('Passwords do not match.','err'); return; }
  const btn = g('s-signup-btn');
  setBtnLoading(btn, 'Creating account…');
  const { error } = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: name }, emailRedirectTo: window.location.origin + '/Zeenle/' } });
  setBtnLoading(btn, 'Create Account →', false);
  if (error) toast(friendlyError(error), 'err');
  else { closeModal(); toast('Account created! Check your email to confirm.', 'ok'); }
}

/* ─── OAuth ──────────────────────────────────────────────────── */
async function doOAuth(provider) {
  const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.href } });
  if (error) toast(friendlyError(error), 'err');
}

/* ─── Phone ──────────────────────────────────────────────────── */
async function sendOTP() {
  const num = v('ph-number');
  if (!num) { toast('Enter a phone number.','err'); return; }
  phoneTmp = num;
  const btn = g('ph-send-btn');
  setBtnLoading(btn, 'Sending…');
  const { error } = await sb.auth.signInWithOtp({ phone: num });
  setBtnLoading(btn, 'Send Code', false);
  if (error) { toast(friendlyError(error),'err'); return; }
  phoneStep = 'otp'; renderPhone();
}

async function verifyOTP() {
  const token = v('ph-otp');
  if (!token) { toast('Enter the code.','err'); return; }
  const btn = g('ph-verify-btn');
  setBtnLoading(btn, 'Verifying…');
  const { data, error } = await sb.auth.verifyOtp({ phone: phoneTmp, token, type: 'sms' });
  setBtnLoading(btn, 'Verify →', false);
  if (error) { toast(friendlyError(error),'err'); return; }
  const { data: p } = await sb.from('users').select('full_name').eq('id', data.user.id).single();
  if (!p?.full_name) { phoneStep = 'name'; renderPhone(); }
}

async function savePhoneName() {
  const name = v('ph-name');
  if (!name) { toast('Enter your name.','err'); return; }
  const { data:{ user } } = await sb.auth.getUser();
  await sb.from('users').update({ full_name: name }).eq('id', user.id);
}

function renderPhone() {
  const el = g('phone-step');
  if (!el) return;
  if (phoneStep === 'number') {
    el.innerHTML = `
      <div class="mfield"><label class="mlabel">Phone Number</label>
        <input id="ph-number" type="tel" class="minput" placeholder="+1 (416) 000-0000" autocomplete="tel">
        <div style="font-size:11px;color:var(--text-3);margin-top:4px">We'll send you a code via SMS.</div>
      </div>
      <button id="ph-send-btn" class="btn-submit" onclick="sendOTP()">Send Code →</button>`;
  } else if (phoneStep === 'otp') {
    el.innerHTML = `
      <p style="font-size:13px;color:var(--text-2);margin-bottom:14px">Code sent to <strong>${phoneTmp}</strong></p>
      <div class="mfield"><label class="mlabel">Verification Code</label>
        <input id="ph-otp" type="text" class="minput" placeholder="000000" maxlength="6" autocomplete="one-time-code" style="letter-spacing:5px;font-size:20px;text-align:center">
      </div>
      <button id="ph-verify-btn" class="btn-submit" onclick="verifyOTP()">Verify →</button>
      <button onclick="phoneStep='number';renderPhone()" style="width:100%;padding:8px;font-size:12px;color:var(--text-3);background:none;border:none;cursor:pointer;margin-top:4px">← Different number</button>`;
  } else {
    el.innerHTML = `
      <p style="font-size:13px;color:var(--text-2);margin-bottom:14px">What's your name?</p>
      <div class="mfield"><label class="mlabel">Full Name</label>
        <input id="ph-name" type="text" class="minput" placeholder="Your name" autocomplete="name">
      </div>
      <button class="btn-submit" onclick="savePhoneName()">Finish →</button>`;
  }
}

/* ─── Logout ─────────────────────────────────────────────────── */
async function doLogout() {
  await sb.auth.signOut();
  closeDropdown();
  closeDrawer();
  toast('Logged out.');
}

/* ─── Password validation ────────────────────────────────────── */
function pwValid(val) {
  return val.length >= 8 && /[A-Z]/.test(val) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
}
function liveCheck(val) {
  const len = val.length >= 8;
  const up  = /[A-Z]/.test(val);
  const sp  = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
  setCheck('pwc-len', len, 'At least 8 characters');
  setCheck('pwc-up',  up,  'At least 1 uppercase letter');
  setCheck('pwc-sp',  sp,  'At least 1 special character');
}
function liveMatch() {
  const ok = v('s-pass') === v('s-conf') && v('s-conf').length > 0;
  setCheck('pwc-match', ok, 'Passwords match');
}
function setCheck(id, ok, label) {
  const el = g(id); if (!el) return;
  el.textContent = (ok ? '✓ ' : '✗ ') + label;
  el.className = 'pwc' + (ok ? ' ok' : '');
}
function friendlyError(err) {
  const m = err.message || '';
  if (m.includes('Invalid login')) return 'Incorrect email or password.';
  if (m.includes('Email not confirmed')) return 'Please confirm your email first.';
  if (m.includes('User already registered')) return 'An account with this email already exists.';
  if (m.includes('provider is not enabled')) return 'This login method is not enabled yet.';
  return m;
}

/* ─── UI helpers ─────────────────────────────────────────────── */
function v(id) { return g(id)?.value?.trim() || ''; }
function g(id) { return document.getElementById(id); }
function setBtnLoading(btn, text, loading=true) { if (!btn) return; btn.textContent=text; btn.disabled=loading; }

function refreshAuthUI() {
  const in_ = !!authUser;
  document.querySelectorAll('.show-loggedout').forEach(el => el.style.display = in_ ? 'none' : '');
  document.querySelectorAll('.show-loggedin').forEach(el => el.style.display = in_ ? '' : 'none');
  const av = g('nav-avatar');
  if (av && profile) {
    const name = profile.full_name || authUser.email || '';
    av.textContent = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?';
  }
  const uname = g('nav-username');
  if (uname && profile) uname.textContent = (profile.full_name || authUser.email || '').split(' ')[0];
  const drawerAuth = g('drawer-auth');
  if (drawerAuth) {
    drawerAuth.innerHTML = in_
      ? `<a href="#" onclick="go('account');return false"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>My Account</a>
         <div class="dsep"></div>
         <a href="#" onclick="doLogout();return false" style="color:var(--accent)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>Log Out</a>`
      : `<a href="#" onclick="openModal('login');closeDrawer();return false"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>Login / Sign Up</a>`;
  }
}

/* ─── Modal ──────────────────────────────────────────────────── */
function openModal(tab='login') {
  g('auth-modal').classList.add('open');
  switchTab(tab);
}
function closeModal() { g('auth-modal').classList.remove('open'); }
function switchTab(tab) {
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('on', t.dataset.tab===tab));
  document.querySelectorAll('.mform').forEach(f => f.classList.toggle('on', f.id==='mf-'+tab));
  document.querySelectorAll('.phone-step').forEach(s => s.classList.toggle('on', tab==='phone'));
  if (tab==='phone') renderPhone();
}

/* ─── Dropdown ───────────────────────────────────────────────── */
function toggleDropdown() { g('nav-dropdown').classList.toggle('open'); }
function closeDropdown() { g('nav-dropdown')?.classList.remove('open'); }

/* ─── Drawer ─────────────────────────────────────────────────── */
function openDrawer() { g('overlay').classList.add('open'); g('drawer').classList.add('open'); }
function closeDrawer() { g('overlay').classList.remove('open'); g('drawer').classList.remove('open'); }

/* ─── Toast ──────────────────────────────────────────────────── */
function toast(msg, type='') {
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' '+type : '');
  el.textContent = msg; document.body.appendChild(el);
  setTimeout(()=>el.classList.add('show'),10);
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},3200);
}

/* ═══════════ ROUTER ═══════════════════════════════════════════ */
function go(p, data) {
  page = p; selEvent = data || null;
  document.querySelectorAll('.page-view').forEach(v=>v.classList.remove('active'));
  g('page-'+p)?.classList.add('active');
  window.scrollTo(0,0);
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.toggle('active', a.dataset.page===p));
  closeDrawer(); closeDropdown();
  if (p==='home')    { loadEvents(); return; }
  if (p==='detail')  { renderDetail(); return; }
  if (p==='account') { if (!authUser) { openModal('login'); return; } renderAccount(); return; }
  if (p==='create')  { if (!authUser) { openModal('login'); return; } renderCreate(); return; }
}

/* ═══════════ EVENTS ═══════════════════════════════════════════ */

async function loadEvents() {
  try {
    const { data, error } = await sb.from('events')
      .select('*, categories(name)')
      .eq('is_public', true).eq('status','published')
      .order('start_at', { ascending: true });
    if (!error && data?.length) {
      EVENTS = data.map(e => ({
        id: e.id, dbId: e.id,
        title: e.title, category: e.categories?.name||'Event',
        date: e.start_at ? new Date(e.start_at).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : '',
        time: e.start_at ? new Date(e.start_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : '',
        doorsOpen: e.doors_open_at ? new Date(e.doors_open_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : '',
        location: e.venue_name||'', address: e.address||'', speaker: e.speaker||null,
        desc: e.description||'', reg: e.registration_method||'RSVP',
        price: e.price>0 ? `$${e.price} ${e.currency}` : 'Free',
        mode: e.mode||'In Person', lang: (e.languages||[]).join(', '),
        carpool: e.allow_carpool, tags:[e.categories?.name||'Event'],
        emoji: catEmoji(e.categories?.name)
      }));
    }
  } catch(_) {}
  renderCards();
}

function catEmoji(c) { return {Workshop:'💼',Festival:'🌟',Screening:'🎬',Retreat:'🌿',Music:'🥁',Art:'📸',Culture:'🎭',Networking:'🤝'}[c]||'📅'; }

function posterColors(id) {
  const P=[['#1A3A2A','#2D6A4A'],['#1a1a2e','#16213e'],['#7B0D1E','#D4324A'],['#1C1C1C','#3A3A3A'],['#3D2B1F','#8B6347'],['#0D1B2A','#1B4F72'],['#0B3D0B','#1A7A1A'],['#2D1B69','#5B2D8E']];
  const i = typeof id==='number' ? (id-1)%P.length : Math.abs((id||'').charCodeAt(0)||0)%P.length;
  return P[i];
}

function makePoster(ev, size='card') {
  const w=size==='detail'?420:400, h=size==='detail'?560:280;
  const [c1,c2]=posterColors(ev.dbId||ev.id);
  const cat=(ev.category||'EVENT').toUpperCase();
  const title=(ev.title||'').length>24?ev.title.slice(0,24)+'…':ev.title;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs><linearGradient id="pg${ev.id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#pg${ev.id})"/>
    <rect y="${h-4}" width="${w}" height="4" fill="rgba(212,0,26,0.7)"/>
    <text x="20" y="36" font-family="sans-serif" font-size="10" font-weight="700" fill="rgba(255,255,255,0.5)" letter-spacing="3">${cat}</text>
    <text x="20" y="${size==='detail'?110:90}" font-family="sans-serif" font-size="${size==='detail'?52:44}" fill="#fff">${ev.emoji||'📅'}</text>
    <text x="20" y="${size==='detail'?185:150}" font-family="sans-serif" font-size="${size==='detail'?26:20}" font-weight="700" fill="#fff">${title}</text>
    ${size==='detail'&&ev.speaker?`<text x="20" y="${h-75}" font-family="sans-serif" font-size="10" fill="rgba(255,255,255,0.5)" font-weight="600" letter-spacing="2">SPEAKER</text><text x="20" y="${h-55}" font-family="sans-serif" font-size="14" fill="#fff" font-weight="700">${ev.speaker}</text>`:''}
    <text x="20" y="${h-38}" font-family="sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.85)">${ev.date||''}</text>
    <text x="20" y="${h-20}" font-family="sans-serif" font-size="11" fill="rgba(255,255,255,0.55)">${ev.time||''} · ${ev.location||''}</text>
  </svg>`;
}

function renderCards() {
  const grid = g('events-grid'); if (!grid) return;
  const cats = ['All',...new Set(EVENTS.map(e=>e.category))];
  const chips = g('filter-chips');
  if (chips) chips.innerHTML = cats.map(c=>`<button class="chip${filter===c?' active':''}" onclick="setFilter('${c}')">${c}</button>`).join('');
  const list = filter==='All' ? EVENTS : EVENTS.filter(e=>e.category===filter);
  if (!list.length) { grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:60px;color:#999">No events found.</div>'; return; }
  grid.innerHTML = list.map((ev,i)=>`
    <div class="ecard fu" style="animation-delay:${i*.04}s" onclick="go('detail',EVENTS[${EVENTS.indexOf(ev)}])">
      <div class="ecard-poster">${makePoster(ev,'card')}</div>
      <div class="ecard-body">
        <div class="ecard-tags">
          ${ev.tags.map(t=>`<span class="tag">${t}</span>`).join('')}
          ${ev.price==='Free'?'<span class="tag free">Free</span>':''}
          ${ev.lang?.includes('Persian')?'<span class="tag blue">🇮🇷 FA</span>':''}
        </div>
        <div class="ecard-title">${ev.title}</div>
        <div class="ecard-meta">
          <div class="meta-row"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>${ev.date}</div>
          <div class="meta-row"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>${ev.time}</div>
          <div class="meta-row"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>${ev.location}</div>
        </div>
      </div>
      <div class="ecard-foot">
        <span class="ecard-price">${ev.price}</span>
        <button class="btn-view" onclick="event.stopPropagation();go('detail',EVENTS[${EVENTS.indexOf(ev)}])">View Details →</button>
      </div>
    </div>`).join('');
}

function setFilter(f) { filter=f; renderCards(); }
function doSearch(val) {
  const t=val.toLowerCase();
  document.querySelectorAll('.ecard').forEach(c=>c.style.display=c.textContent.toLowerCase().includes(t)?'':'none');
}

/* ─── Detail ─────────────────────────────────────────────────── */
function renderDetail() {
  const ev=selEvent; if (!ev) return;
  g('detail-content').innerHTML=`
    <div class="breadcrumb"><a href="#" onclick="go('home');return false">Home</a><span>›</span><span>${ev.title}</span></div>
    <div class="detail-grid">
      <div class="detail-poster">${makePoster(ev,'detail')}</div>
      <div class="detail-side">
        <div class="detail-tags">${ev.tags.map(t=>`<span class="tag">${t}</span>`).join('')}${ev.price==='Free'?'<span class="tag free">Free</span>':''}</div>
        <h1 class="detail-title">${ev.title}</h1>
        <p class="detail-desc">${ev.desc}</p>
        <div class="detail-meta-box">
          <div class="dmr"><div class="dmr-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg></div><div><div class="dmr-label">Date</div><div class="dmr-value">${ev.date}</div></div></div>
          <div class="dmr"><div class="dmr-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div><div class="dmr-label">Time</div><div class="dmr-value">${ev.time}</div><div class="dmr-sub">Doors open ${ev.doorsOpen}</div></div></div>
          <div class="dmr"><div class="dmr-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg></div><div><div class="dmr-label">Location</div><div class="dmr-value">${ev.location}</div><div class="dmr-sub">${ev.address}</div></div></div>
          ${ev.speaker?`<div class="dmr"><div class="dmr-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg></div><div><div class="dmr-label">Speaker</div><div class="dmr-value">${ev.speaker}</div></div></div>`:''}
          <div class="dmr"><div class="dmr-icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div><div class="dmr-label">Price</div><div class="dmr-value">${ev.price}</div></div></div>
        </div>
        <div class="detail-actions">
          <button class="btn-rsvp" onclick="${authUser?`doRSVP('${ev.dbId||ev.id}')`:'openModal()'}">${ev.reg==='RSVP'?'RSVP for this Event →':'Get Tickets →'}</button>
          <button class="btn-share" onclick="shareEv()">Share Event</button>
        </div>
        <div class="accordion">
          ${ev.carpool?`
          <div class="acc-item" id="acc-co"><div class="acc-head" onclick="toggleAcc('co')"><span>🚗 Carpool Offers</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></div><div class="acc-body"><div class="acc-inner">No carpool offers yet.</div></div></div>
          <div class="acc-item" id="acc-cr"><div class="acc-head" onclick="toggleAcc('cr')"><span>🙋 Carpool Requests</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></div><div class="acc-body"><div class="acc-inner">No requests yet.</div></div></div>`:''}
          <div class="acc-item" id="acc-ph"><div class="acc-head" onclick="toggleAcc('ph')"><span>📸 Event Photos</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></div><div class="acc-body"><div class="acc-inner">Photos available to attendees only.</div></div></div>
        </div>
      </div>
    </div>`;
}

async function doRSVP(eventId) {
  if (!authUser) { openModal(); return; }
  const { error } = await sb.from('registrations').insert({ event_id: eventId, user_id: authUser.id, status: 'pending' });
  if (error?.code==='23505') toast("You're already registered!",'err');
  else if (error) toast(error.message,'err');
  else toast('Registration submitted!','ok');
}

function toggleAcc(id) { g('acc-'+id)?.classList.toggle('open'); }
function shareEv() {
  if (navigator.share) navigator.share({ title: selEvent?.title, url: location.href });
  else { navigator.clipboard?.writeText(location.href); toast('Link copied!','ok'); }
}

/* ─── Account ────────────────────────────────────────────────── */
async function renderAccount() {
  const name = profile?.full_name || authUser?.email?.split('@')[0] || 'User';
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  let pts=0, tickets=[];
  const { data: pData } = await sb.from('zee_points').select('amount').eq('user_id', authUser.id);
  pts = (pData||[]).reduce((s,r)=>s+r.amount,0);
  const { data: rData } = await sb.from('registrations').select('*, events(title,start_at,venue_name)').eq('user_id', authUser.id).order('created_at',{ascending:false});
  tickets = rData||[];

  g('account-content').innerHTML=`
    <div class="acct-banner">
      <div class="acct-av">${initials}</div>
      <div class="acct-info">
        <h2>${name}</h2>
        <p>${authUser.email}</p>
        <p style="margin-top:3px;font-size:12px;color:#666">Member since ${new Date(authUser.created_at).getFullYear()}</p>
      </div>
      <div class="zee-box"><div class="n">${pts}</div><div class="l">ZeePoints</div></div>
    </div>
    <div class="acct-tabs">
      <div class="atab${acctTab==='tickets'?' on':''}" onclick="switchAcctTab('tickets')">My Tickets</div>
      <div class="atab${acctTab==='events'?' on':''}" onclick="switchAcctTab('events')">My Events</div>
      <div class="atab${acctTab==='referrals'?' on':''}" onclick="switchAcctTab('referrals')">Referrals & Points</div>
    </div>
    <div class="apanel${acctTab==='tickets'?' on':''}" id="ap-tickets">
      ${tickets.length ? tickets.map(r=>`
        <div class="tcard">
          <div class="tcard-poster">📅</div>
          <div class="tcard-body">
            <div class="tcard-title">${r.events?.title||'Event'}</div>
            <div class="tcard-meta">${r.events?.start_at?new Date(r.events.start_at).toLocaleDateString():''}<br>${r.events?.venue_name||''}</div>
          </div>
          <div class="tcard-side"><span class="status-badge">${r.status}</span></div>
        </div>`).join('') :
        `<div class="empty"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"/></svg><p>No tickets yet. <a href="#" onclick="go('home');return false" style="color:var(--accent);font-weight:600">Browse events →</a></p></div>`}
    </div>
    <div class="apanel${acctTab==='events'?' on':''}" id="ap-events">
      <div style="margin-bottom:16px"><button class="btn-save" onclick="go('create')">+ Create New Event</button></div>
      <div class="empty"><p>No events created yet.</p></div>
    </div>
    <div class="apanel${acctTab==='referrals'?' on':''}" id="ap-referrals">
      <div class="ref-card">
        <h4>🎁 ZeePoints</h4>
        <p>Earn points by attending events and referring friends. Redeem for prizes and discounts.</p>
        <div class="stats-grid">
          <div class="stat-box"><div class="sn">${pts}</div><div class="sl">Available</div></div>
          <div class="stat-box"><div class="sn" style="color:var(--accent)">${pts}</div><div class="sl">Lifetime</div></div>
          <div class="stat-box"><div class="sn" style="color:var(--text-3)">0</div><div class="sl">Redeemed</div></div>
        </div>
        <h4 style="margin-bottom:8px">🔗 Referral Link</h4>
        <p>Refer friends and earn 50 ZeePoints each.</p>
        <div class="ref-link">
          <span>zeenle.com/ref/${profile?.referral_code||authUser.id.slice(0,8)}</span>
          <button class="btn-copy" onclick="navigator.clipboard?.writeText(this.previousElementSibling.textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)">Copy</button>
        </div>
      </div>
    </div>`;
}

function switchAcctTab(t) { acctTab=t; renderAccount(); }

/* ─── Create Event ───────────────────────────────────────────── */
function renderCreate() {
  g('create-content').innerHTML=`
    <h1 class="form-page-title">Create an Event</h1>
    <p class="form-page-sub">Fill in the details below to publish your event.</p>
    <div class="fsec">
      <div class="fsec-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>Main Information</div>
      <div class="frow x1"><div class="ff"><label class="flabel">Event Poster</label><div class="upload-area" onclick="document.getElementById('f-poster').click()"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg><p>Click to upload</p><span>PNG, JPG, MP4 — max 10MB</span><input id="f-poster" type="file" style="display:none" accept="image/*,video/mp4" onchange="posterPicked(this)"></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Title <span class="req">*</span></label><input id="f-title" type="text" class="finput" placeholder="Event name"></div><div class="ff"><label class="flabel">Category</label><select id="f-cat" class="fselect"><option>Workshop</option><option>Festival</option><option>Screening</option><option>Retreat</option><option>Music</option><option>Art</option><option>Culture</option><option>Networking</option><option>Other</option></select></div></div>
      <div class="frow x1"><div class="ff"><label class="flabel">Description</label><textarea id="f-desc" class="ftextarea" placeholder="Tell attendees about this event…"></textarea></div></div>
      <div class="frow x3"><div class="ff"><label class="flabel">Start <span class="req">*</span></label><input id="f-start" type="datetime-local" class="finput"></div><div class="ff"><label class="flabel">End</label><input id="f-end" type="datetime-local" class="finput"></div><div class="ff"><label class="flabel">Doors Open</label><input id="f-doors" type="datetime-local" class="finput"></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Registration</label><div class="tgrp"><button class="tbtn on" onclick="fReg='RSVP';tgrpToggle(this)">RSVP</button><button class="tbtn" onclick="fReg='Ticketing';tgrpToggle(this)">Ticketing</button></div></div><div class="ff"><label class="flabel">Currency</label><div class="tgrp"><button class="tbtn on" onclick="fCurr='CAD';tgrpToggle(this)">CAD</button><button class="tbtn" onclick="fCurr='USD';tgrpToggle(this)">USD</button><button class="tbtn" onclick="fCurr='EUR';tgrpToggle(this)">EUR</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Price</label><input id="f-price" type="number" class="finput" placeholder="0 for free" min="0" step="0.01"></div><div class="ff"><label class="flabel">Max Tickets</label><input id="f-max" type="number" class="finput" placeholder="0 = unlimited"></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Contact Email</label><input id="f-email" type="email" class="finput" placeholder="contact@example.com"></div><div class="ff"><label class="flabel">Contact Phone</label><input id="f-phone" type="tel" class="finput" placeholder="+1 (416) 000-0000"></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>Location</div>
      <div class="frow"><div class="ff"><label class="flabel">Mode</label><div class="tgrp"><button class="tbtn on" onclick="fMode='In Person';tgrpToggle(this)">In Person</button><button class="tbtn" onclick="fMode='Online';tgrpToggle(this)">Online</button><button class="tbtn" onclick="fMode='Hybrid';tgrpToggle(this)">Hybrid</button></div></div><div class="ff"><label class="flabel">Address Visible To</label><div class="tgrp"><button class="tbtn on" onclick="fAddrVis='All';tgrpToggle(this)">All</button><button class="tbtn" onclick="fAddrVis='Approved Tickets';tgrpToggle(this)">Approved</button><button class="tbtn" onclick="fAddrVis='Email Only';tgrpToggle(this)">Email Only</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Venue</label><input id="f-venue" type="text" class="finput" placeholder="Venue name"></div><div class="ff"><label class="flabel">Street Address</label><input id="f-addr" type="text" class="finput" placeholder="123 Main St"></div></div>
      <div class="frow x3"><div class="ff"><label class="flabel">City</label><input id="f-city" type="text" class="finput" placeholder="Toronto"></div><div class="ff"><label class="flabel">Province</label><input id="f-prov" type="text" class="finput" placeholder="ON"></div><div class="ff"><label class="flabel">Postal</label><input id="f-postal" type="text" class="finput" placeholder="M1A 1A1"></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"/></svg>Controls</div>
      <div class="frow"><div class="ff"><label class="flabel">Is Public</label><div class="tgrp"><button class="tbtn on" onclick="fPublic=true;tgrpToggle(this)">Yes</button><button class="tbtn" onclick="fPublic=false;tgrpToggle(this)">No</button></div></div><div class="ff"><label class="flabel">Needs Approval</label><div class="tgrp"><button class="tbtn" onclick="fApproval=true;tgrpToggle(this)">Yes</button><button class="tbtn on" onclick="fApproval=false;tgrpToggle(this)">No</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Tickets at Door</label><div class="tgrp"><button class="tbtn on" onclick="fDoor=true;tgrpToggle(this)">Yes</button><button class="tbtn" onclick="fDoor=false;tgrpToggle(this)">No</button></div></div><div class="ff"><label class="flabel">Allow Carpool</label><div class="tgrp"><button class="tbtn on" onclick="fCarpool=true;tgrpToggle(this)">Yes</button><button class="tbtn" onclick="fCarpool=false;tgrpToggle(this)">No</button></div></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"/></svg>Languages</div>
      <div class="lang-wrap">${['English','French','Spanish','Persian','Hindi','Arabic','Mandarin','Cantonese','Portuguese','German','Dutch','Italian','Russian','Ukrainian'].map(l=>`<button class="lchip${fLangs.includes(l)?' on':''}" onclick="toggleLang('${l}',this)">${l}</button>`).join('')}</div>
    </div>
    <div class="form-actions">
      <button class="btn-save" onclick="submitEvent()">Save & Publish</button>
      <button class="btn-cancel-form" onclick="go('home')">Cancel</button>
    </div>`;
}

function tgrpToggle(btn) { btn.closest('.tgrp').querySelectorAll('.tbtn').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); }
function toggleLang(l,btn) { fLangs.includes(l) ? (fLangs=fLangs.filter(x=>x!==l),btn.classList.remove('on')) : (fLangs.push(l),btn.classList.add('on')); }
function posterPicked(inp) { const f=inp.files[0]; if(!f) return; const z=inp.closest('.upload-area'); z.innerHTML=`<p style="color:var(--green);font-weight:600">✓ ${f.name}</p><span>Click to change</span>`; z.onclick=()=>document.getElementById('f-poster').click(); }

async function submitEvent() {
  const title=v('f-title'), start=v('f-start');
  if (!title||!start) { toast('Title and start date required.','err'); return; }
  const btn=document.querySelector('.btn-save');
  setBtnLoading(btn,'Saving…');
  const { error } = await sb.from('events').insert({
    created_by:authUser.id, title,
    description: v('f-desc'), start_at: new Date(start).toISOString(),
    end_at: v('f-end')?new Date(v('f-end')).toISOString():null,
    doors_open_at: v('f-doors')?new Date(v('f-doors')).toISOString():null,
    registration_method:fReg, currency:fCurr,
    price:parseFloat(v('f-price')||0), max_tickets:parseInt(v('f-max')||0),
    mode:fMode, address_visible_to:fAddrVis,
    venue_name:v('f-venue'), address:v('f-addr'),
    city:v('f-city'), province:v('f-prov'), postal_code:v('f-postal'),
    is_public:fPublic, needs_approval:fApproval,
    tickets_at_door:fDoor, allow_carpool:fCarpool,
    languages:fLangs, status:'published'
  });
  setBtnLoading(btn,'Save & Publish',false);
  if (error) toast(error.message,'err');
  else { toast('Event published!','ok'); await loadEvents(); go('home'); }
}

/* ═══════════ INIT ═════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await bootAuth();
  loadEvents();

  g('hamburger')?.addEventListener('click', openDrawer);
  g('overlay')?.addEventListener('click', closeDrawer);
  g('drawer-close-btn')?.addEventListener('click', closeDrawer);
  g('auth-modal')?.addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });
  g('login-form')?.addEventListener('submit', doLogin);
  g('signup-form')?.addEventListener('submit', doSignup);

  // Close dropdown when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-user')) closeDropdown();
  });
});
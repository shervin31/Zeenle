/* ═══════════════════════════════════════════════════════
   Zeenle | main.js — fully functional
   Auth · Events · RSVP · Carpool · Location · Create
═══════════════════════════════════════════════════════ */

const SB_URL = 'https://pfuylqlexsaoryyxnrma.supabase.co';
const SB_KEY = 'sb_publishable_YZRUQQyswKSbTTtLbnUybQ_9X2EFSzT';
const sb = supabase.createClient(SB_URL, SB_KEY);

/* ── Sample fallback events ── */
const SAMPLES = [
  {id:1,title:"Job Search Workshop",category:"Workshop",date:"Saturday, June 6, 2026",time:"10:00 AM – 12:00 PM",doorsOpen:"9:45 AM",location:"Welcome Centre",address:"9325 Yonge St, Richmond Hill, ON",lat:43.8801,lng:-79.4400,speaker:"Behshad Sabah",desc:"An engaging workshop to inspire, inform, and empower professionals navigating today's competitive job market. Covers modern job search strategies, LinkedIn optimization, and interview techniques.",reg:"RSVP",price:"Free",mode:"In Person",lang:"Persian, English",carpool:true,tags:["Workshop","Career"],emoji:"💼"},
  {id:2,title:"Resume & Networking Workshop",category:"Workshop",date:"Saturday, June 6, 2026",time:"12:30 PM – 2:30 PM",doorsOpen:"12:15 PM",location:"Welcome Centre",address:"9325 Yonge St, Richmond Hill, ON",lat:43.8801,lng:-79.4400,speaker:"Behshad Sabah",desc:"Learn to craft a standout resume and build a professional network with real-world strategies used by top recruiters.",reg:"RSVP",price:"Free",mode:"In Person",lang:"Persian, English",carpool:true,tags:["Workshop","Career"],emoji:"📄"},
  {id:3,title:"Body Awareness Festival",category:"Festival",date:"Sunday, June 7, 2026",time:"3:30 PM – 8:00 PM",doorsOpen:"3:00 PM",location:"Mehr Aeenkadah",address:"King City, Richmond Hill, ON",lat:43.9300,lng:-79.5300,speaker:null,desc:"A full-day festival celebrating movement, mindfulness, and body awareness. Workshops, guided meditations, dance sessions, and expert talks.",reg:"Ticketing",price:"$25 CAD",mode:"In Person",lang:"Persian, English",carpool:true,tags:["Festival","Wellness"],emoji:"🌟"},
  {id:4,title:"The Real Charlie Chaplin",category:"Screening",date:"Wednesday, June 17, 2026",time:"7:30 PM – 9:30 PM",doorsOpen:"7:00 PM",location:"Studio SYN",address:"2 Laureleaf Ave, Markham, ON",lat:43.8561,lng:-79.3370,speaker:null,desc:"A documentary uncovering the real man behind the Tramp character — his genius, controversies, and extraordinary life. Post-screening discussion included.",reg:"RSVP",price:"Free",mode:"In Person",lang:"English",carpool:false,tags:["Screening","Culture"],emoji:"🎬"},
  {id:5,title:"Circle of Presence Retreat",category:"Retreat",date:"Saturday, June 20, 2026",time:"9:00 AM – 6:00 PM",doorsOpen:"8:30 AM",location:"Bond Head Farm",address:"Bond Head, Ontario",lat:44.1100,lng:-79.7300,speaker:null,desc:"A transformative one-day wellness retreat in nature. Guided breathwork, sharing circles, mindful movement, and nourishing meals included.",reg:"Ticketing",price:"$85 CAD",mode:"In Person",lang:"English, Persian",carpool:true,tags:["Retreat","Wellness"],emoji:"🌿"},
  {id:6,title:"Hand Pan Workshop",category:"Workshop",date:"Sunday, June 21, 2026",time:"12:00 PM – 2:00 PM",doorsOpen:"11:45 AM",location:"Studio SYN",address:"2 Laureleaf Ave, Markham, ON",lat:43.8561,lng:-79.3370,speaker:null,desc:"Discover the magical sounds of the hand pan. Beginner-friendly — no musical experience required. All instruments provided.",reg:"RSVP",price:"Free",mode:"In Person",lang:"English",carpool:false,tags:["Workshop","Music"],emoji:"🥁"},
  {id:7,title:"MAN ON WIRE",category:"Screening",date:"Wednesday, June 24, 2026",time:"7:30 PM – 9:30 PM",doorsOpen:"7:00 PM",location:"Studio SYN",address:"2 Laureleaf Ave, Markham, ON",lat:43.8561,lng:-79.3370,speaker:null,desc:"The extraordinary true story of Philippe Petit's high-wire walk between the Twin Towers in 1974. An Oscar-winning documentary.",reg:"RSVP",price:"Free",mode:"In Person",lang:"English",carpool:false,tags:["Screening","Culture"],emoji:"🎭"},
  {id:8,title:"Faces Places",category:"Screening",date:"Wednesday, July 1, 2026",time:"7:30 PM – 9:30 PM",doorsOpen:"7:00 PM",location:"Studio SYN",address:"2 Laureleaf Ave, Markham, ON",lat:43.8561,lng:-79.3370,speaker:null,desc:"A heartwarming road trip documentary by Agnès Varda and JR, creating monumental photo installations across rural France.",reg:"RSVP",price:"Free",mode:"In Person",lang:"French, English",carpool:false,tags:["Screening","Art"],emoji:"📸"}
];

/* ── State ── */
let EVENTS=[...SAMPLES],page='home',selEv=null,filter='All';
let authUser=null,profile=null,acctTab='tickets';
let phoneStep='number',phoneTmp='';
let userLat=null,userLng=null,userCity='',sortByLoc=false;
let fLangs=[],fMode='In Person',fAddrVis='All',fReg='RSVP',fCurr='CAD';
let fPublic=true,fApproval=false,fDoor=true,fCarpool=true;

/* ════ AUTH ════════════════════════════════════════════ */
async function bootAuth() {
  const {data:{session}} = await sb.auth.getSession();
  if (session?.user) await syncUser(session.user);
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event==='SIGNED_IN') { await syncUser(session.user); closeModal(); toast('Welcome to Zeenle!','ok'); }
    if (event==='SIGNED_OUT') { authUser=null; profile=null; refreshAuthUI(); if(page==='account') go('home'); }
  });
}

async function syncUser(user) {
  authUser=user;
  const {data,error} = await sb.from('users')
    .upsert({id:user.id,email:user.email,full_name:user.user_metadata?.full_name||user.user_metadata?.name||'',avatar_url:user.user_metadata?.avatar_url||''},{onConflict:'id'})
    .select().single();
  if (!error) profile=data;
  refreshAuthUI();
}

async function doLogin(e) {
  e.preventDefault();
  const btn=g('m-login-btn'); setBtnLoad(btn,'Signing in…');
  const {error} = await sb.auth.signInWithPassword({email:v('m-email'),password:v('m-pass')});
  setBtnLoad(btn,'Sign In →',false);
  if (error) toast(niceErr(error),'err');
}

async function doSignup(e) {
  e.preventDefault();
  const pass=v('s-pass'),conf=v('s-conf');
  if (!pwOk(pass)) { toast('Password does not meet requirements.','err'); return; }
  if (pass!==conf) { toast('Passwords do not match.','err'); return; }
  const btn=g('s-btn'); setBtnLoad(btn,'Creating account…');
  const {error} = await sb.auth.signUp({email:v('s-email'),password:pass,options:{data:{full_name:v('s-name')},emailRedirectTo:location.origin+'/Zeenle/'}});
  setBtnLoad(btn,'Create Account →',false);
  if (error) toast(niceErr(error),'err');
  else { closeModal(); toast('Account created! Check your email to confirm.','ok'); }
}

async function doOAuth(provider) {
  const {error} = await sb.auth.signInWithOAuth({provider,options:{redirectTo:location.href}});
  if (error) toast(niceErr(error),'err');
}

async function sendOTP() {
  const num=v('ph-num'); if(!num){toast('Enter a phone number.','err');return;}
  phoneTmp=num;
  const btn=g('ph-send'); setBtnLoad(btn,'Sending…');
  const {error} = await sb.auth.signInWithOtp({phone:num});
  setBtnLoad(btn,'Send Code',false);
  if (error){toast(niceErr(error),'err');return;}
  phoneStep='otp'; renderPhone();
}

async function verifyOTP() {
  const token=v('ph-otp'); if(!token){toast('Enter the code.','err');return;}
  const btn=g('ph-verify'); setBtnLoad(btn,'Verifying…');
  const {data,error} = await sb.auth.verifyOtp({phone:phoneTmp,token,type:'sms'});
  setBtnLoad(btn,'Verify →',false);
  if (error){toast(niceErr(error),'err');return;}
  const {data:p} = await sb.from('users').select('full_name').eq('id',data.user.id).single();
  if (!p?.full_name){phoneStep='name';renderPhone();}
}

async function savePhoneName() {
  const name=v('ph-name'); if(!name){toast('Enter your name.','err');return;}
  const {data:{user}} = await sb.auth.getUser();
  await sb.from('users').update({full_name:name}).eq('id',user.id);
}

function renderPhone() {
  const el=g('phone-step'); if(!el) return;
  if (phoneStep==='number') {
    el.innerHTML=`<div class="mfield"><label class="mlabel">Phone Number</label><input id="ph-num" type="tel" class="minput" placeholder="+1 (416) 000-0000" autocomplete="tel"><div style="font-size:11px;color:var(--text3);margin-top:4px">We'll send a verification code via SMS.</div></div><button id="ph-send" class="btn-auth" onclick="sendOTP()">Send Code →</button>`;
  } else if (phoneStep==='otp') {
    el.innerHTML=`<p style="font-size:13px;color:var(--text2);margin-bottom:14px">Code sent to <strong>${phoneTmp}</strong></p><div class="mfield"><label class="mlabel">Verification Code</label><input id="ph-otp" type="text" class="minput" placeholder="000000" maxlength="6" autocomplete="one-time-code" style="letter-spacing:5px;font-size:20px;text-align:center"></div><button id="ph-verify" class="btn-auth" onclick="verifyOTP()">Verify →</button><button onclick="phoneStep='number';renderPhone()" style="width:100%;padding:8px;font-size:12px;color:var(--text3);background:none;border:none;cursor:pointer;margin-top:4px">← Different number</button>`;
  } else {
    el.innerHTML=`<p style="font-size:13px;color:var(--text2);margin-bottom:14px">Almost done — what's your name?</p><div class="mfield"><label class="mlabel">Full Name</label><input id="ph-name" type="text" class="minput" placeholder="Your name" autocomplete="name"></div><button class="btn-auth" onclick="savePhoneName()">Finish →</button>`;
  }
}

async function doLogout() {
  await sb.auth.signOut(); closeDropdown(); closeDrawer();
  toast('Logged out.');
}

/* ── Password ── */
function pwOk(p) { return p.length>=8 && /[A-Z]/.test(p) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p); }
function liveCheck(val) {
  setChk('pwc-len',val.length>=8,'At least 8 characters');
  setChk('pwc-up',/[A-Z]/.test(val),'At least 1 uppercase letter');
  setChk('pwc-sp',/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),'At least 1 special character');
}
function liveMatch() { setChk('pwc-match',v('s-pass')===v('s-conf')&&v('s-conf').length>0,'Passwords match'); }
function setChk(id,ok,label) { const el=g(id); if(!el) return; el.textContent=(ok?'✓ ':'✗ ')+label; el.className='pwc'+(ok?' ok':''); }
function niceErr(e) {
  const m=e.message||'';
  if(m.includes('Invalid login')) return 'Incorrect email or password.';
  if(m.includes('not confirmed')) return 'Please confirm your email first.';
  if(m.includes('already registered')) return 'An account with this email already exists.';
  if(m.includes('not enabled')||m.includes('disabled')) return 'This login method is not enabled. Enable Email provider in Supabase.';
  return m;
}

/* ── Helpers ── */
const g=id=>document.getElementById(id);
const v=id=>g(id)?.value?.trim()||'';
function setBtnLoad(btn,txt,loading=true){if(!btn)return;btn.textContent=txt;btn.disabled=loading;}

function refreshAuthUI() {
  const in_=!!authUser;
  document.querySelectorAll('.show-out').forEach(el=>el.style.display=in_?'none':'');
  document.querySelectorAll('.show-in').forEach(el=>el.style.display=in_?'':'none');
  if(g('nav-av')) g('nav-av').textContent=(profile?.full_name||authUser?.email||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  if(g('nav-uname')) g('nav-uname').textContent=(profile?.full_name||authUser?.email||'').split(' ')[0];
  const da=g('drawer-auth');
  if(da) da.innerHTML=in_
    ? `<a href="#" onclick="go('account');return false">${icon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z')}My Account</a><div class="drawer-sep"></div><a href="#" onclick="doLogout();return false" style="color:var(--red)">${icon('M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9')}Log Out</a>`
    : `<a href="#" onclick="openModal('login');closeDrawer();return false">${icon('M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9')}Login / Sign Up</a>`;
}

function icon(path,w=15){return`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="${w}" height="${w}"><path stroke-linecap="round" stroke-linejoin="round" d="${path}"/></svg>`;}

/* ════ LOCATION ════════════════════════════════════════ */
function requestLocation() {
  if(!navigator.geolocation){toast('Geolocation not supported.','err');return;}
  navigator.geolocation.getCurrentPosition(
    async pos => {
      userLat=pos.coords.latitude; userLng=pos.coords.longitude;
      try {
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json`);
        const d=await r.json();
        userCity=d.address?.city||d.address?.town||d.address?.village||d.address?.suburb||'your area';
      } catch(_){userCity='your area';}
      sortByLoc=true; updateLocBar(); loadEvents(); toast(`Showing events near ${userCity}`,'ok');
    },
    err=>{toast(err.code===1?'Location access denied.':'Could not get your location.','err');}
  );
}

function clearLocation(){userLat=null;userLng=null;userCity='';sortByLoc=false;updateLocBar();loadEvents();}

function updateLocBar(){
  const bar=g('loc-bar'); if(!bar) return;
  if(sortByLoc&&userCity){
    bar.innerHTML=`${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',14)}<span class="loc-text">Events near <strong>${userCity}</strong></span><span class="loc-badge">Near Me</span><button class="loc-act" onclick="clearLocation()">Clear</button>`;
  } else {
    bar.innerHTML=`${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',14)}<span class="loc-text">Showing all events</span><button class="loc-act" onclick="requestLocation()">Use my location →</button>`;
  }
}

function distKm(a,b,c,d){const R=6371,dL=(c-a)*Math.PI/180,dG=(d-b)*Math.PI/180,x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dG/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}

/* ════ EVENTS ══════════════════════════════════════════ */
async function loadEvents() {
  try {
    const {data,error}=await sb.from('events').select('*,categories(name)').eq('is_public',true).eq('status','published').order('start_at',{ascending:true});
    if(!error&&data?.length){
      EVENTS=data.map(e=>({
        id:e.id,dbId:e.id,title:e.title,category:e.categories?.name||'Event',
        date:e.start_at?new Date(e.start_at).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}):'',
        time:e.start_at?new Date(e.start_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'',
        doorsOpen:e.doors_open_at?new Date(e.doors_open_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'',
        location:e.venue_name||'',address:e.address||'',lat:e.lat||null,lng:e.lng||null,
        speaker:e.speaker||null,desc:e.description||'',reg:e.registration_method||'RSVP',
        price:e.price>0?`$${e.price} ${e.currency}`:'Free',mode:e.mode||'In Person',
        lang:(e.languages||[]).join(', '),carpool:e.allow_carpool,
        tags:[e.categories?.name||'Event'],emoji:catEmoji(e.categories?.name),
        poster_url:e.poster_url||null
      }));
    }
  } catch(_){}
  let list=filter==='All'?[...EVENTS]:EVENTS.filter(e=>e.category===filter);
  if(sortByLoc&&userLat&&userLng){
    list=list.map(e=>({...e,dist:(e.lat&&e.lng)?distKm(userLat,userLng,e.lat,e.lng):9999})).sort((a,b)=>a.dist-b.dist);
  }
  renderCards(list);
}

function catEmoji(c){return{Workshop:'💼',Festival:'🌟',Screening:'🎬',Retreat:'🌿',Music:'🥁',Art:'📸',Culture:'🎭',Networking:'🤝'}[c]||'📅';}

function posterColors(id){const P=[['#064E3B','#065F46'],['#1E1B4B','#312E81'],['#7F1D1D','#991B1B'],['#111827','#1F2937'],['#451A03','#78350F'],['#0C4A6E','#075985'],['#14532D','#166534'],['#4A044E','#701A75']];const i=typeof id==='number'?(id-1)%P.length:Math.abs((id||'').charCodeAt(0)||0)%P.length;return P[i];}

function makePosterSVG(ev){
  const [c1,c2]=posterColors(ev.dbId||ev.id);
  const cat=(ev.category||'EVENT').toUpperCase();
  const lines=[];
  const words=(ev.title||'').split(' ');
  let line='';
  for(const w of words){if((line+' '+w).trim().length>18&&line){lines.push(line);line=w;}else{line=(line+' '+w).trim();}}
  if(line) lines.push(line);
  const titleY=lines.length>2?180:200;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" style="width:100%;height:100%;display:block;position:absolute;inset:0">
    <defs><linearGradient id="g${ev.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
    <rect width="300" height="400" fill="url(#g${ev.id})"/>
    <rect y="0" width="300" height="52" fill="rgba(0,0,0,0.3)"/>
    <rect y="348" width="300" height="52" fill="rgba(0,0,0,0.4)"/>
    <rect y="396" width="300" height="4" fill="rgba(220,38,38,0.9)"/>
    <text x="16" y="32" font-family="system-ui,sans-serif" font-size="10" font-weight="700" fill="rgba(255,255,255,0.55)" letter-spacing="2.5">${cat}</text>
    <text x="284" y="32" font-family="system-ui,sans-serif" font-size="10" fill="rgba(255,255,255,0.45)" text-anchor="end">${ev.mode||'In Person'}</text>
    <text x="16" y="110" font-family="system-ui,sans-serif" font-size="58" fill="rgba(255,255,255,0.85)">${ev.emoji||'📅'}</text>
    ${lines.map((l,i)=>`<text x="16" y="${titleY+i*32}" font-family="Georgia,serif" font-size="22" font-weight="700" fill="#fff">${l}</text>`).join('')}
    ${ev.speaker?`<rect x="16" y="${titleY+lines.length*32+10}" width="3" height="18" fill="rgba(220,38,38,0.9)" rx="1.5"/><text x="25" y="${titleY+lines.length*32+24}" font-family="system-ui,sans-serif" font-size="12" fill="rgba(255,255,255,0.85)" font-weight="600">${ev.speaker}</text>`:''}
    <text x="16" y="366" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.9)">${ev.date||''}</text>
    <text x="16" y="383" font-family="system-ui,sans-serif" font-size="11" fill="rgba(255,255,255,0.6)">${ev.time||''}</text>
    <text x="16" y="396" font-family="system-ui,sans-serif" font-size="10" fill="rgba(255,255,255,0.45)">${(ev.location||'').slice(0,36)}</text>
  </svg>`;
}

function renderCards(list){
  const grid=g('events-grid'); if(!grid) return;
  const cats=['All',...new Set(EVENTS.map(e=>e.category))];
  const chips=g('filter-chips');
  if(chips) chips.innerHTML=cats.map(c=>`<button class="chip${filter===c?' active':''}" onclick="setFilter('${c}')">${c}</button>`).join('');
  if(!list?.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:60px;color:#9CA3AF">No events found.</div>';return;}
  grid.innerHTML=list.map((ev,i)=>{
    const idx=EVENTS.findIndex(x=>x.id===ev.id);
    const safeIdx=idx>=0?idx:i;
    const distBadge=ev.dist&&ev.dist<9999?`<span class="tag tag-dist">📍 ${ev.dist.toFixed(1)}km</span>`:'';
    const posterHTML=ev.poster_url
      ?`<img src="${ev.poster_url}" alt="${ev.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">`
      :makePosterSVG(ev);
    return `<div class="ecard fu" style="animation-delay:${i*.04}s" onclick="openDetail(${safeIdx})">
      <div class="ecard-img" style="position:relative;padding-bottom:133%">${posterHTML}</div>
      <div class="ecard-body">
        <div class="ecard-tags">
          <span class="tag tag-cat">${ev.category}</span>
          ${ev.price==='Free'?'<span class="tag tag-free">Free</span>':''}
          ${ev.lang?.includes('Persian')?'<span class="tag tag-lang">FA</span>':''}
          ${distBadge}
        </div>
        <div class="ecard-title">${ev.title}</div>
        <div class="ecard-meta">
          <div class="meta-row">${icon('M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5')}${ev.date}</div>
          <div class="meta-row">${icon('M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z')}${ev.time}</div>
          <div class="meta-row">${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z')}${ev.location}</div>
        </div>
      </div>
      <div class="ecard-foot">
        <span class="ecard-price">${ev.price}</span>
        <button class="btn-view" onclick="event.stopPropagation();openDetail(${safeIdx})">Details →</button>
      </div>
    </div>`;
  }).join('');
}

function openDetail(idx){const ev=EVENTS[idx]||SAMPLES[idx];if(!ev)return;go('detail',ev);}
function setFilter(f){filter=f;loadEvents();}
function doSearch(val){const t=val.toLowerCase();document.querySelectorAll('.ecard').forEach(c=>c.style.display=c.textContent.toLowerCase().includes(t)?'':'none');}

/* ════ ROUTER ══════════════════════════════════════════ */
function go(p,data){
  page=p;selEv=data||null;
  document.querySelectorAll('.page-view').forEach(v=>v.classList.remove('active'));
  g('page-'+p)?.classList.add('active');
  window.scrollTo(0,0);
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.toggle('active',a.dataset.page===p));
  closeDrawer();closeDropdown();
  if(p==='home'){loadEvents();return;}
  if(p==='detail'){renderDetail();return;}
  if(p==='account'){if(!authUser){openModal('login');return;}renderAccount();return;}
  if(p==='create'){if(!authUser){openModal('login');return;}renderCreate();return;}
}

/* ════ DETAIL ══════════════════════════════════════════ */
async function renderDetail(){
  const ev=selEv;if(!ev)return;
  let coList=[],crList=[];
  if(ev.dbId){
    const {data:co}=await sb.from('carpool_offers').select('*,users(full_name)').eq('event_id',ev.dbId);
    const {data:cr}=await sb.from('carpool_requests').select('*,users(full_name)').eq('event_id',ev.dbId);
    coList=co||[];crList=cr||[];
  }
  const posterHTML=ev.poster_url
    ?`<img src="${ev.poster_url}" alt="${ev.title}" style="width:100%;display:block">`
    :`<div class="detail-poster-placeholder">${makePosterSVG(ev)}</div>`;

  g('detail-content').innerHTML=`
    <div class="breadcrumb"><a href="#" onclick="go('home');return false">Home</a><span>›</span><span>${ev.title}</span></div>
    <div class="detail-grid">
      <div class="detail-poster-wrap">${posterHTML}</div>
      <div class="detail-side">
        <div class="detail-tags"><span class="tag tag-cat">${ev.category}</span>${ev.price==='Free'?'<span class="tag tag-free">Free</span>':''}</div>
        <h1 class="detail-title">${ev.title}</h1>
        <p class="detail-desc">${ev.desc}</p>
        <div class="meta-box">
          ${mrow(icon('M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5'),'Date',ev.date)}
          ${mrowSub(icon('M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'),'Time',ev.time,`Doors open ${ev.doorsOpen}`)}
          ${mrowSub(icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z'),'Location',ev.location,ev.address)}
          ${ev.speaker?mrow(icon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'),'Speaker',ev.speaker):''}
          ${mrow(icon('M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z'),'Price',ev.price)}
          ${mrow(icon('M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21'),'Mode',ev.mode)}
        </div>
        <div class="detail-actions">
          <button class="btn-rsvp" onclick="${authUser?`doRSVP('${ev.dbId||ev.id}')`:'openModal()'}">${ev.reg==='RSVP'?'RSVP for this Event →':'Get Tickets →'}</button>
          <button class="btn-secondary" onclick="shareEv()">Share Event</button>
        </div>
        <div class="accordion">
          ${ev.carpool?`
          <div class="acc-item" id="acc-co">
            <div class="acc-head" onclick="toggleAcc('co')">${icon('M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H3m9 6v-3m0 3h6m-9-3v-6m3 6V9m9 9v-6m0 6h-6m6 0h3.75m-3.75-6a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3 0h-6')} Carpool Offers (${coList.length}) ${icon('M19.5 8.25l-7.5 7.5-7.5-7.5')}</div>
            <div class="acc-body"><div class="acc-inner">
              ${coList.length?coList.map(o=>`<div class="carpool-entry"><strong>${o.users?.full_name||'Someone'}</strong> — ${o.seats_available} seat${o.seats_available>1?'s':''} from ${o.departure_location||'TBD'}<br><span style="font-size:11px;color:var(--text3)">${o.notes||''}</span></div>`).join(''):'<p>No carpool offers yet.</p>'}
              ${authUser?`<button class="btn-secondary" style="margin-top:10px;width:100%" onclick="openCarpoolModal('offer','${ev.dbId||ev.id}')">+ Offer a Ride</button>`:`<p style="font-size:12px;color:var(--text3);margin-top:8px"><a href="#" onclick="openModal()" style="color:var(--red)">Login</a> to offer a ride</p>`}
            </div></div>
          </div>
          <div class="acc-item" id="acc-cr">
            <div class="acc-head" onclick="toggleAcc('cr')">${icon('M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z')} Carpool Requests (${crList.length}) ${icon('M19.5 8.25l-7.5 7.5-7.5-7.5')}</div>
            <div class="acc-body"><div class="acc-inner">
              ${crList.length?crList.map(r=>`<div class="carpool-entry"><strong>${r.users?.full_name||'Someone'}</strong> — from ${r.pickup_location||'TBD'}<br><span style="font-size:11px;color:var(--text3)">${r.notes||''}</span></div>`).join(''):'<p>No requests yet.</p>'}
              ${authUser?`<button class="btn-secondary" style="margin-top:10px;width:100%" onclick="openCarpoolModal('request','${ev.dbId||ev.id}')">+ Request a Ride</button>`:`<p style="font-size:12px;color:var(--text3);margin-top:8px"><a href="#" onclick="openModal()" style="color:var(--red)">Login</a> to request a ride</p>`}
            </div></div>
          </div>`:''}
          <div class="acc-item" id="acc-ph">
            <div class="acc-head" onclick="toggleAcc('ph')">${icon('M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z')} Event Photos ${icon('M19.5 8.25l-7.5 7.5-7.5-7.5')}</div>
            <div class="acc-body"><div class="acc-inner">Photos available to attendees only.</div></div>
          </div>
        </div>
      </div>
    </div>`;
}

function mrow(ic,label,val){return`<div class="mrow"><div class="mrow-icon">${ic}</div><div><div class="mrow-label">${label}</div><div class="mrow-val">${val}</div></div></div>`;}
function mrowSub(ic,label,val,sub){return`<div class="mrow"><div class="mrow-icon">${ic}</div><div><div class="mrow-label">${label}</div><div class="mrow-val">${val}</div><div class="mrow-sub">${sub}</div></div></div>`;}

async function doRSVP(eventId){
  if(!authUser){openModal();return;}
  const {error}=await sb.from('registrations').insert({event_id:eventId,user_id:authUser.id,status:'pending'});
  if(error?.code==='23505') toast("You're already registered!",'err');
  else if(error) toast(error.message,'err');
  else toast('Registration submitted!','ok');
}

function toggleAcc(id){g('acc-'+id)?.classList.toggle('open');}
function shareEv(){if(navigator.share)navigator.share({title:selEv?.title,url:location.href});else{navigator.clipboard?.writeText(location.href);toast('Link copied!','ok');}}

/* ── Carpool Modal ── */
let cpType='offer',cpEvId='';
function openCarpoolModal(type,evId){
  cpType=type;cpEvId=evId;
  const isOffer=type==='offer';
  const el=document.createElement('div');
  el.className='cp-overlay'; el.id='cp-overlay';
  el.innerHTML=`<div class="cp-modal">
    <div class="cp-head"><h3>${isOffer?'Offer a Ride':'Request a Ride'}</h3><button class="drawer-x" onclick="document.getElementById('cp-overlay').remove()">✕</button></div>
    <div class="cp-body">
      <div class="mfield"><label class="mlabel">${isOffer?'Departure':'Pickup'} Location <span style="color:var(--red)">*</span></label><input id="cp-loc" type="text" class="minput" placeholder="e.g. Yonge & Sheppard, Toronto"></div>
      ${isOffer?`<div class="mfield"><label class="mlabel">Available Seats <span style="color:var(--red)">*</span></label><input id="cp-seats" type="number" class="minput" placeholder="3" min="1" max="8"></div><div class="mfield"><label class="mlabel">Departure Time</label><input id="cp-time" type="datetime-local" class="minput"></div>`:''}
      <div class="mfield"><label class="mlabel">Notes (optional)</label><textarea id="cp-notes" class="minput" style="min-height:70px;resize:vertical" placeholder="Any extra info…"></textarea></div>
      <button class="btn-auth" onclick="submitCarpool()">Submit</button>
    </div>
  </div>`;
  el.onclick=e=>{if(e.target===el)el.remove();};
  document.body.appendChild(el);
}

async function submitCarpool(){
  const loc=v('cp-loc');if(!loc){toast('Enter a location.','err');return;}
  const isOffer=cpType==='offer';
  const payload={event_id:cpEvId,user_id:authUser.id,notes:v('cp-notes')};
  if(isOffer){
    payload.departure_location=loc;
    payload.seats_available=parseInt(g('cp-seats')?.value||1);
    const t=g('cp-time')?.value;if(t)payload.departure_time=new Date(t).toISOString();
    const {error}=await sb.from('carpool_offers').insert(payload);
    if(error){toast(error.message,'err');return;}
  } else {
    payload.pickup_location=loc;
    const {error}=await sb.from('carpool_requests').insert(payload);
    if(error){toast(error.message,'err');return;}
  }
  g('cp-overlay')?.remove();
  toast(`Carpool ${isOffer?'offer':'request'} submitted!`,'ok');
  renderDetail();
}

/* ════ ACCOUNT ═════════════════════════════════════════ */
async function renderAccount(){
  const name=profile?.full_name||authUser?.email?.split('@')[0]||'User';
  const initials=name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const {data:pData}=await sb.from('zee_points').select('amount').eq('user_id',authUser.id);
  const pts=(pData||[]).reduce((s,r)=>s+r.amount,0);
  const {data:tickets}=await sb.from('registrations').select('*,events(title,start_at,venue_name)').eq('user_id',authUser.id).order('created_at',{ascending:false});
  const {data:myEvs}=await sb.from('events').select('*').eq('created_by',authUser.id).order('created_at',{ascending:false});

  g('account-content').innerHTML=`
    <div class="acct-banner">
      <div class="acct-av">${initials}</div>
      <div class="acct-info"><h2>${name}</h2><p>${authUser.email}</p><p style="margin-top:3px;font-size:12px;color:#6B7280">Member since ${new Date(authUser.created_at).getFullYear()}</p></div>
      <div class="zee-box"><div class="n">${pts}</div><div class="l">ZeePoints</div></div>
    </div>
    <div class="acct-tabs">
      <div class="atab${acctTab==='tickets'?' on':''}" onclick="switchAcctTab('tickets')">My Tickets (${(tickets||[]).length})</div>
      <div class="atab${acctTab==='events'?' on':''}" onclick="switchAcctTab('events')">My Events (${(myEvs||[]).length})</div>
      <div class="atab${acctTab==='referrals'?' on':''}" onclick="switchAcctTab('referrals')">Points & Referrals</div>
    </div>
    <div class="apanel${acctTab==='tickets'?' on':''}" id="ap-tickets">
      ${(tickets||[]).length?(tickets||[]).map(r=>`<div class="tcard"><div class="tcard-img">📅</div><div class="tcard-body"><div class="tcard-title">${r.events?.title||'Event'}</div><div class="tcard-meta">${r.events?.start_at?new Date(r.events.start_at).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):''}<br>${r.events?.venue_name||''}</div></div><div class="tcard-side"><span class="status-pill ${r.status}">${r.status}</span></div></div>`).join(''):`<div class="empty">${icon('M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z',38)}<p>No tickets yet. <a href="#" onclick="go('home');return false" style="color:var(--red);font-weight:600">Browse events →</a></p></div>`}
    </div>
    <div class="apanel${acctTab==='events'?' on':''}" id="ap-events">
      <div style="margin-bottom:16px"><button class="btn-save" onclick="go('create')">+ Create New Event</button></div>
      ${(myEvs||[]).length?(myEvs||[]).map(e=>`<div class="tcard"><div class="tcard-img">📅</div><div class="tcard-body"><div class="tcard-title">${e.title}</div><div class="tcard-meta">${e.start_at?new Date(e.start_at).toLocaleDateString():''}<br><span style="font-size:11px;font-weight:700;text-transform:uppercase;color:${e.status==='published'?'var(--green)':'var(--text3)'}">${e.status}</span></div></div><div class="tcard-side"><button class="btn-view">Manage</button></div></div>`).join(''):`<div class="empty"><p>No events created yet.</p></div>`}
    </div>
    <div class="apanel${acctTab==='referrals'?' on':''}" id="ap-referrals">
      <div class="ref-card">
        <h4>🎁 ZeePoints</h4>
        <p>Earn points by attending events and referring friends. Redeem for prizes and discounts.</p>
        <div class="stats-grid">
          <div class="stat-box"><div class="stat-n">${pts}</div><div class="stat-l">Available</div></div>
          <div class="stat-box"><div class="stat-n" style="color:var(--red)">${pts}</div><div class="stat-l">Lifetime</div></div>
          <div class="stat-box"><div class="stat-n" style="color:var(--text3)">0</div><div class="stat-l">Redeemed</div></div>
        </div>
        <h4 style="margin-bottom:8px">🔗 Your Referral Link</h4>
        <p>Refer friends and earn 50 ZeePoints for each signup.</p>
        <div class="ref-link"><span id="ref-url">zeenle.com/ref/${profile?.referral_code||authUser.id.slice(0,8)}</span><button class="btn-copy" onclick="navigator.clipboard?.writeText(g('ref-url').textContent);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)">Copy</button></div>
      </div>
    </div>`;
}

function switchAcctTab(t){acctTab=t;renderAccount();}

/* ════ CREATE EVENT ════════════════════════════════════ */
function renderCreate(){
  g('create-content').innerHTML=`
    <h1 class="form-title">Create an Event</h1>
    <p class="form-sub">Fill in the details below to publish your event on Zeenle.</p>
    <div class="fsec">
      <div class="fsec-title">${icon('M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z')}Main Information</div>
      <div class="frow x1"><div class="ff"><label class="flabel">Event Poster <span style="font-size:11px;font-weight:400;color:var(--text3)">(image or video, max 10MB)</span></label><div class="upload-area" onclick="document.getElementById('f-poster').click()"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg><p>Click to upload your event poster</p><span>PNG, JPG, GIF, MP4 — max 10MB</span><input id="f-poster" type="file" style="display:none" accept="image/*,video/mp4" onchange="posterPicked(this)"></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Title <span class="req">*</span></label><input id="f-title" type="text" class="finput" placeholder="Event name"></div><div class="ff"><label class="flabel">Category</label><select id="f-cat" class="fselect"><option>Workshop</option><option>Festival</option><option>Screening</option><option>Retreat</option><option>Music</option><option>Art</option><option>Culture</option><option>Networking</option><option>Other</option></select></div></div>
      <div class="frow x1"><div class="ff"><label class="flabel">Description</label><textarea id="f-desc" class="ftextarea" placeholder="Tell attendees what this event is about…"></textarea></div></div>
      <div class="frow x3"><div class="ff"><label class="flabel">Start Date & Time <span class="req">*</span></label><input id="f-start" type="datetime-local" class="finput"></div><div class="ff"><label class="flabel">End Date & Time</label><input id="f-end" type="datetime-local" class="finput"></div><div class="ff"><label class="flabel">Doors Open</label><input id="f-doors" type="datetime-local" class="finput"></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Registration Method</label><div class="tgrp"><button class="tbtn on" onclick="fReg='RSVP';tgt(this)">RSVP</button><button class="tbtn" onclick="fReg='Ticketing';tgt(this)">Ticketing</button></div></div><div class="ff"><label class="flabel">Currency</label><div class="tgrp"><button class="tbtn on" onclick="fCurr='CAD';tgt(this)">CAD</button><button class="tbtn" onclick="fCurr='USD';tgt(this)">USD</button><button class="tbtn" onclick="fCurr='EUR';tgt(this)">EUR</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Price (0 = Free)</label><input id="f-price" type="number" class="finput" placeholder="0" min="0" step="0.01"></div><div class="ff"><label class="flabel">Max Tickets (0 = unlimited)</label><input id="f-max" type="number" class="finput" placeholder="0"></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Contact Email</label><input id="f-email" type="email" class="finput" placeholder="contact@example.com"></div><div class="ff"><label class="flabel">Speaker (optional)</label><input id="f-speaker" type="text" class="finput" placeholder="Speaker name"></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title">${icon('M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z')}Location</div>
      <div class="frow"><div class="ff"><label class="flabel">Mode</label><div class="tgrp"><button class="tbtn on" onclick="fMode='In Person';tgt(this)">In Person</button><button class="tbtn" onclick="fMode='Online';tgt(this)">Online</button><button class="tbtn" onclick="fMode='Hybrid';tgt(this)">Hybrid</button></div></div><div class="ff"><label class="flabel">Address Visible To</label><div class="tgrp"><button class="tbtn on" onclick="fAddrVis='All';tgt(this)">All</button><button class="tbtn" onclick="fAddrVis='Approved Tickets';tgt(this)">Approved</button><button class="tbtn" onclick="fAddrVis='Email Only';tgt(this)">Email Only</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Venue Name</label><input id="f-venue" type="text" class="finput" placeholder="e.g. Welcome Centre"></div><div class="ff"><label class="flabel">Street Address</label><input id="f-addr" type="text" class="finput" placeholder="123 Main St"></div></div>
      <div class="frow x3"><div class="ff"><label class="flabel">City</label><input id="f-city" type="text" class="finput" placeholder="Toronto"></div><div class="ff"><label class="flabel">Province</label><input id="f-prov" type="text" class="finput" placeholder="ON"></div><div class="ff"><label class="flabel">Postal Code</label><input id="f-postal" type="text" class="finput" placeholder="M1A 1A1"></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title">${icon('M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75')}Controls</div>
      <div class="frow"><div class="ff"><label class="flabel">Is Public</label><div class="tgrp"><button class="tbtn on" onclick="fPublic=true;tgt(this)">Yes</button><button class="tbtn" onclick="fPublic=false;tgt(this)">No</button></div></div><div class="ff"><label class="flabel">Needs Approval</label><div class="tgrp"><button class="tbtn" onclick="fApproval=true;tgt(this)">Yes</button><button class="tbtn on" onclick="fApproval=false;tgt(this)">No</button></div></div></div>
      <div class="frow"><div class="ff"><label class="flabel">Tickets at Door</label><div class="tgrp"><button class="tbtn on" onclick="fDoor=true;tgt(this)">Yes</button><button class="tbtn" onclick="fDoor=false;tgt(this)">No</button></div></div><div class="ff"><label class="flabel">Allow Carpool</label><div class="tgrp"><button class="tbtn on" onclick="fCarpool=true;tgt(this)">Yes</button><button class="tbtn" onclick="fCarpool=false;tgt(this)">No</button></div></div></div>
    </div>
    <div class="fsec">
      <div class="fsec-title">${icon('M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802')}Languages</div>
      <div class="lang-wrap">${['English','French','Spanish','Persian','Hindi','Arabic','Mandarin','Cantonese','Portuguese','German','Dutch','Italian','Russian','Ukrainian'].map(l=>`<button class="lchip${fLangs.includes(l)?' on':''}" onclick="toggleLang('${l}',this)">${l}</button>`).join('')}</div>
    </div>
    <div class="form-actions">
      <button class="btn-save" id="save-btn" onclick="submitEvent()">Save & Publish</button>
      <button class="btn-cancel-form" onclick="go('home')">Cancel</button>
    </div>`;
}

function tgt(btn){btn.closest('.tgrp').querySelectorAll('.tbtn').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
function toggleLang(l,btn){fLangs.includes(l)?(fLangs=fLangs.filter(x=>x!==l),btn.classList.remove('on')):(fLangs.push(l),btn.classList.add('on'));}
function posterPicked(inp){const f=inp.files[0];if(!f)return;const z=inp.closest('.upload-area');z.innerHTML=`<p style="color:var(--green);font-weight:600">✓ ${f.name}</p><span>Click to change</span>`;z.onclick=()=>document.getElementById('f-poster').click();}

async function submitEvent(){
  const title=v('f-title'),start=v('f-start');
  if(!title||!start){toast('Title and start date are required.','err');return;}
  const btn=g('save-btn'); setBtnLoad(btn,'Saving…');
  const {error}=await sb.from('events').insert({
    created_by:authUser.id,title,description:v('f-desc'),
    start_at:new Date(start).toISOString(),
    end_at:v('f-end')?new Date(v('f-end')).toISOString():null,
    doors_open_at:v('f-doors')?new Date(v('f-doors')).toISOString():null,
    registration_method:fReg,currency:fCurr,
    price:parseFloat(v('f-price')||0),max_tickets:parseInt(v('f-max')||0),
    mode:fMode,address_visible_to:fAddrVis,
    venue_name:v('f-venue'),address:v('f-addr'),
    city:v('f-city'),province:v('f-prov'),postal_code:v('f-postal'),
    contact_email:v('f-email'),speaker:v('f-speaker')||null,
    is_public:fPublic,needs_approval:fApproval,
    tickets_at_door:fDoor,allow_carpool:fCarpool,
    languages:fLangs,status:'published'
  });
  setBtnLoad(btn,'Save & Publish',false);
  if(error) toast(error.message,'err');
  else{toast('Event published!','ok');fLangs=[];await loadEvents();go('home');}
}

/* ════ MODAL / DRAWER / DROPDOWN ══════════════════════ */
function openModal(tab='login'){g('auth-modal').classList.add('open');switchTab(tab);}
function closeModal(){g('auth-modal').classList.remove('open');}
function switchTab(tab){
  document.querySelectorAll('.mtab').forEach(t=>t.classList.toggle('on',t.dataset.tab===tab));
  document.querySelectorAll('.mform').forEach(f=>f.classList.toggle('on',f.id==='mf-'+tab));
  document.querySelectorAll('.phone-step').forEach(s=>s.classList.toggle('on',tab==='phone'));
  if(tab==='phone')renderPhone();
}
function toggleDropdown(){g('nav-dd').classList.toggle('open');}
function closeDropdown(){g('nav-dd')?.classList.remove('open');}
function openDrawer(){g('overlay').classList.add('open');g('drawer').classList.add('open');}
function closeDrawer(){g('overlay').classList.remove('open');g('drawer').classList.remove('open');}

function toast(msg,type=''){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const el=document.createElement('div');
  el.className='toast'+(type?' '+type:'');el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.classList.add('show'),10);
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250);},3200);
}

/* ════ INIT ════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',async()=>{
  await bootAuth();
  updateLocBar();
  loadEvents();
  g('hamburger')?.addEventListener('click',openDrawer);
  g('overlay')?.addEventListener('click',closeDrawer);
  g('drawer-close-btn')?.addEventListener('click',closeDrawer);
  g('auth-modal')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});
  g('login-form')?.addEventListener('submit',doLogin);
  g('signup-form')?.addEventListener('submit',doSignup);
  document.addEventListener('click',e=>{if(!e.target.closest('.nav-user'))closeDropdown();});
});
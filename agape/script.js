/* Agape Dental Clinic — Specialty Edition (Painless Endodontics, Oral Surgery & Implants) */
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];

/* ── Intro curtain: smooth zoom-out then remove ── */
window.addEventListener('load', () => setTimeout(() => $('#intro')?.remove(), 2400));
setTimeout(() => $('#intro')?.remove(), 3900);

/* ── Floating pill header state + back-to-top ── */
const head = $('#siteHead'), toTop = $('#toTop');
addEventListener('scroll', () => {
  head.classList.toggle('scrolled', scrollY > innerHeight * .65);
  toTop.classList.toggle('show', scrollY > 700);
}, {passive:true});
toTop.addEventListener('click', () => scrollTo({top:0, behavior:'smooth'}));

/* ── Full-screen mobile menu ── */
const overlay = $('#menuOverlay');
$('#burger').addEventListener('click', () => overlay.classList.add('open'));
$('#menuClose').addEventListener('click', () => overlay.classList.remove('open'));
$$('#menuOverlay a').forEach(a => a.addEventListener('click', () => overlay.classList.remove('open')));

/* ── Hero parallax ── */
const heroImg = $('#heroImg');
addEventListener('scroll', () => {
  const y = scrollY;
  if (y < innerHeight && heroImg) heroImg.style.transform = `scale(${1 + y * .00024}) translateY(${y * .16}px)`;
}, {passive:true});

/* ── Scroll reveals + animated stat counters (with optional suffix) ── */
function runCounter(el){
  if (el.dataset.done) return;
  el.dataset.done = 1;
  const target = +el.dataset.count, suffix = el.dataset.suffix || '', t0 = performance.now(), dur = 1500;
  (function tick(t){
    const p = Math.min((t - t0) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN') + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('inview');
  $$('[data-count]', e.target).forEach(runCounter);
  if (e.target.matches('[data-count]')) runCounter(e.target);
  io.unobserve(e.target);
}), {threshold:.18});
$$('.mask-lines, .reveal, .reveal-scale, .reveal-group, .book, .specialists, .reviews, .gallery').forEach(el => io.observe(el));
$$('[data-count]').forEach(el => io.observe(el));

/* ── Smart Specialty Pre-Select into Booking Form ── */
const serviceSelect = $('#serviceSelect');
$$('[data-pick]').forEach(link => {
  link.addEventListener('click', () => {
    const val = link.dataset.pick;
    if (!serviceSelect || !val) return;
    const match = [...serviceSelect.options].find(o => o.textContent.trim() === val);
    if (match) serviceSelect.value = match.value;
    serviceSelect.style.outline = '3px solid #f4b631';
    setTimeout(() => { serviceSelect.style.outline = ''; }, 1600);
  });
});

/* ── Services marquee content ── */
$('#marqueeTrack').innerHTML = '<span>17 Clinical Treatments ✦ Painless Root Canal ✦ Oral Surgery ✦&nbsp;</span>'.repeat(2);

/* ── Services accordion: click + auto-cycle expansion ── */
const svcs = $$('[data-svc]');
let svcIdx = 0, svcTimer;
function openSvc(i){
  svcs.forEach((s, j) => s.classList.toggle('is-open', j === i));
  svcIdx = i;
}
function cycleSvc(){ svcTimer = setInterval(() => openSvc((svcIdx + 1) % svcs.length), 3600); }
svcs.forEach((s, i) => $('.svc-head', s).addEventListener('click', () => {
  clearInterval(svcTimer); openSvc(i); cycleSvc();
}));
const svcIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ cycleSvc(); svcIO.disconnect(); } }), {threshold:.28});
svcIO.observe($('#accordion'));
$('#seeAll').addEventListener('click', e => {
  const acc = $('#accordion'), all = acc.classList.toggle('all');
  e.target.textContent = all ? '✦ Collapse Treatments' : '✦ Expand All 6 Treatment Categories';
  if (all) clearInterval(svcTimer); else cycleSvc();
});

/* ── Smile gallery: tilted collage strip ── */
$('#galTrack').innerHTML = '<span>Healthy Smiles across Narayanapura ✦ Gentle Dentistry ✦&nbsp;</span>'.repeat(2);
const galImgs = ['hero-woman-agp.jpg','svc-rootcanal-agp.jpg','svc-surgery-agp.jpg','svc-braces-agp.jpg','help-kids-agp.jpg','help-teen-agp.jpg','help-adults-agp.jpg','consult-agp.jpg'];
$('#galStrip').innerHTML = [...galImgs, ...galImgs].map((s,i)=>`
  <figure class="gal-card" style="--tilt:${i%2? 3 : -3}deg"><img src="assets/${s}" alt="Clinical dental care at Agape Dental Clinic" loading="lazy"></figure>`).join('');

/* ── Clinical Disciplines Arch Carousel (fits 768x1376 portrait photos cleanly) ── */
const disciplines = [
  {img:'assets/doc-2-agp.jpg', role:'Painless Endodontics', desc:'Minimum-pain Root Canal & Crowns'},
  {img:'assets/doc-4-agp.jpg', role:'Oral & Wisdom Surgery', desc:'Maxillofacial & Surgical Extractions'},
  {img:'assets/doc-3-agp.jpg', role:'Implant Dentistry', desc:'Fixed Tooth Replacement'},
  {img:'assets/doc-5-agp.jpg', role:'Orthodontics', desc:'Braces for Teens & Adults'},
  {img:'assets/doc-1-agp.jpg', role:'Chief Dental Surgeon', desc:'Dr. Samuel Shedrach · 22 Yrs'},
  {img:'assets/doc-2-agp.jpg', role:'Pediatric & Family Care', desc:'Gentle Check-ups for All Ages'},
];
const spTrack = $('#spTrack');
spTrack.innerHTML = [...disciplines, ...disciplines].map(s => `
  <article class="sp-card"><div class="ring">
    <img src="${s.img}" alt="${s.role} at Agape Dental Clinic" loading="lazy"></div>
    <h4>${s.role}</h4><p>${s.desc}</p></article>`).join('');
let spX = 0, spPaused = false;
const spStep = () => spTrack.children[0].offsetWidth + parseFloat(getComputedStyle(spTrack).gap || 20);
(function spLoop(){
  if (!spPaused && spTrack.children.length){
    spX -= .55;
    if (Math.abs(spX) >= spStep() * disciplines.length) spX = 0;
    spTrack.style.transform = `translateX(${spX}px)`;
  }
  requestAnimationFrame(spLoop);
})();
spTrack.addEventListener('pointerenter', () => spPaused = true);
spTrack.addEventListener('pointerleave', () => spPaused = false);
$('#spNext').addEventListener('click', () => spX -= spStep());
$('#spPrev').addEventListener('click', () => spX += spStep());

/* ── Reviews carousel: tailored to Agape's real patient praise themes ── */
const reviews = [
  {chip:'Painless Root Canal', c:'c1', text:'Came in dreading root canal pain, and barely felt even the anaesthetic injection. Dr. Samuel Shedrach worked patiently, explained each step, and saved my molar comfortably.', who:'Narayanapura Patient Theme', svc:'Root Canal Treatment'},
  {chip:'Minimum-Pain Care', c:'c2', text:'What stands out most is how gentle and unhurried every visit feels. Even anxious family members relax quickly because the doctor never rushes procedures.', who:'Kothanur Patient Theme', svc:'Gentle Anaesthesia'},
  {chip:'Wisdom Tooth Surgery', c:'c3', text:'Had a painful wisdom tooth evaluated with X-rays and removed smoothly with clear post-care instructions and minimal swelling afterward.', who:'Narayanapura Patient Theme', svc:'Oral & Wisdom Surgery'},
  {chip:'Dental Implants', c:'c4', text:'Honest advice on replacing a missing tooth — every option and cost was explained clearly upfront, and the crown feels solid and natural.', who:'Bengaluru Patient Theme', svc:'Implant & Crown Care'},
  {chip:'Braces & Teens', c:'c2', text:'Steady, well-explained orthodontic progress for our teenager’s braces, with punctual appointments right here on K Narayanapura Road.', who:'Parent Feedback Theme', svc:'Orthodontics'},
  {chip:'22+ Yrs Family Trust', c:'c1', text:'Three generations of our family visit Dr. Samuel Shedrach — from our kids’ check-ups to crowns for elderly parents. Honest, dependable dentistry.', who:'Long-Term Family Theme', svc:'Family Dentistry'},
];
const rvTrack = $('#rvTrack'), rvDots = $('#rvDots');
rvTrack.innerHTML = reviews.map(r => `
  <article class="rv-card"><span class="chip ${r.c}">${r.chip}</span>
    <blockquote>“${r.text}”</blockquote>
    <div class="who"><span><b>${r.who}</b>${r.svc}</span><span class="stars">★★★★★</span></div></article>`).join('');
let rvI = 0;
const perView = () => innerWidth <= 600 ? 1 : innerWidth <= 900 ? 2 : 3;
const maxI = () => Math.max(0, reviews.length - perView());
function renderDots(){
  rvDots.innerHTML = '';
  for (let i = 0; i <= maxI(); i++){
    const d = document.createElement('button');
    d.type = 'button';
    d.className = i === rvI ? 'on' : '';
    d.setAttribute('aria-label', 'Go to feedback ' + (i + 1));
    d.addEventListener('click', () => { rvI = i; showRv(); resetRvTimer(); });
    rvDots.appendChild(d);
  }
}
function showRv(){
  rvI = Math.max(0, Math.min(rvI, maxI()));
  const card = rvTrack.children[0];
  if (!card) return;
  const w = card.offsetWidth + parseFloat(getComputedStyle(rvTrack).gap || 20);
  rvTrack.style.transform = `translateX(${-rvI * w}px)`;
  renderDots();
}
let rvTimer = setInterval(nextRv, 4400);
function nextRv(){ rvI = rvI >= maxI() ? 0 : rvI + 1; showRv(); }
function resetRvTimer(){ clearInterval(rvTimer); rvTimer = setInterval(nextRv, 4400); }
$('#rvNext').addEventListener('click', () => { nextRv(); resetRvTimer(); });
$('#rvPrev').addEventListener('click', () => { rvI = rvI <= 0 ? maxI() : rvI - 1; showRv(); resetRvTimer(); });
rvTrack.addEventListener('pointerenter', () => clearInterval(rvTimer));
rvTrack.addEventListener('pointerleave', resetRvTimer);
addEventListener('resize', showRv);
showRv();

/* ── Touch swipe: reviews & disciplines ── */
function addSwipe(el, onLeft, onRight){
  let x0=null;
  el.addEventListener('touchstart', e=>{ x0=e.touches[0].clientX; }, {passive:true});
  el.addEventListener('touchend', e=>{
    if(x0===null) return;
    const dx=e.changedTouches[0].clientX-x0;
    if(dx<-45) onLeft(); else if(dx>45) onRight();
    x0=null;
  }, {passive:true});
}
addSwipe(rvTrack, ()=>{ nextRv(); resetRvTimer(); }, ()=>{ rvI = rvI<=0? maxI(): rvI-1; showRv(); resetRvTimer(); });
addSwipe(spTrack, ()=>{ spX -= spStep(); }, ()=>{ spX += spStep(); });

/* ── Booking form → Google Maps listing (no publicly listed WhatsApp number) ── */
const MAPS_LINK = 'https://www.google.com/maps/place/Agape+Dental+Clinic/@13.062506,77.5732655,13z/data=!4m10!1m2!2m1!1sdentist!3m6!1s0x3bae19fe7ac22d51:0x780aa8d31bdf2aeb!8m2!3d13.0625009!4d77.6485187!15sCgdkZW50aXN0WgkiB2RlbnRpc3SSAQ1kZW50YWxfY2xpbmlj4AEA!16s%2Fg%2F1tq4pjtv?entry=ttu&g_ep=EgoyMDI2MTAxOS4wIKXMDSoASAFQAw%3D%3D';

let mode = 'Clinic Visit';
$$('.mode-toggle button').forEach(b => b.addEventListener('click', () => {
  $$('.mode-toggle button').forEach(x => x.classList.remove('is-on'));
  b.classList.add('is-on');
  mode = b.dataset.mode;
}));
const dateInput = $('input[name="date"]');
if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

$('#bookForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target), err = $('#formErr'), ok = $('#formOk');
  const name = (f.get('name') || '').toString().trim();
  const phone = (f.get('phone') || '').toString().replace(/\D/g, '');
  if (name.length < 2) return err.textContent = 'Please enter your full name.';
  if (!/^[6-9]\d{9}$/.test(phone.slice(-10))) return err.textContent = 'Please enter a valid 10-digit Indian mobile number.';
  if (!f.get('service')) return err.textContent = 'Please select a treatment or consultation type.';
  if (!f.get('date')) return err.textContent = 'Please select your preferred visit date.';
  err.textContent = '';
  const niceDate = new Date(f.get('date') + 'T00:00:00').toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
  const notes = (f.get('notes') || '').toString().trim();
  window.open(MAPS_LINK, '_blank', 'noopener');
  ok.hidden = false;
  ok.innerHTML = `✅ Thank you, <b>${name.split(' ')[0]}</b>! Your request for <b>${f.get('service')}</b> (${mode}) on <b>${niceDate}</b>${notes ? ' — <i>' + notes.replace(/[<>&]/g, '') + '</i>' : ''} is ready. We’ve opened <b>Agape Dental Clinic on Google Maps</b> — tap Call there to confirm your slot with <b>Dr. Samuel Shedrach</b>.<br><a class="wa-fallback" href="${MAPS_LINK}" target="_blank" rel="noopener">Open Agape Dental Clinic on Google Maps →</a>`;
  ok.scrollIntoView({behavior:'smooth', block:'center'});
  const btn = e.target.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;
  btn.innerHTML = 'Opening Google Maps…';
  setTimeout(() => { btn.innerHTML = orig; }, 2600);
});

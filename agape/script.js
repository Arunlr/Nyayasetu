/* Agape Dental Clinic — design system */
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];

/* ── Intro collage: zoom-out then remove ── */
window.addEventListener('load', () => setTimeout(() => $('#intro')?.remove(), 2500));
setTimeout(() => $('#intro')?.remove(), 4000); // safety

/* ── Header state + back-to-top ── */
const head = $('#siteHead'), toTop = $('#toTop');
addEventListener('scroll', () => {
  head.classList.toggle('scrolled', scrollY > innerHeight * .72);
  toTop.classList.toggle('show', scrollY > 700);
}, {passive:true});
toTop.addEventListener('click', () => scrollTo({top:0, behavior:'smooth'}));

/* ── Full-screen menu (circle clip reveal) ── */
const overlay = $('#menuOverlay');
$('#burger').addEventListener('click', () => overlay.classList.add('open'));
$('#menuClose').addEventListener('click', () => overlay.classList.remove('open'));
$$('#menuOverlay a').forEach(a => a.addEventListener('click', () => overlay.classList.remove('open')));

/* ── Hero parallax (slow zoom/drift like video) ── */
const heroImg = $('#heroImg');
addEventListener('scroll', () => {
  const y = scrollY;
  if (y < innerHeight) heroImg.style.transform = `scale(${1 + y * .00025}) translateY(${y * .18}px)`;
}, {passive:true});

/* ── Scroll reveals: masked lines, fades, staggers, circle-wipe footer, counters ── */
const counters = el => $$('[data-count]', el.parentElement || document).forEach(runCounter);
function runCounter(el){
  if (el.dataset.done) return; el.dataset.done = 1;
  const target = +el.dataset.count, t0 = performance.now(), dur = 1600;
  (function tick(t){ const p = Math.min((t - t0) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN');
    if (p < 1) requestAnimationFrame(tick); })(t0);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('inview');
  $$('[data-count]', e.target).forEach(runCounter);
  if (e.target.matches('[data-count]')) runCounter(e.target);
  io.unobserve(e.target);
}), {threshold:.22});
$$('.mask-lines, .reveal, .reveal-scale, .reveal-group, .book, .specialists, .reviews, .gallery').forEach(el => io.observe(el));
$$('[data-count]').forEach(el => io.observe(el));

/* ── Services marquee content ── */
$('#marqueeTrack').innerHTML = '<span>Our Services ✳ Our Services ✳ Our Services ✳&nbsp;</span>'.repeat(2);

/* ── Services accordion: click + auto-cycle expansion (video 8–12s) ── */
const svcs = $$('[data-svc]');
let svcIdx = 0, svcTimer;
function openSvc(i){
  svcs.forEach((s, j) => s.classList.toggle('is-open', j === i));
  svcIdx = i;
}
function cycleSvc(){ svcTimer = setInterval(() => openSvc((svcIdx + 1) % svcs.length), 3200); }
svcs.forEach((s, i) => $('.svc-head', s).addEventListener('click', () => {
  clearInterval(svcTimer); openSvc(i); cycleSvc();
}));
const svcIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ cycleSvc(); svcIO.disconnect(); } }), {threshold:.3});
svcIO.observe($('#accordion'));
$('#seeAll').addEventListener('click', e => {
  const acc = $('#accordion'), all = acc.classList.toggle('all');
  e.target.textContent = all ? '✳ Show Less' : '✳ See All Services';
  if (all) clearInterval(svcTimer); else cycleSvc();
});


/* ── Smile gallery: tilted collage strip (video outro) ── */
$('#galTrack').innerHTML = '<span>Happy Smiles ✳ Happy Smiles ✳ Happy Smiles ✳&nbsp;</span>'.repeat(2);
const galImgs = ['hero-woman-agp.jpg','svc-kids-agp.jpg','svc-braces-agp.jpg','help-kids-agp.jpg','help-teen-agp.jpg','svc-cleaning-agp.jpg','help-adults-agp.jpg','consult-agp.jpg'];
$('#galStrip').innerHTML = [...galImgs, ...galImgs].map((s,i)=>`
  <figure class="gal-card" style="--tilt:${i%2? 3.5 : -3.5}deg"><img src="assets/${s}" alt="Happy patient smile" loading="lazy"></figure>`).join('');

/* ── Specialists: infinite auto carousel + arrows (video 13–19s) ── */
const specialists = [
  {img:'assets/doc-1-agp.jpg', role:'Chief Dental Surgeon', bg:'#ffc9a3', desc:'Dr. Samuel Shedrach — Painless Root Canal'},
  {img:'assets/doc-2-agp.jpg', role:'Implantology',     bg:'#d9d0ff', desc:'Dental Implants & Crowns'},
  {img:'assets/doc-3-agp.jpg', role:'Orthodontics',    bg:'#ffe98a', desc:'Braces for Teens & Adults'},
  {img:'assets/doc-4-agp.jpg', role:'Oral Surgery',    bg:'#ffc9d9', desc:'Oral & Maxillofacial / Wisdom Tooth'},
  {img:'assets/doc-5-agp.jpg', role:'Family Dentistry', bg:'#c4ecff', desc:'Kids & Complete Family Care'},
  {img:'assets/doc-2-agp.jpg', role:'Pediatric Dentistry', bg:'#ffe98a', desc:'Fear-Free Kids Dentistry'},
  {img:'assets/doc-3-agp.jpg', role:'Cosmetic Dentistry',  bg:'#d9d0ff', desc:'Smile Care & Whitening'},
  {img:'assets/doc-1-agp.jpg', role:'General Dentistry',    bg:'#ffc9a3', desc:'Check-ups, Cleaning & X-Ray'},
];
const spTrack = $('#spTrack');
spTrack.innerHTML = [...specialists, ...specialists].map(s => `
  <article class="sp-card"><div class="ring" style="background:${s.bg}">
    <img src="${s.img}" alt="${s.role} specialist"></div>
    <h3>${s.role}</h3><p>${s.desc}</p></article>`).join('');
let spX = 0, spPaused = false;
const spStep = () => spTrack.children[0].offsetWidth + parseFloat(getComputedStyle(spTrack).gap);
(function spLoop(){
  if (!spPaused){
    spX -= .65;
    if (Math.abs(spX) >= spStep() * specialists.length) spX = 0;
    spTrack.style.transform = `translateX(${spX}px)`;
  }
  requestAnimationFrame(spLoop);
})();
spTrack.addEventListener('pointerenter', () => spPaused = true);
spTrack.addEventListener('pointerleave', () => spPaused = false);
$('#spNext').addEventListener('click', () => spX -= spStep());
$('#spPrev').addEventListener('click', () => spX += spStep());

/* ── Reviews carousel: slide + auto-advance + dots (video 23.5–27.5s) ── */
const reviews = [
  {chip:'Dentistry',    c:'c1', text:'I was nervous about getting a root canal, but the doctor was very gentle and made sure I was comfortable throughout. I would definitely recommend this clinic to anyone.', who:'Agape Patient', svc:'Root Canal'},
  {chip:'Orthodontics', c:'c2', text:'My daughter got her braces here. Every visit was explained clearly, appointments ran on time, and her smile has changed so much already. Very happy with the care.', who:'Agape Patient', svc:'Clear Braces'},
  {chip:'Implants',     c:'c3', text:'Got an implant after losing a tooth. The treatment plan and cost were explained upfront — no surprises. It feels completely natural now.', who:'Agape Patient', svc:'Dental Implant'},
  {chip:'Kids Care',    c:'c4', text:'My 6-year-old used to fear dentists. The team here made it fun and fear-free. Now she actually looks forward to her check-ups!', who:'Agape Parent', svc:'Kids Dentistry'},
  {chip:'Whitening',    c:'c1', text:'Booked teeth whitening before my wedding. One session and the difference was amazing. Gentle, professional and honest about results.', who:'Agape Patient', svc:'Smile Designing'},
  {chip:'Family Care',  c:'c2', text:'Our whole family visits Agape. Clean clinic, transparent pricing and doctors who never rush you. A rare find in Bengaluru.', who:'Agape Patient', svc:'Wisdom Tooth Surgery'},
];
const rvTrack = $('#rvTrack'), rvDots = $('#rvDots');
rvTrack.innerHTML = reviews.map(r => `
  <article class="rv-card"><span class="chip ${r.c}">${r.chip}</span>
    <blockquote>“${r.text}”</blockquote>
    <div class="who"><span><b>${r.who}</b>${r.svc}</span><span class="stars">★★★★★</span></div></article>`).join('');
let rvI = 0;
const perView = () => innerWidth <= 600 ? 1 : innerWidth <= 900 ? 2 : 3;
const maxI = () => reviews.length - perView();
function renderDots(){
  rvDots.innerHTML = '';
  for (let i = 0; i <= maxI(); i++){
    const d = document.createElement('button');
    d.className = i === rvI ? 'on' : ''; d.setAttribute('aria-label', 'Go to review ' + (i + 1));
    d.addEventListener('click', () => { rvI = i; showRv(); resetRvTimer(); });
    rvDots.appendChild(d);
  }
}
function showRv(){
  rvI = Math.max(0, Math.min(rvI, maxI()));
  const card = rvTrack.children[0];
  const w = card.offsetWidth + parseFloat(getComputedStyle(rvTrack).gap);
  rvTrack.style.transform = `translateX(${-rvI * w}px)`;
  renderDots();
}
let rvTimer = setInterval(nextRv, 4200);
function nextRv(){ rvI = rvI >= maxI() ? 0 : rvI + 1; showRv(); }
function resetRvTimer(){ clearInterval(rvTimer); rvTimer = setInterval(nextRv, 4200); }
$('#rvNext').addEventListener('click', () => { nextRv(); resetRvTimer(); });
$('#rvPrev').addEventListener('click', () => { rvI = rvI <= 0 ? maxI() : rvI - 1; showRv(); resetRvTimer(); });
rvTrack.addEventListener('pointerenter', () => clearInterval(rvTimer));
rvTrack.addEventListener('pointerleave', resetRvTimer);
addEventListener('resize', showRv);
showRv();


/* ── Touch swipe: reviews & specialists ── */
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

/* ── Booking form → Google Maps (no public WhatsApp number found — route via Maps listing) ── */
const MAPS_LINK = 'https://www.google.com/maps/place/Agape+Dental+Clinic/@13.062506,77.5732655,13z/data=!4m10!1m2!2m1!1sdentist!3m6!1s0x3bae19fe7ac22d51:0x780aa8d31bdf2aeb!8m2!3d13.0625009!4d77.6485187!15sCgdkZW50aXN0WgkiB2RlbnRpc3SSAQ1kZW50YWxfY2xpbmlj4AEA!16s%2Fg%2F1tq4pjtv?entry=ttu&g_ep=EgoyMDI2MTAxOS4wIKXMDSoASAFQAw%3D%3D';

let mode = 'In-person';
$$('.mode-toggle button').forEach(b => b.addEventListener('click', () => {
  $$('.mode-toggle button').forEach(x => x.classList.remove('is-on'));
  b.classList.add('is-on'); mode = b.dataset.mode;
}));
const dateInput = $('input[name="date"]');
dateInput.min = new Date().toISOString().split('T')[0];
$('#bookForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target), err = $('#formErr'), ok = $('#formOk');
  const name = (f.get('name') || '').toString().trim();
  const phone = (f.get('phone') || '').toString().replace(/\D/g, '');
  if (name.length < 2) return err.textContent = 'Please enter your name.';
  if (!/^[6-9]\d{9}$/.test(phone.slice(-10))) return err.textContent = 'Please enter a valid 10-digit Indian mobile number.';
  if (!f.get('service')) return err.textContent = 'Please select a service.';
  if (!f.get('date')) return err.textContent = 'Please pick a preferred date.';
  err.textContent = '';
  const niceDate = new Date(f.get('date') + 'T00:00:00').toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
  const notes = (f.get('notes') || '').toString().trim();
  const msg =
`🦷 *New Appointment Request*
— Agape Dental Clinic, Narayanapura (Website)

👤 *Name:* ${name}
📞 *Phone:* +91 ${phone.slice(-10)}
🛎️ *Service:* ${f.get('service')}
📅 *Preferred Date:* ${niceDate}
🏥 *Mode:* ${mode}` + (notes ? `\n📝 *Notes:* ${notes}` : '') + `\n\nPlease confirm my appointment slot. Thank you!`;
  const url = MAPS_LINK;
  window.open(url, '_blank', 'noopener'); // opens the clinic's Google Maps listing to call / get directions
  ok.hidden = false;
  ok.innerHTML = `✅ Thank you, ${name.split(' ')[0]}! Your visit request for <b>${f.get('service')}</b> on <b>${niceDate}</b> is noted. We have opened our <b>Google Maps listing</b> — please call the clinic from there to confirm your slot with Dr. Samuel Shedrach.<br><a class="wa-fallback" href="${url}" target="_blank" rel="noopener">Open Agape Dental Clinic on Google Maps →</a>`;
  ok.scrollIntoView({behavior:'smooth', block:'center'});
  const btn = e.target.querySelector('button[type="submit"]');
  btn.innerHTML = 'Opening Google Maps…';
  setTimeout(() => btn.innerHTML = 'Book Appointment', 2500);
});

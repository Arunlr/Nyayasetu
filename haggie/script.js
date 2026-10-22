/* Dr Haggie Dental care — Boutique Women-Led Calm Studio Edition */
const $  = (s, c=document) => c.querySelector(s);
const $$ = (s, c=document) => [...c.querySelectorAll(s)];

const DENTIST_WHATSAPP = '919900436512'; // Verified Google Maps phone: +91 99004 36512

/* ── Intro curtain ── */
window.addEventListener('load', () => setTimeout(() => $('#intro')?.remove(), 2400));
setTimeout(() => $('#intro')?.remove(), 3900);

/* ── Header state + back-to-top ── */
const topWrap = $('#topWrap'), toTop = $('#toTop');
addEventListener('scroll', () => {
  topWrap.classList.toggle('scrolled', scrollY > innerHeight * .62);
  toTop.classList.toggle('show', scrollY > 700);
}, {passive:true});
toTop.addEventListener('click', () => scrollTo({top:0, behavior:'smooth'}));

/* ── Mobile menu ── */
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

/* ── Scroll reveals + animated stat counters ── */
function runCounter(el){
  if (el.dataset.done) return;
  el.dataset.done = 1;
  if (el.dataset.decimal){
    el.textContent = el.dataset.decimal + (el.dataset.suffix || '');
    return;
  }
  const target = +el.dataset.count, suffix = el.dataset.suffix || '', dur = 1500;
  let t0 = null;
  requestAnimationFrame(function tick(t){
    if (t0 === null) t0 = t;
    const p = Math.max(0, Math.min((t - t0) / dur, 1));
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN') + suffix;
    if (p < 1) requestAnimationFrame(tick);
  });
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('inview');
  $$('[data-count], [data-decimal]', e.target).forEach(runCounter);
  if (e.target.matches('[data-count], [data-decimal]')) runCounter(e.target);
  io.unobserve(e.target);
}), {threshold:.18});
$$('.mask-lines, .reveal, .reveal-scale, .reveal-group, .reviews, .gallery').forEach(el => io.observe(el));
$$('[data-count], [data-decimal]').forEach(el => io.observe(el));

/* ── Interactive 2-Column Visual Treatment Studio + Mobile Accordion Fallback ── */
const treatments = [
  {
    no: '01',
    name: 'Scaling, Polishing & Gum Health',
    tag: 'Preventive & Gums',
    pick: 'Scaling, Polishing & Gum Care',
    img: 'assets/svc-scaling-hge.jpg',
    desc: 'Gentle ultrasonic stain & tartar removal, smooth enamel polishing, and gum care — leaving your teeth clean, healthy, and thoroughly checked with zero rush.'
  },
  {
    no: '02',
    name: 'Painless Root Canal & Crowns',
    tag: 'Tooth Saving · RCT',
    pick: 'Painless Root Canal & Crowns',
    img: 'assets/svc-rootcanal-hge.jpg',
    desc: 'Comfort-first root canal therapy explained clearly step by step before starting — relieving deep tooth pain gently and restoring natural strength with custom crowns.'
  },
  {
    no: '03',
    name: 'Wisdom Tooth & Gentle Extractions',
    tag: 'Surgical Care',
    pick: 'Wisdom Tooth Extraction',
    img: 'assets/svc-wisdom-hge.jpg',
    desc: 'Careful X-ray assessment, calm anaesthesia, smooth wisdom-tooth removal, and personal post-procedure follow-up from Dr. Haggie for a comfortable recovery.'
  },
  {
    no: '04',
    name: 'Aesthetic Fillings & Smile Care',
    tag: 'Cosmetic & Restorative',
    pick: 'Aesthetic Fillings & Smile Care',
    img: 'assets/svc-smile-hge.jpg',
    desc: 'Natural tooth-shaded fillings, crowns, bridges, and conservative smile enhancements crafted cleanly to match your natural smile.'
  },
  {
    no: '05',
    name: 'Braces & Orthodontic Alignment',
    tag: 'Teens & Adults',
    pick: 'Braces & Clear Aligners',
    img: 'assets/svc-ortho-hge.jpg',
    desc: 'Modern orthodontic braces and alignment solutions for teenagers and adults, guided patiently at every visit with transparent progress updates.'
  },
  {
    no: '06',
    name: 'Gentle Kids & Family Dentistry',
    tag: 'All Ages',
    pick: 'Kids & Family Check-Up',
    img: 'assets/svc-kids-hge.jpg',
    desc: 'Warm, reassuring dental check-ups for children, parents, and elders alike — helping anxious young patients feel right at home in the chair.'
  }
];

const svcList = $('#svcList');
const stageImg = $('#stageImg'), stageBadge = $('#stageBadge'), stageTitle = $('#stageTitle'), stageDesc = $('#stageDesc'), stageCta = $('#stageCta');

function prefillService(val){
  const sel = $('#serviceSelect');
  if (!sel || !val) return;
  const opt = [...sel.options].find(o => o.textContent.trim() === val);
  if (opt) sel.value = opt.value;
  sel.style.outline = '3px solid #ff8668';
  setTimeout(() => { sel.style.outline = ''; }, 1600);
}

svcList.innerHTML = treatments.map((t, idx) => `
  <div class="svc-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
    <button type="button" class="svc-tab ${idx === 0 ? 'active' : ''}">
      <span class="tab-no">${t.no}</span>
      <span class="tab-title">${t.name}</span>
      <span class="tab-pill">${t.tag}</span>
    </button>
    <div class="svc-mobile-panel">
      <img src="${t.img}" alt="${t.name}" loading="lazy">
      <p>${t.desc}</p>
      <a class="btn btn-plum" href="#book" data-pick="${t.pick}">Book on WhatsApp →</a>
    </div>
  </div>
`).join('');

let activeIdx = 0, studioTimer;
function selectTreatment(i){
  activeIdx = i;
  const t = treatments[i];
  $$('.svc-item', svcList).forEach((el, j) => {
    el.classList.toggle('active', j === i);
    $('.svc-tab', el).classList.toggle('active', j === i);
  });
  stageImg.style.opacity = '.35';
  setTimeout(() => {
    stageImg.src = t.img;
    stageImg.alt = t.name;
    stageBadge.textContent = t.tag;
    stageTitle.textContent = t.name;
    stageDesc.textContent = t.desc;
    stageCta.dataset.pick = t.pick;
    stageCta.textContent = `Book ${t.name.split('&')[0].trim()} on WhatsApp →`;
    stageImg.style.opacity = '1';
  }, 140);
}
$$('.svc-item', svcList).forEach((el, i) => {
  $('.svc-tab', el).addEventListener('click', () => {
    clearInterval(studioTimer);
    selectTreatment(i);
  });
});
const studioIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  studioTimer = setInterval(() => {
    if (innerWidth > 860) selectTreatment((activeIdx + 1) % treatments.length);
  }, 4200);
  studioIO.disconnect();
}), {threshold:.25});
studioIO.observe(svcList);

document.addEventListener('click', e => {
  const pickEl = e.target.closest('[data-pick]');
  if (pickEl) prefillService(pickEl.dataset.pick);
});

/* ── Verified Google Review Highlights & Real Patient Praise ── */
const reviews = [
  {chip:'Google Highlight', text:'The doctor explains everything clearly, and treats patients patiently.', who:'Google Maps Review Summary', svc:'Clear Explanations · 5.0★'},
  {chip:'Calm Atmosphere', text:'From the moment you walk in, the atmosphere feels welcoming and calm.', who:'Google Maps Review Summary', svc:'Welcoming Studio · 5.0★'},
  {chip:'Spotless Clinic', text:'Excellent service, clean facility and cheerful staff.', who:'Google Maps Review Summary', svc:'Clean & Neat Facility · 5.0★'},
  {chip:'Patient Comfort', text:'I’ve had a really good experience with Haggie Dental Clinic. The doctor is amazing and definitely one of the best in the area. She is very professional, patient, and explains everything properly, which makes you feel comfortable throughout…', who:'Kirsten Phanbuh · Google Review', svc:'5-Star Google Review'},
  {chip:'Personal Follow-Up', text:'Doc haggie is very patient and understands your problem clearly and gives proper solution. The clinic is clean, neat and tidy and she ensures the patient is comfortable and she will follow up on the condition.', who:'Umesh M · Google Review', svc:'5-Star Google Review'},
  {chip:'Trusted Clinic', text:'Finding a dental clinic one can truly trust isn’t always easy, but this one…', who:'Favoureenia Nongbri · Google Review', svc:'5-Star Google Review'}
];
const rvTrack = $('#rvTrack'), rvDots = $('#rvDots');
rvTrack.innerHTML = reviews.map(r => `
  <article class="rv-card"><span class="chip">${r.chip}</span>
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
    d.setAttribute('aria-label', 'Go to review ' + (i + 1));
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
let rvTimer = setInterval(nextRv, 4500);
function nextRv(){ rvI = rvI >= maxI() ? 0 : rvI + 1; showRv(); }
function resetRvTimer(){ clearInterval(rvTimer); rvTimer = setInterval(nextRv, 4500); }
$('#rvNext').addEventListener('click', () => { nextRv(); resetRvTimer(); });
$('#rvPrev').addEventListener('click', () => { rvI = rvI <= 0 ? maxI() : rvI - 1; showRv(); resetRvTimer(); });
rvTrack.addEventListener('pointerenter', () => clearInterval(rvTimer));
rvTrack.addEventListener('pointerleave', resetRvTimer);
addEventListener('resize', showRv);
showRv();

/* Touch swipe on reviews */
let rx0 = null;
rvTrack.addEventListener('touchstart', e => { rx0 = e.touches[0].clientX; }, {passive:true});
rvTrack.addEventListener('touchend', e => {
  if (rx0 === null) return;
  const dx = e.changedTouches[0].clientX - rx0;
  if (dx < -45){ nextRv(); resetRvTimer(); }
  else if (dx > 45){ rvI = rvI <= 0 ? maxI() : rvI - 1; showRv(); resetRvTimer(); }
  rx0 = null;
}, {passive:true});

/* ── Studio & Smile Gallery Filmstrip ── */
$('#galTrack').innerHTML = '<span>5.0★ Calm Dental Studio ✦ Kothanur, Bengaluru ✦ Gentle Smiles ✦&nbsp;</span>'.repeat(2);
const galImgs = ['hero-woman-hge.jpg','consult-hge.jpg','svc-scaling-hge.jpg','svc-rootcanal-hge.jpg','svc-wisdom-hge.jpg','svc-smile-hge.jpg','svc-ortho-hge.jpg','svc-kids-hge.jpg'];
$('#galStrip').innerHTML = [...galImgs, ...galImgs].map((s,i)=>`
  <figure class="gal-card" style="--tilt:${i%2? 2.8 : -2.8}deg"><img src="assets/${s}" alt="Gentle dental care at Dr Haggie Dental care Kothanur" loading="lazy"></figure>`).join('');

/* ── Instant WhatsApp Appointment Booking (+91 99004 36512) ── */
let mode = 'In-Clinic Visit';
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
  if (!/^[6-9]\d{9}$/.test(phone.slice(-10))) return err.textContent = 'Please enter a valid 10-digit mobile number.';
  if (!f.get('service')) return err.textContent = 'Please choose a treatment.';
  if (!f.get('date')) return err.textContent = 'Please pick your preferred date.';
  err.textContent = '';

  const niceDate = new Date(f.get('date') + 'T00:00:00').toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
  const notes = (f.get('notes') || '').toString().trim();
  const msg =
`🦷 *New Appointment Request*
— Dr Haggie Dental care, Kothanur (Website)

👤 *Patient Name:* ${name}
📞 *Mobile:* +91 ${phone.slice(-10)}
✨ *Treatment:* ${f.get('service')}
📅 *Preferred Date:* ${niceDate}
🏥 *Visit Type:* ${mode}` + (notes ? `\n📝 *Notes:* ${notes}` : '') + `\n\nHello Dr. Haggie, please confirm an available slot for my visit. Thank you!`;

  const waUrl = `https://wa.me/${DENTIST_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank', 'noopener');
  ok.hidden = false;
  ok.innerHTML = `✅ Thank you, <b>${name.split(' ')[0]}</b>! Your WhatsApp booking message for <b>${f.get('service')}</b> on <b>${niceDate}</b> has been prepared for <b>Dr Haggie Dental care (+91 99004 36512)</b>.<br><a class="wa-fallback" href="${waUrl}" target="_blank" rel="noopener">Tap here if WhatsApp didn’t open automatically →</a>`;
  ok.scrollIntoView({behavior:'smooth', block:'center'});
  const btn = e.target.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;
  btn.innerHTML = 'Opening WhatsApp…';
  setTimeout(() => { btn.innerHTML = orig; }, 2600);
});

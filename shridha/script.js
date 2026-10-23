/* ==========================================================================
   SHRIDHA DENTAL CLINIC — Complete Reference-Video Animation & UX Engine
   ========================================================================== */

(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const WA_NUMBER = '918904027171';
  const CLINIC_EMAIL = 'shridhadental@gmail.com';

  /* ── 1. Opening Intro Collage Zoom-Out Removal ── */
  window.addEventListener('load', () => setTimeout(() => $('#intro')?.remove(), 2400));
  setTimeout(() => $('#intro')?.remove(), 3900);

  /* ── 2. Seamless HD Google Sites Image Upgrade (/api/gimg) with Local Fallback ── */
  function upgradeClinicPhotos(root = document) {
    if (window.location.protocol === 'file:') return;
    $$('img[data-gimg]', root).forEach((img) => {
      const key = img.getAttribute('data-gimg');
      const width = img.getAttribute('data-gw') || '1100';
      const localFallback = img.getAttribute('src');
      const hdSrc = `/api/gimg?k=${encodeURIComponent(key)}&w=${encodeURIComponent(width)}&v=2`;

      const probe = new Image();
      probe.onload = () => {
        if (probe.naturalWidth > 0) img.src = hdSrc;
      };
      probe.onerror = () => {
        img.src = localFallback;
      };
      probe.src = hdSrc;
    });
  }
  upgradeClinicPhotos();

  /* ── 3. Live IST (Asia/Kolkata) Clinic Open / Closed Status ── */
  function updateLiveHours() {
    try {
      const nowIST = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      );
      const day = nowIST.getDay();
      const mins = nowIST.getHours() * 60 + nowIST.getMinutes();
      const isOpen = day === 0 ? mins >= 600 && mins < 780 : mins >= 600 && mins < 1200;

      const dot = $('#liveClinicDot');
      const label = $('#liveClinicStatus');
      const pill = $('#hoursLivePill');

      if (dot) dot.classList.toggle('is-closed', !isOpen);
      if (label) {
        label.textContent = isOpen
          ? day === 0
            ? 'Open Now · Sunday Hours till 1:00 PM'
            : 'Open Now · Today 10:00 AM – 8:00 PM'
          : 'Mon–Sat 10 AM – 8 PM · Sun 10 AM – 1 PM';
      }
      if (pill) {
        pill.textContent = isOpen ? 'Open Now (IST)' : 'Opens 10:00 AM IST';
        pill.classList.toggle('is-closed', !isOpen);
      }

      $$('.hours-row[data-days]').forEach((row) => {
        const days = row.getAttribute('data-days').split(',').map(Number);
        row.classList.toggle('is-today', days.includes(day));
      });
    } catch (_e) {
      /* Graceful fallback */
    }
  }
  updateLiveHours();

  /* ── 4. Header State, Scroll Progress Hairline, Back-to-Top & Hero Parallax ── */
  const siteHeader = $('#siteHeader');
  const toTop = $('#toTop');
  const heroImg = $('#heroImg');
  const progressBar = $('#scrollProgress');

  function onScroll() {
    const y = window.scrollY || 0;
    if (siteHeader) siteHeader.classList.toggle('is-scrolled', y > window.innerHeight * 0.55);
    if (toTop) toTop.classList.toggle('show', y > 680);
    if (heroImg && y < window.innerHeight * 1.1) {
      heroImg.style.transform = `scale(${1 + y * 0.00024}) translateY(${y * 0.16}px)`;
    }
    if (progressBar) {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressBar.style.width = Math.min(100, Math.max(0, (y / maxScroll) * 100)).toFixed(1) + '%';
    }
    sweepVisibleTargets();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── 5. Circular Clip-Path Full-Screen Menu Overlay ── */
  const menuOverlay = $('#menuOverlay');
  const menuToggle = $('#menuToggle');
  const menuClose = $('#menuClose');

  function setMenuOpen(open) {
    if (!menuOverlay) return;
    menuOverlay.classList.toggle('open', open);
    menuOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  menuToggle?.addEventListener('click', () => setMenuOpen(!menuOverlay.classList.contains('open')));
  menuClose?.addEventListener('click', () => setMenuOpen(false));
  $$('#menuOverlay a').forEach((a) => a.addEventListener('click', () => setMenuOpen(false)));

  /* ── 6. Scroll Reveals: Masked Lines, Staggers, Counters & Circle-Wipe Book Band ── */
  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const suffix = el.dataset.suffix || '';

    if (el.dataset.decimal) {
      const targetDec = parseFloat(el.dataset.decimal);
      const dur = 1200;
      const start = Date.now();
      const safety = setTimeout(() => { el.textContent = targetDec.toFixed(1) + suffix; }, dur + 120);
      (function tickDec() {
        const p = Math.min(1, Math.max(0.15, (Date.now() - start) / dur));
        el.textContent = (targetDec * (1 - Math.pow(1 - p, 3))).toFixed(1) + suffix;
        if (p < 1) requestAnimationFrame(tickDec);
        else { clearTimeout(safety); el.textContent = targetDec.toFixed(1) + suffix; }
      })();
      return;
    }

    const target = parseInt(el.dataset.count || '0', 10);
    const dur = 1400;
    const start = Date.now();
    const safety = setTimeout(() => { el.textContent = target.toLocaleString('en-IN') + suffix; }, dur + 120);
    (function tick() {
      const p = Math.min(1, Math.max(0.12, (Date.now() - start) / dur));
      const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = val.toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else { clearTimeout(safety); el.textContent = target.toLocaleString('en-IN') + suffix; }
    })();
  }

  const animTargets = $$(
    '.mask-lines, .reveal, .reveal-scale, .reveal-group, .book-band'
  );

  function activateTarget(el) {
    if (el.classList.contains('inview')) return;
    el.classList.add('inview');
    $$('[data-count], [data-decimal]', el).forEach(runCounter);
    if (el.matches('[data-count], [data-decimal]')) runCounter(el);
  }

  function sweepVisibleTargets() {
    const triggerBottom = window.innerHeight * 0.92;
    animTargets.forEach((el) => {
      if (el.classList.contains('inview')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < triggerBottom && rect.bottom > 0) {
        activateTarget(el);
      }
    });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          activateTarget(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    animTargets.forEach((el) => io.observe(el));
  } else {
    animTargets.forEach(activateTarget);
  }

  requestAnimationFrame(onScroll);
  window.addEventListener('load', onScroll);

  /* ── 7. Service Filter Pills + Smooth Pre-Fill Booking Selection ── */
  const serviceSelect = $('#serviceSelect');

  function prefillService(val) {
    if (!serviceSelect || !val) return;
    const match = [...serviceSelect.options].find((o) => o.value === val || o.textContent.trim() === val);
    if (match) serviceSelect.value = match.value;
    serviceSelect.style.outline = '3px solid #7C3F34';
    setTimeout(() => { serviceSelect.style.outline = ''; }, 1700);
  }

  document.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) prefillService(pick.getAttribute('data-pick'));
  });

  $$('.filter-chip[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter');
      $$('.filter-chip[data-filter]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      $$('#servicesGrid .service-card').forEach((card) => {
        card.hidden = !(cat === 'all' || card.getAttribute('data-cat') === cat);
      });
    });
  });

  /* ── 8. Continuous 60fps Infinite Specialty Rings Carousel (#spTrack) ── */
  const specialties = [
    { img: 'assets/srv-oral-medicine-shr.jpg', role: 'Oral Medicine & TMJ', bg: '#F6D9CC', desc: 'Lesions, Screening & Jaw Pain' },
    { img: 'assets/srv-decay-rct-shr.jpg', role: 'Micro-Endodontics', bg: '#E3D9F8', desc: 'Painless Root Canal & Fillings' },
    { img: 'assets/srv-implants-crowns-shr.jpg', role: 'Implantology & Crowns', bg: '#F7E7B5', desc: 'Implants, Bridges & Caps' },
    { img: 'assets/srv-laser-gum-shr.jpg', role: 'Laser Periodontics', bg: '#CEEBE5', desc: 'Laser Gum Care & Cleaning' },
    { img: 'assets/srv-aligners-braces-shr.jpg', role: 'Clear Aligners', bg: '#F7D4DE', desc: 'Braces & Invisible Aligners' },
    { img: 'assets/srv-whitening-esthetics-shr.jpg', role: 'Smile Esthetics', bg: '#F5E5C8', desc: 'Teeth Whitening & Bonding' },
    { img: 'assets/srv-oral-surgery-shr.jpg', role: 'Oral Surgery', bg: '#D6E7F8', desc: 'Wisdom Tooth & Extractions' },
    { img: 'assets/srv-kids-dental-shr.jpg', role: 'Pediatric Dentistry', bg: '#FBE0C2', desc: 'Sealants & Fear-Free Kids Care' }
  ];

  const spTrack = $('#spTrack');
  if (spTrack) {
    spTrack.innerHTML = [...specialties, ...specialties]
      .map(
        (s) => `
      <article class="sp-card">
        <div class="ring" style="background:${s.bg}">
          <img src="${s.img}" alt="${s.role} at Shridha Dental Clinic" loading="lazy" />
        </div>
        <h3>${s.role}</h3>
        <p>${s.desc}</p>
      </article>`
      )
      .join('');

    let spX = 0;
    let spPaused = false;
    const spStep = () => {
      const first = spTrack.children[0];
      if (!first) return 200;
      return first.offsetWidth + (parseFloat(getComputedStyle(spTrack).gap) || 24);
    };

    (function spLoop() {
      if (!spPaused) {
        spX -= 0.65;
        if (Math.abs(spX) >= spStep() * specialties.length) spX = 0;
        spTrack.style.transform = `translateX(${spX}px)`;
      }
      requestAnimationFrame(spLoop);
    })();

    spTrack.addEventListener('pointerenter', () => { spPaused = true; });
    spTrack.addEventListener('pointerleave', () => { spPaused = false; });
    $('#spNext')?.addEventListener('click', () => { spX -= spStep(); });
    $('#spPrev')?.addEventListener('click', () => { spX = Math.min(0, spX + spStep()); });

    addSwipe(spTrack, () => { spX -= spStep(); }, () => { spX = Math.min(0, spX + spStep()); });
  }

  /* ── 9. Infinite Tilted Polaroid Filmstrip Collage (#galStrip) ── */
  const galTrack = $('#galTrack');
  if (galTrack) {
    galTrack.innerHTML =
      '<span>Inside Shridha Dental Clinic ✦ K. Narayanapura, Bengaluru ✦ 5.0★ Rated Care ✦&nbsp;</span>'.repeat(2);
  }

  const filmPhotos = [
    { src: 'assets/hero-woman-shr.jpg', cap: 'Healthy Smiles at Shridha Dental Clinic' },
    { src: 'assets/gs-home-7.jpg', gimg: 'home-7', cap: 'Shridha Dental Clinic — Centre for Comprehensive Oral Health' },
    { src: 'assets/srv-decay-rct-shr.jpg', cap: 'Painless Root Canal & Composite Restorations' },
    { src: 'assets/gs-gallery-8.jpg', gimg: 'gallery-8', cap: 'Primary Sunlit Dental Operatory' },
    { src: 'assets/srv-oral-medicine-shr.jpg', cap: 'Specialist Oral Medicine & TMJ Consultation' },
    { src: 'assets/gs-home-6.jpg', gimg: 'home-6', cap: 'Warm Reception & Patient Lounge' },
    { src: 'assets/srv-implants-crowns-shr.jpg', cap: 'Dental Implants, Crowns & Bridges' },
    { src: 'assets/clinic-exterior-shr.jpg', cap: 'Kanasu Complex Storefront — LBS Nagar, K. Narayanapura' },
    { src: 'assets/srv-laser-gum-shr.jpg', cap: 'Laser Gum Therapy & Ultrasonic Cleaning' },
    { src: 'assets/gs-services-14.jpg', gimg: 'services-14', cap: 'Ergonomic Dental Chair & LED Illumination' },
    { src: 'assets/srv-aligners-braces-shr.jpg', cap: 'Clear Aligners & Orthodontics' },
    { src: 'assets/srv-kids-dental-shr.jpg', cap: 'Fear-Free Kids & Preventive Dentistry' }
  ];

  const galStrip = $('#galStrip');
  if (galStrip) {
    galStrip.innerHTML = [...filmPhotos, ...filmPhotos]
      .map(
        (p, i) => `
      <figure class="gal-card" style="--tilt:${i % 2 ? 3.2 : -3.2}deg" data-lightbox-src="${p.src}" ${
          p.gimg ? `data-lightbox-gimg="${p.gimg}"` : ''
        } data-lightbox-caption="${p.cap}">
        <img src="${p.src}" ${p.gimg ? `data-gimg="${p.gimg}" data-gw="700"` : ''} alt="${p.cap}" loading="lazy" />
      </figure>`
      )
      .join('');
    upgradeClinicPhotos(galStrip);
  }

  /* ── 10. Auto-Sliding 5.0 ★ Reviews Carousel + Expanding Pill Dots + Swipe ── */
  const reviews = [
    {
      chip: 'Hygiene & Enamel Care',
      text: 'Amazing! Thanks Dr Veena and Dr Sudheendra for my check ups/treatment and for your knowledge and tips on dental hygiene and enamel care. Beautiful clinic, love the interiors, clean spaces & clean equipments. Quick, easy and seen on time!',
      who: 'Akshata V.',
      svc: 'Verified Patient Testimonial · 5.0 ★'
    },
    {
      chip: 'Clear Explanations',
      text: 'Went for a cap fixation that had come off. Dr. Sudhindra and Dr Veena are extremely professional and educative — nobody explains what’s going on with your teeth better than them.',
      who: 'Sayed Zakriya',
      svc: 'Google Review · 5.0 ★'
    },
    {
      chip: 'Painless Experience',
      text: 'Dentist visit is usually a painful experience, but this one was otherwise — thank you Dr. Veena for making me smile.',
      who: 'Nikhil Kunder',
      svc: 'Verified Patient Testimonial · 5.0 ★'
    },
    {
      chip: 'Family-Friendly Care',
      text: 'Quality, convenience, and affordability come together here. Truly a family-friendly dental practice that caters to patients of all ages.',
      who: 'Raghavendra U S',
      svc: 'Google Local Guide · 5.0 ★'
    },
    {
      chip: 'Spotless Ambience',
      text: 'Great hygiene, professional doctors & comforting ambience.',
      who: 'Vijay N.',
      svc: 'Verified Patient Testimonial · 5.0 ★'
    },
    {
      chip: 'Highly Recommended',
      text: 'Visit this clinic for any dental problems. Highly recommended. Best practice.',
      who: 'Austin Richard S',
      svc: 'Google Review · 5.0 ★'
    }
  ];

  const rvTrack = $('#rvTrack');
  const rvDots = $('#rvDots');
  let rvI = 0;
  let rvTimer = null;

  const perView = () => (window.innerWidth <= 600 ? 1 : window.innerWidth <= 860 ? 2 : 3);
  const maxRvI = () => Math.max(0, reviews.length - perView());

  function renderRvDots() {
    if (!rvDots) return;
    rvDots.innerHTML = '';
    for (let i = 0; i <= maxRvI(); i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = i === rvI ? 'on' : '';
      btn.setAttribute('aria-label', 'Go to review slide ' + (i + 1));
      btn.addEventListener('click', () => {
        rvI = i;
        showRv();
        resetRvTimer();
      });
      rvDots.appendChild(btn);
    }
  }

  function showRv() {
    if (!rvTrack || !rvTrack.children[0]) return;
    rvI = Math.max(0, Math.min(rvI, maxRvI()));
    const cardW = rvTrack.children[0].offsetWidth + (parseFloat(getComputedStyle(rvTrack).gap) || 20);
    rvTrack.style.transform = `translateX(${-rvI * cardW}px)`;
    renderRvDots();
  }

  function nextRv() {
    rvI = rvI >= maxRvI() ? 0 : rvI + 1;
    showRv();
  }

  function resetRvTimer() {
    clearInterval(rvTimer);
    rvTimer = setInterval(nextRv, 4300);
  }

  if (rvTrack) {
    rvTrack.innerHTML = reviews
      .map(
        (r) => `
      <article class="rv-card">
        <span class="rv-chip">${r.chip}</span>
        <blockquote>“${r.text}”</blockquote>
        <div class="rv-who">
          <span><b>${r.who}</b><span>${r.svc}</span></span>
          <span class="rv-stars" aria-hidden="true">★★★★★</span>
        </div>
      </article>`
      )
      .join('');

    showRv();
    resetRvTimer();
    $('#rvNext')?.addEventListener('click', () => { nextRv(); resetRvTimer(); });
    $('#rvPrev')?.addEventListener('click', () => { rvI = rvI <= 0 ? maxRvI() : rvI - 1; showRv(); resetRvTimer(); });
    rvTrack.addEventListener('pointerenter', () => clearInterval(rvTimer));
    rvTrack.addEventListener('pointerleave', resetRvTimer);
    window.addEventListener('resize', showRv, { passive: true });
    addSwipe(
      rvTrack,
      () => { nextRv(); resetRvTimer(); },
      () => { rvI = rvI <= 0 ? maxRvI() : rvI - 1; showRv(); resetRvTimer(); }
    );
  }

  function addSwipe(el, onLeft, onRight) {
    let x0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (dx < -45) onLeft();
      else if (dx > 45) onRight();
      x0 = null;
    }, { passive: true });
  }

  /* ── 11. WhatsApp + Email Booking Form ── */
  let selectedSlot = 'Morning (10:00 AM – 1:00 PM)';
  $$('.mode-toggle button').forEach((b) => {
    b.addEventListener('click', () => {
      $$('.mode-toggle button').forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
      selectedSlot = b.getAttribute('data-slot') || selectedSlot;
    });
  });

  const dateInput = $('input[name="date"]');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  const bookForm = $('#bookForm');
  const formErr = $('#formErr');
  const formOk = $('#formOk');

  function validateAndBuild() {
    const f = new FormData(bookForm);
    const name = String(f.get('name') || '').trim();
    const digits = String(f.get('phone') || '').replace(/\D/g, '');
    const service = String(f.get('service') || '').trim();
    const rawDate = String(f.get('date') || '').trim();
    const notes = String(f.get('notes') || '').trim();

    if (name.length < 2) {
      formErr.textContent = 'Please enter your full name.';
      return null;
    }
    if (!/^[6-9]\d{9}$/.test(digits.slice(-10))) {
      formErr.textContent = 'Please enter a valid 10-digit Indian mobile number.';
      return null;
    }
    if (!rawDate) {
      formErr.textContent = 'Please select your preferred visit date.';
      return null;
    }
    formErr.textContent = '';

    const niceDate = new Date(rawDate + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const msg =
      `🦷 *New Appointment Request*\n` +
      `— Shridha Dental Clinic, K. Narayanapura\n\n` +
      `👤 *Patient Name:* ${name}\n` +
      `📞 *Mobile:* +91 ${digits.slice(-10)}\n` +
      `✨ *Service:* ${service}\n` +
      `📅 *Preferred Date:* ${niceDate}\n` +
      `🕒 *Preferred Slot:* ${selectedSlot}` +
      (notes ? `\n📝 *Notes:* ${notes}` : '') +
      `\n\nHello Dr. Veena & Dr. Sudhindra, please confirm an available slot for my visit. Thank you!`;

    return { name, service, niceDate, msg };
  }

  bookForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = validateAndBuild();
    if (!data) return;

    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(data.msg)}`;
    window.open(waUrl, '_blank', 'noopener');
    if (formOk) {
      formOk.hidden = false;
      formOk.innerHTML =
        `✅ Thank you, <b>${data.name.split(' ')[0]}</b>! Your WhatsApp booking message for <b>${data.service}</b> on <b>${data.niceDate}</b> is ready for <b>Shridha Dental Clinic (+91 89040 27171)</b>.<br>` +
        `<a class="wa-fallback" href="${waUrl}" target="_blank" rel="noopener">Tap here if WhatsApp didn’t open automatically →</a>`;
      formOk.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  $('#sendEmailBtn')?.addEventListener('click', () => {
    const data = validateAndBuild();
    if (!data) return;
    const subject = `Appointment Request — ${data.name} (${data.service})`;
    window.location.href = `mailto:${CLINIC_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(data.msg)}`;
  });

  /* ── 12. Lightbox Viewer (Bento + Polaroid Filmstrip) ── */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCaption = $('#lightboxCaption');

  function openLightbox(trigger) {
    if (!lightbox || !lightboxImg) return;
    const localSrc = trigger.getAttribute('data-lightbox-src');
    const gimgKey = trigger.getAttribute('data-lightbox-gimg');
    const caption = trigger.getAttribute('data-lightbox-caption') || '';

    lightboxImg.onerror = () => {
      lightboxImg.onerror = null;
      lightboxImg.src = localSrc;
    };
    lightboxImg.src =
      gimgKey && window.location.protocol !== 'file:'
        ? `/api/gimg?k=${encodeURIComponent(gimgKey)}&w=1400&v=2`
        : localSrc;
    lightboxImg.alt = caption;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e) => {
    const item = e.target.closest('[data-lightbox-src]');
    if (item) openLightbox(item);
  });

  $('#lightboxClose')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      setMenuOpen(false);
    }
  });
})();

/* ==========================================================================
   SHRIDHA DENTAL CLINIC — Interactive UI, HD Clinic Image Upgrade & Booking
   ========================================================================== */

(function () {
  'use strict';

  const WA_NUMBER = '918904027171';
  const CLINIC_EMAIL = 'shridhadental@gmail.com';

  /* -----------------------------------------------------------------------
     1. Seamless HD Google Sites Image Upgrade (/api/gimg) with Local Fallback
     ----------------------------------------------------------------------- */
  function upgradeClinicPhotos() {
    if (window.location.protocol === 'file:') return;
    document.querySelectorAll('img[data-gimg]').forEach((img) => {
      const key = img.getAttribute('data-gimg');
      const width = img.getAttribute('data-gw') || '1200';
      const localFallback = img.getAttribute('src');
      const hdSrc = `/api/gimg?k=${encodeURIComponent(key)}&w=${encodeURIComponent(width)}&v=2`;

      const probe = new Image();
      probe.onload = () => {
        if (probe.naturalWidth > 0) {
          img.src = hdSrc;
        }
      };
      probe.onerror = () => {
        img.src = localFallback;
      };
      probe.src = hdSrc;
    });
  }

  upgradeClinicPhotos();

  /* -----------------------------------------------------------------------
     2. Live IST (Asia/Kolkata) Clinic Open / Closed Status
        Mon–Sat: 10:00 AM – 8:00 PM | Sun: 10:00 AM – 1:00 PM
     ----------------------------------------------------------------------- */
  function updateLiveHours() {
    try {
      const nowIST = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      );
      const day = nowIST.getDay(); // 0 = Sun, 1..6 = Mon..Sat
      const mins = nowIST.getHours() * 60 + nowIST.getMinutes();

      let isOpen = false;
      let statusText = '';

      if (day === 0) {
        isOpen = mins >= 600 && mins < 780; // 10:00 - 13:00
        statusText = isOpen
          ? 'Open Now in Bengaluru · Sunday Hours till 1:00 PM'
          : 'Open Mon–Sat 10:00 AM – 8:00 PM · Sun 10:00 AM – 1:00 PM';
      } else {
        isOpen = mins >= 600 && mins < 1200; // 10:00 - 20:00
        statusText = isOpen
          ? 'Open Now in K. Narayanapura · Today 10:00 AM – 8:00 PM'
          : 'Opens at 10:00 AM IST · Mon–Sat 10 AM – 8 PM · Sun 10 AM – 1 PM';
      }

      const dot = document.getElementById('liveClinicDot');
      const label = document.getElementById('liveClinicStatus');
      const pill = document.getElementById('hoursLivePill');

      if (dot) dot.classList.toggle('is-closed', !isOpen);
      if (label) label.textContent = statusText;
      if (pill) {
        pill.textContent = isOpen ? 'Open Now (IST)' : 'Closed · Opens 10 AM';
        pill.classList.toggle('is-closed', !isOpen);
      }

      document.querySelectorAll('.hours-row[data-days]').forEach((row) => {
        const days = row.getAttribute('data-days').split(',').map(Number);
        row.classList.toggle('is-today', days.includes(day));
      });
    } catch (_e) {
      /* Graceful fallback to static text */
    }
  }

  updateLiveHours();

  /* -----------------------------------------------------------------------
     3. Header Scroll Elevation & Progress Hairline
     ----------------------------------------------------------------------- */
  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('scrollProgress');

  function onScroll() {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('is-scrolled', y > 18);
    if (progressBar) {
      const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(100, Math.max(0, (y / total) * 100));
      progressBar.style.width = pct.toFixed(1) + '%';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -----------------------------------------------------------------------
     4. Scroll Reveal + Safe Clamped Counter Animation
     ----------------------------------------------------------------------- */
  function runCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const target = parseFloat(el.dataset.counter || '0');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const finalStr = decimals > 0 ? target.toFixed(decimals) : String(target);

    if (
      document.visibilityState === 'hidden' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      el.textContent = finalStr;
      return;
    }

    const dur = 850;
    const startMs = Date.now();
    const safetyTimer = setTimeout(() => {
      el.textContent = finalStr;
    }, dur + 120);

    function tick() {
      const p = Math.min(1, Math.max(0.15, (Date.now() - startMs) / dur));
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        clearTimeout(safetyTimer);
        el.textContent = finalStr;
      }
    }

    requestAnimationFrame(tick);
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            entry.target.querySelectorAll('[data-counter]').forEach(runCounter);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.02, rootMargin: '0px 0px 80px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));

    // Guarantee nothing ever stays hidden in iframes, fast scrolls, or tall viewports
    setTimeout(() => {
      document.documentElement.classList.remove('js-reveal');
      revealEls.forEach((el) => {
        el.classList.add('is-visible');
        el.querySelectorAll('[data-counter]').forEach(runCounter);
      });
    }, 1200);
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    document.querySelectorAll('[data-counter]').forEach(runCounter);
  }

  /* -----------------------------------------------------------------------
     5. Clinical Department Filter Tabs
     ----------------------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-chip[data-filter]');
  const serviceCards = document.querySelectorAll('.service-card[data-cat]');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter');
      filterBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      serviceCards.forEach((card) => {
        const match = cat === 'all' || card.getAttribute('data-cat') === cat;
        card.hidden = !match;
      });
    });
  });

  /* -----------------------------------------------------------------------
     6. Mobile Navigation Drawer
     ----------------------------------------------------------------------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');

  function setNavOpen(open) {
    if (!mobileNavDrawer) return;
    mobileNavDrawer.hidden = !open;
    if (menuToggle) menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => setNavOpen(mobileNavDrawer.hidden));
  }

  document.querySelectorAll('[data-close-nav]').forEach((el) => {
    el.addEventListener('click', () => setNavOpen(false));
  });

  /* -----------------------------------------------------------------------
     7. Appointment Modal (WhatsApp + Direct Email)
     ----------------------------------------------------------------------- */
  const bookModal = document.getElementById('bookModal');
  const bookForm = document.getElementById('bookForm');
  const serviceSelect = document.getElementById('bookServiceSelect');
  const sendEmailBtn = document.getElementById('sendEmailBtn');

  function openBookModal(preselectedService) {
    setNavOpen(false);
    if (!bookModal) return;
    if (preselectedService && serviceSelect) {
      let matched = false;
      Array.from(serviceSelect.options).forEach((opt) => {
        if (opt.value === preselectedService) {
          serviceSelect.value = preselectedService;
          matched = true;
        }
      });
      if (!matched) {
        const customOpt = new Option(preselectedService, preselectedService, true, true);
        serviceSelect.add(customOpt);
      }
    }
    bookModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeBookModal() {
    if (!bookModal) return;
    bookModal.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-book]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openBookModal(btn.getAttribute('data-open-book'));
    });
  });

  document.querySelectorAll('[data-close-book]').forEach((btn) => {
    btn.addEventListener('click', closeBookModal);
  });

  if (bookModal) {
    bookModal.addEventListener('click', (e) => {
      if (e.target === bookModal) closeBookModal();
    });
  }

  function buildBookingMessage() {
    const fd = new FormData(bookForm);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const slot = String(fd.get('slot') || '').trim();
    const service = String(fd.get('service') || '').trim();
    const notes = String(fd.get('notes') || '').trim();

    const lines = [
      'Hello Shridha Dental Clinic, I would like to book an appointment:',
      `• Name: ${name}`,
      `• Phone: ${phone}`,
      `• Department: ${service}`,
      `• Preferred Time: ${slot}`
    ];
    if (notes) lines.push(`• Notes: ${notes}`);
    return { name, service, body: lines.join('\n') };
  }

  if (bookForm) {
    bookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const { body } = buildBookingMessage();
      window.open(
        `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(body)}`,
        '_blank',
        'noopener'
      );
      closeBookModal();
    });
  }

  if (sendEmailBtn && bookForm) {
    sendEmailBtn.addEventListener('click', () => {
      if (!bookForm.reportValidity()) return;
      const { name, service, body } = buildBookingMessage();
      const subject = `Appointment Request — ${name} (${service})`;
      window.location.href = `mailto:${CLINIC_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      closeBookModal();
    });
  }

  /* -----------------------------------------------------------------------
     8. Photo Lightbox Viewer
     ----------------------------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

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

  document.querySelectorAll('[data-lightbox-src]').forEach((item) => {
    item.addEventListener('click', () => openLightbox(item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(item);
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookModal();
      closeLightbox();
      setNavOpen(false);
    }
  });

  /* -----------------------------------------------------------------------
     9. Mobile Reviews Carousel Controls (Scroll-Snap + Prev/Next Buttons)
     ----------------------------------------------------------------------- */
  const reviewsTrack = document.querySelector('.reviews-grid');
  const revPrevBtn = document.getElementById('revPrevBtn');
  const revNextBtn = document.getElementById('revNextBtn');

  function scrollReviews(dir) {
    if (!reviewsTrack) return;
    const step = Math.round(reviewsTrack.clientWidth * 0.86);
    reviewsTrack.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  if (revPrevBtn) revPrevBtn.addEventListener('click', () => scrollReviews(-1));
  if (revNextBtn) revNextBtn.addEventListener('click', () => scrollReviews(1));
})();

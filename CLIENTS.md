# Client Registry — Dental Demo Sites

Golden rules for EVERY client (never mix clients up):
1. One folder per client (e.g. `/dentimax/`), fully self-contained (own HTML/CSS/JS/assets).
2. Brand-new AI-generated images for every client — NEVER reuse another client's photos. Unique `-xxx` suffixed filenames per client.
3. Hero section background: a woman's bright smile / teeth close-up.
4. Real details only, sourced from the client's Google Maps / Justdial / socials — never invent phone numbers, doctors, ratings, hours or reviews.
5. If the clinic has social media, link it with the ORIGINAL app brand icons (official WhatsApp / Instagram SVG glyphs, stored locally).
6. Every client gets a NEW separate Vercel project + NEW URL. Previous clients' projects/URLs are NEVER modified or redeployed.
7. Mobile-friendly is mandatory: responsive breakpoints, sticky mobile booking bar, ≥44px tap targets, hero image object-position tuned so the smile stays in frame on portrait screens, no horizontal scroll, no blank gaps.
8. After deploying, verify production is READY/PROMOTED and fetch the live URL before reporting done.

| # | Client | Folder | Vercel project | Live URL | WhatsApp | Status |
|---|--------|--------|----------------|----------|----------|--------|
| 1 | Tooth Care Speciality & Family Dental Clinic (Horamavu) | `/` (root) | tooth-care-speciality-family-dental (`prj_2WIyZa6h109WeKrXl5ERFSAuvUIb`) | https://tooth-care-speciality-family-dental.vercel.app | +91 96117 63346 | Live |
| 2 | Dentimax Dental Clinic (Kothanur) | `/dentimax/` | dentimax-dental-clinic (`prj_XWmAJPk9S0KwsSJdjr2QciE0cFpv`) | https://dentimax-dental-clinic.vercel.app | +91 96065 68169 | Live — all images unique (`*-dmx.jpg`) |

| 3 | Agape Dental Clinic (Narayanapura, Bengaluru — Dr. Samuel Shedrach) | `/agape/` | agape-dental-clinic (`prj_FmbsVdxZ5fdEc2b3aOXM0FNnI3jT`) | https://agape-dental-clinic.vercel.app | Not publicly listed — bookings via Google Maps (ask clinic) | Live — all images unique (`*-agp.jpg`), 4.8★/136 ratings, 11 AM–5 PM daily (Practo) |

New-client checklist: research Maps/Justdial/socials → create folder copy → customise branding/facts → generate full unique image set → original social icons → mobile QA → new Vercel project → deploy to production only for that project → verify live → add row above.

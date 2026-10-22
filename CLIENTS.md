# Client Registry — Dental Demo Sites

Golden rules for EVERY client (never mix clients up):
1. **One folder per client** (e.g. `/dentimax/`, `/agape/`), fully self-contained (own HTML/CSS/JS/assets).
2. **Brand-new AI-generated images for every client** — NEVER reuse another client's photos. Unique `-xxx` suffixed filenames per client, photorealistic, high-resolution, watermark-free, no fake text/logos/name badges baked into photos (always inspect every generated image with `read_file`).
3. **Hero section background**: always a woman's bright smile / healthy teeth close-up, framed clearly on both desktop and mobile portrait screens (`object-position` tuned per photo).
4. **Real details only**, sourced from the client's Google Maps / Justdial / Practo / official socials — never invent phone numbers, doctors, ratings, hours, or patient quotes.
5. **Original brand icons for socials**: if (and only if) real social accounts exist, link them with official SVG brand glyphs stored locally.
6. **Separate deployment per client**: every new client gets a NEW Vercel project + NEW live URL. Previous clients' projects/URLs are NEVER modified or redeployed unless the user explicitly asks.
7. **Mobile-friendly is mandatory**: responsive breakpoints, sticky mobile quick-action bar, ≥44px tap targets, `16px` form inputs on mobile, swipe support on carousels, zero horizontal scroll, zero awkward blank gaps.
8. **Verify live deployment**: after deploying, confirm production deployment is `READY`/`PROMOTED` and fetch the live URL before reporting done.
9. **Mandatory post-build Maps-verification audit (every client, before reporting done)**:
   - Cross-check clinic name, exact street address + PIN, exact map pin coordinates across all Maps / Directions / iframe links, named doctor(s), rating + count, hours (flag conflicting directory timings honestly rather than stating one guess as fact), phone/WhatsApp, and services.
   - Verify live URL serves the new images & stylesheet, grep to confirm zero leakage from any other client's name/number/address/assets, verify every referenced image file exists on disk, and verify `node --check` passes on JS.
10. **SPECIALTY-FIRST DESIGN & ANTI-CLONE VARIATION RULE (MANDATORY FOR EVERY CLIENT)**:
    - **Design around each clinic's real core specialties**: identify what patients actually praise/visit that specific clinic for (from Maps reviews, doctor credentials, Practo/Justdial specialties) and make the **Hero headline, Hero trust card/pills, Stats ledger, Dedicated Specialty Spotlight section, Service ordering, Lead Doctor spotlight, Review themes, and Booking options** lead directly with that specialty — NEVER reuse generic `"Gentle Dental Care"` copy across sites.
    - **Never produce identical clones** (especially important when pitching clinics near each other in Bengaluru!): every new build MUST vary at least **6 visual & layout axes** from previous sites while keeping smooth scroll animations, parallax, interactive carousels, and mobile sticky UX:
      1. **Color Palette** harmonized with that client's hero photo & clinical specialty (never reuse the exact same primary/surface/accent combo back-to-back).
      2. **Typography Pairing** (distinct Google Font display + body pairing matching clinic personality).
      3. **Header Chrome** (e.g., full-bleed transparent bar vs floating pill island navbar vs top utility strip + clean bar).
      4. **Hero Layout & Composition** (e.g., split editorial headline + glass doctor card vs centered/bottom display typography vs asymmetric badge framing).
      5. **Signature Specialty Section** custom-built for that clinic's #1 strength (e.g., 3-pillar Endodontics/Surgery bento, Implant step-by-step timeline, Smile/Aligner transformation showcase, Kid-First comfort promise).
      6. **Card Geometry & Section Dividers** (e.g., `3:4` arch-top doctor portraits vs square frames vs circular rings; curved scoop vs rounded sheet overlap vs clean architectural bands; distinct review card accents & booking layout).

## Specialty Design Matrix (Reference Blueprint for New Builds)

| Specialty Focus | Palette Direction | Font Pairing | Signature Section Idea | Used On |
|---|---|---|---|---|
| **Family & Multi-Specialty Care** | Warm Espresso Terracotta (`#8a3418`) + Soft Lavender (`#b3a2f5`) + Electric Lime (`#dfea2e`) on Cream (`#fff6e6`) | `Archivo` + `Archivo Expanded` | Full-family accordion + pastel ring specialist carousel + lime circle-wipe footer | #1 Tooth Care, #2 Dentimax |
| **Painless Endodontics (RCT) & Oral Surgery** | Deep Surgical Forest-Teal (`#0d3b38`) + Soft Sage (`#dcebe7`) + Warm Marigold Gold (`#f4b631`) on Alabaster (`#faf7f1`) | `Fraunces` (editorial serif) + `Plus Jakarta Sans` | 3-Pillar Clinical Specialty Bento + Lead Doctor Spotlight + `3:4` Arch Discipline Cards | #3 Agape Dental Clinic |
| **Women-Led Calm & Painless Care (Clear Explanations)** | Deep Mulberry-Plum (`#3c1630`) + Soft Blush (`#f9ebf0`) + Warm Coral (`#ff8668`) on Warm Ivory (`#fffdfb`) | `Cormorant Garamond` (editorial serif) + `DM Sans` | 4-Step Calm Care Experience + Interactive 2-Column Visual Treatment Studio + Women-Owned Founder Showcase + Google Praise Topic Cloud | #4 Dr Haggie Dental care |
| **Implants & Maxillofacial Surgery** *(ready for future client)* | Deep Midnight Navy (`#0f2342`) + Ice Slate (`#e6eef8`) + Warm Coral/Amber (`#ff6b4a` / `#f59e0b`) on Crisp Pearl (`#f8fafc`) | `Sora` + `DM Sans` | 4-Step Implant & Surgical Precision Protocol + CBCT/X-Ray Planning Callout | Available |
| **Cosmetic Dentistry, Veneers & Smile Design** *(ready for future client)* | Rich Espresso-Bronzed Cocoa (`#2f1d1b`) + Champagne Silk (`#f6ece3`) + Burnished Gold (`#d49b57`) on Porcelain (`#fcfaf7`) | `Playfair Display` + `Outfit` | Smile Makeover Pillars + Veneer/Whitening Aesthetic Showcase | Used variant on #5 Shridha Dental Clinic |
| **Oral Medicine, Diagnostics & Multi-Specialty Family Care** | Warm Backlit Cove Alabaster (`#FAF6F2`) + Dusty Rose-Taupe (`#8B574B` / `#E9DAD0`) + Deep Walnut Espresso (`#231814`) + Backlit Brass (`#B8833A`) + Clinical Teal (`#1D5C54`) | `Playfair Display` + `Outfit` | Top IST Live Utility Bar + Backlit Cove Hero w/ Operatory Inset + Real 3-Photo Clinic Mosaic + 8-Department Photo Cards w/ Filter + Dual-Doctor Atelier + Lightbox Bento | #5 Shridha Dental Clinic |
| **Orthodontics, Braces & Clear Aligners** *(ready for future client)* | Deep Cobalt-Indigo (`#1b2454`) + Cool Mint-Sky (`#e2f4f1`) + Electric Mint/Lime (`#2ee59d`) on Snow (`#f7f9fc`) | `Space Grotesk` + `Inter` | Teen & Adult Aligner/Braces Journey + Bite Correction Breakdown | Available |
| **Pediatric & Gentle Kids/Family Dentistry** *(ready for future client)* | Warm Woodland Olive-Teal (`#1f473e`) + Sunlit Peach-Sand (`#fdebd3`) + Sunny Apricot (`#ff9f43`) on Warm Milk (`#fffcf7`) | `Bricolage Grotesque` + `Nunito Sans` | Fear-Free First Visit Promise + Parent & Child Comfort Guide | Available |

## Live Client Registry

| # | Client | Specialty Theme | Folder | Vercel Project | Live URL | WhatsApp | Status |
|---|--------|-----------------|--------|----------------|----------|----------|--------|
| 1 | Tooth Care Speciality & Family Dental Clinic (Horamavu) | Family & Multi-Specialty (Terracotta / Lavender / Lime · `Archivo`) | `/` (root) | `tooth-care-speciality-family-dental` (`prj_2WIyZa6h109WeKrXl5ERFSAuvUIb`) | https://tooth-care-speciality-family-dental.vercel.app | +91 96117 63346 | Live — untouched |
| 2 | Dentimax Dental Clinic (Kothanur) | Multi-Specialty Clinic (`*-dmx.jpg`) | `/dentimax/` | `dentimax-dental-clinic` (`prj_XWmAJPk9S0KwsSJdjr2QciE0cFpv`) | https://dentimax-dental-clinic.vercel.app | +91 96065 68169 | Live — untouched (`*-dmx.jpg`) |
| 3 | Agape Dental Clinic (Narayanapura — Dr. Samuel Shedrach) | Painless Root Canal & Oral Surgery (Forest-Teal / Sage / Marigold Gold · `Fraunces` + `Plus Jakarta Sans`) | `/agape/` | `agape-dental-clinic` (`prj_FmbsVdxZ5fdEc2b3aOXM0FNnI3jT`) | https://agape-dental-clinic.vercel.app | Not publicly listed — bookings via Google Maps | Live — bespoke specialty design (`*-agp.jpg`), 4.8★/136+ ratings |
| 4 | Dr Haggie Dental care (Kothanur — Dr. Haggie) | Women-Led Calm & Painless Care (Mulberry-Plum / Blush / Warm Coral · `Cormorant Garamond` + `DM Sans`) | `/haggie/` | `dr-haggie-dental-care` (`prj_q5QudmGMxv8ymUPjn92gH0L83F84`) | https://dr-haggie-dental-care.vercel.app | +91 99004 36512 | Live — bespoke women-owned specialty design (`*-hge.jpg`), 5.0★/134 reviews |
| 5 | Shridha Dental Clinic (K. Narayanapura — Dr. Veena S. Narayanan & Dr. Sudhindra) | Oral Medicine, Diagnostics & Multi-Specialty Care (Alabaster / Dusty Rose-Taupe / Walnut Espresso / Brass / Clinical Teal · `Playfair Display` + `Outfit`) | `/shridha/` | `shridha-dental-clinic` (`prj_5eIPmCNCIEl9xvQpNqy8Qkmk5zIo`) | https://shridha-dental-clinic.vercel.app | +91 89040 27171 | Live — complete Google Sites redesign w/ all 17 Google Sites photos + HD `/api/gimg` proxy + 5.0★/34 reviews |

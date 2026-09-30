# 02_DESIGN.md — Design System & UI/UX Guidelines

**Project:** Web-Based Employee Attendance System  
**Product:** Kiosk & Management Portal  
**Document Version:** 1.0  
**Design Philosophy:** Soft, Friendly, Modern, Approachable, Tablet-First  

---

## 1. UI/UX Principles & Visual Identity

### 1.1 The "Friendly Kiosk" Principle
Traditional workforce management tools feel punitive, bureaucratic, and cold. Our design flips this expectation:
1. **Welcoming, Not Intimidating:** Rounded corners, warm neutrals, and encouraging copy ("Selamat Datang!", "Sampai Jumpa!") make clocking in an enjoyable daily touchpoint.
2. **Generous Touch Targets for Tablets:** Minimum button dimensions are 56px–72px height with ample spacing to prevent mis-taps on wall-mounted or counter tablets.
3. **Glanceable Statuses:** A user approaching the kiosk or checking their mobile dashboard can understand their attendance status in under 2 seconds.
4. **Delightful Micro-Feedback:** Subtle character/mascot animations and clear sound/visual rings replace generic spinners, giving tactile reassurance that attendance was properly captured.

### 1.2 Iconography Guidelines & Strict Non-AI Visual Identity
- **Prohibition of Sparkles / AI Symbols:** In accordance with PRD Sections 43 & 46 (Zero AI dependency, normal predictable business rules), the design strictly **forbids the use of AI sparkle icons (`Sparkles`, 4-point stars, magic wands)**.
- **Functional, Grounded Iconography:** Use clear, semantic, attendance-focused icons:
  - **Brand Logo:** `QrCode` in Indigo `#4F46E5` on `#EEF2FF` rounded container.
  - **Presence / Check-in:** `LogIn` / `CheckCircle2` in Emerald `#10B981`.
  - **Departure / Check-out:** `LogOut` in Coral `#F43F5E`.
  - **Time & Clock:** `Clock` in Slate `#0F172A`.
  - **Shifts & Rosters:** `Calendar` / `Layers`.
  - **Organization & Hardware:** `Building2` / `Tablet`.
- **Clean Status Badges:** Do not attach decorative sparkle ornaments to status pills, card titles, or modal headers. Every icon must have unambiguous functional meaning.

---

## 2. Color System & Design Tokens

The palette pairs a calming slate neutral base with warm emerald greens (Check-in/Masuk/Success) and warm amber/coral tones (Check-out/Pulang/Warning).

```
Primary Brand:
  - Deep Emerald / Forest Slate:  #0F172A (Text / Base dark)
  - Warm Card Surface:           #FFFFFF / #F8FAFC
  - Accent Friendly Indigo:       #6366F1 / #4F46E5

Functional / Semantic Colors:
  - MASUK (Check-In) Emerald:     #10B981 (Hover: #059669, Bg: #ECFDF5)
  - PULANG (Check-Out) Coral:     #F43F5E (Hover: #E11D48, Bg: #FFF1F2)
  - Late / Warning Amber:         #F59E0B (Bg: #FFFBEB)
  - Absence / Holiday Violet:     #8B5CF6 (Bg: #F5F3FF)
  - Neutral Borders & Lines:      #E2E8F0
  - Neutral Secondary Text:       #64748B
```

### 2.1 CSS Design Tokens (`tokens.css`)

```css
:root {
  /* Brand & Neutrals */
  --bg-app: #F8FAFC;
  --surface-card: #FFFFFF;
  --surface-hover: #F1F5F9;
  --text-main: #0F172A;
  --text-muted: #64748B;
  --border-light: #E2E8F0;
  --border-focus: #6366F1;

  /* Primary Action: MASUK (Check-In) */
  --action-masuk: #10B981;
  --action-masuk-hover: #059669;
  --action-masuk-light: #ECFDF5;
  --action-masuk-border: #A7F3D0;

  /* Primary Action: PULANG (Check-Out) */
  --action-pulang: #F43F5E;
  --action-pulang-hover: #E11D48;
  --action-pulang-light: #FFF1F2;
  --action-pulang-border: #FECDD3;

  /* Semantic Highlights */
  --status-present: #10B981;
  --status-late: #F59E0B;
  --status-late-bg: #FEF3C7;
  --status-leave: #8B5CF6;
  --status-leave-bg: #EDE9FE;
  --status-absent: #EF4444;
  --status-absent-bg: #FEE2E2;

  /* Radii & Shadows */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
  
  --shadow-soft: 0 4px 20px -2px rgba(15, 23, 42, 0.06);
  --shadow-floating: 0 12px 32px -4px rgba(15, 23, 42, 0.12);
  --shadow-active: 0 20px 40px -8px rgba(16, 185, 129, 0.25);

  /* Typography Scale */
  --font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

---

## 3. Typography Hierarchy

Using a modern, human-centric sans-serif font family (**Plus Jakarta Sans** or **Inter**):

| Style Level | Size / Line Height | Weight | Purpose |
|---|---|---|---|
| **Display Kiosk Clock** | 48px – 64px / 1.1 | Bold (700) | Live real-time clock on Kiosk screen |
| **Heading 1 (Page Title)** | 28px – 32px / 1.2 | Bold (700) | Main section headers |
| **Heading 2 (Card Title)** | 20px – 24px / 1.3 | Semi-Bold (600) | Modal & Widget headers |
| **Heading 3 (Subhead)** | 16px – 18px / 1.4 | Semi-Bold (600) | Form labels & Table columns |
| **Body Primary** | 15px – 16px / 1.5 | Regular (400) | Primary narrative & data values |
| **Body Secondary / Caption** | 13px – 14px / 1.4 | Medium (500) | Timestamps, metadata, hints |
| **Action Button Labels** | 18px – 22px / 1.0 | Bold (700) | Kiosk buttons (`MASUK`, `PULANG`) |

---

## 4. Key Component Specifications

### 4.1 Kiosk Mode Header & Clock
- Displays the **Organization Display Name** (e.g. *"ABC Care — Shimada Branch"*).
- Displays high-visibility live digital clock with seconds pulse and local Indonesian/English date format (e.g. *"Rabu, 30 September 2026"*).
- Subdued battery/online status indicator icon.

### 4.2 Big Action Switcher: `[ MASUK ]` vs `[ PULANG ]`
- **Side-by-side or stacked pills** with distinctive visual identities:
  - **MASUK:** Emerald green badge, sun/sunrise icon, cheerful hover effect.
  - **PULANG:** Sunset/moon icon, coral-rose tone.
- When pressed, the active mode illuminates with an animated ring and immediately engages the front-camera viewport below.

### 4.3 Front-Camera Viewfinder Component
- **Framing:** Centered, rounded viewport (`border-radius: 24px; border: 4px solid var(--accent)`).
- **Target Reticle:** Subtle animated glowing corner guides (brackets) framing the expected QR card placement area.
- **Mirroring:** The video stream is horizontally flipped (`transform: scaleX(-1)`) by default so user movement feels natural like looking into a mirror.
- **Scanner State Badge:** Text pill directly below the frame: *"Arahkan kartu QR Anda ke kamera depan"* (Position your QR card facing the camera).

### 4.4 Result Feedback Modal / Card (Full Screen Overlay)
- Automatically appears upon successful QR parsing and backend clearance.
- **Structure:**
  1. Animated character / checkmark icon.
  2. Large celebratory heading: *"Berhasil!"* (or friendly error state).
  3. Member Name in prominent text: *"Musa Al-Fatih"*.
  4. Badge: *"MASUK — 07:52:14 WIB"*.
  5. Schedule notice: *"Shift Pagi (08:00 - 17:00) • Tepat Waktu"*.
  6. Auto-dismiss progress bar (3 seconds countdown before resetting to scanner).

### 4.5 Monthly Schedule Matrix (Admin)
- Sticky first column for **Employee Name & Position**.
- Sticky header row for days of the month (1, 2, 3... 31) with weekend columns visually tinted.
- Cell design: Compact, high-contrast colored pills:
  - `A` (Shift A - Emerald)
  - `B` (Shift B - Sky Blue)
  - `C` (Shift C - Indigo)
  - `OFF` (Slate grey)
  - `CUTI` / `LEAVE` (Purple)
  - `SAKIT` / `SICK` (Amber)
- Clicking any cell pops a micro-menu for instant single-click shift reassignment.

---

## 5. Layout & Responsive Behavior

### 5.1 Tablet Kiosk Mode (Landscape 1024x768 / 1280x800)
- **Split Screen Composition:**
  - **Left Half (45%):** Business Branding, Live Clock, `MASUK` / `PULANG` mode buttons, Today's Quick Summary counter.
  - **Right Half (55%):** Front camera viewfinder card, alignment guidelines, scan feedback overlays.
- Zero pinch-to-zoom, fixed viewport, full screen PWA standalone experience.

### 5.2 Tablet Kiosk Mode (Portrait iPad 768x1024)
- **Top:** Business branding + Live clock.
- **Center:** Front camera viewfinder card.
- **Bottom:** Large sticky dual buttons: `[ MASUK ]` and `[ PULANG ]`.

### 5.3 Member Mobile View (375px - 430px)
- Bottom navigation bar: `[ Hari Ini ]`, `[ Jadwal ]`, `[ Riwayat ]`, `[ Profil ]`.
- Today card with prominent attendance status ring:
  - Not Checked In -> Grey / Dashed
  - Checked In -> Radiant Emerald with timestamp
  - Checked Out -> Clean Blue with total hours worked.

### 5.4 Admin Desktop Console (1280px+)
- Collapsible sidebar with navigation (`Hari Ini`, `Karyawan`, `Jadwal`, `Shift`, `Presensi`, `Laporan`, `Pengaturan`).
- Top bar with organization switcher, quick search, and profile dropdown.
- Fluid data tables with pagination, search filters, and batch CSV export buttons.

---

## 6. Micro-Interactions & Animation Guidelines

Animations must remain **fast (under 350ms)**, **lightweight**, **non-blocking**, and **support `prefers-reduced-motion`**.

### 6.1 Mascot / Character Micro-States
Instead of clinical spinning wheels, a friendly, lightweight vector character ("Koji the Timekeeper") or fluid geometric glyphs illustrate scan stages:

```
[ IDLE ]       --> Character waves or holds empty attendance card.
[ SCANNING ]   --> Subtle scanning beam waves vertically across the card.
[ VALIDATING ] --> Character leans forward with a thinking sparkle (max 400ms).
[ SUCCESS ]    --> Character jumps happily with confetti burst, green checkmark.
[ DUPLICATE ]  --> Character politely raises hand with a friendly "Already checked in!" smile.
[ INVALID ]    --> Character scratches head gently, indicating "QR card unrecognized".
```

### 6.2 Key Interaction Transitions
1. **Button Tap:** Scale down to `0.97` on pointer down, release with subtle spring (`transform: scale(1.0)`).
2. **Scanner Reticle Glow:** Subtle pulsating opacity (from `0.6` to `1.0` every 2 seconds) signaling active video processing.
3. **Modal Entrance:** Slide up 16px with fade-in (`cubic-bezier(0.16, 1, 0.3, 1)` duration `250ms`).
4. **Auto-Dismiss Ring:** Circular SVG stroke countdown timer smoothly completing in 3000ms.

---

## 7. Accessibility & Offline Considerations
- **High Contrast Ratios:** All text elements exceed WCAG AA ratio (minimum 4.5:1 for body, 3:1 for large display text).
- **Camera Fallback:** Clear user-friendly alert if camera permission is denied with instructions to grant permission in browser settings.
- **Network Lost Alert:** Friendly banner: *"Koneksi terputus. Menghubungkan kembali ke server..."* to prevent scans that cannot be authenticated.

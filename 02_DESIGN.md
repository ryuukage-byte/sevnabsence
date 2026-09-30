# 02_DESIGN.md — Soft Mint Sky: Illustrated Scrapbook Design System

**Project:** Web-Based Employee Attendance System (`Absence` / `sevnabsence`)  
**Design System:** Soft Mint Sky — Playful Illustrated Skeuomorphic UI  
**Sub-Style:** Kawaii Scrapbook / Character Dossier / Stickerbook  
**Aesthetics:** Fresh • Calm • Soft • Cozy • Playful • Tactile  
**Version:** 2.0 (Updated from Soft Mint Sky specification)  

---

## 00. Visual Direction Summary

The system is designed to feel like a **warm, tactile scrapbook, character dossier, or 2D game journal**, rather than a cold, corporate SaaS or punitive punch-clock. 

### Core Characteristics:
- **Paper Surface & Ivory Base:** Warm Ivory (`#FFFDF8`) background, Paper Beige (`#F5F1E8`) card surfaces, and subtle Warm Linen (`#D8CDBE`) borders.
- **Color Accents:** Fresh Soft Mint (`#7CCFCF`) for primary actions, Sky Blue (`#A9D7F5`) for secondary/info elements, Butter Yellow (`#FFD88A`) for badges/rewards, and Soft Peach (`#FFBFA3`) for subtle highlights and washi tape accents.
- **Modern 2D Skeuomorphic Depth:** Tactile hard-drop paper shadows (`0 4px 0 #E7DDCD`), top inset highlights (`inset 0 2px 0 rgba(255,255,255,.85)`), and realistic button press transitions (`translateY(3px)` with reduced shadow).
- **Die-cut Stickers & Polaroid Cards:** Mascot character (*Koji*) and badges feature clean white die-cut borders with soft drop shadows.
- **Scrapbook Motifs:** Semi-translucent washi tape strips, paper clip outlines, notebook tabs, and grid graph paper touches.
- **Strict Non-AI Visual Identity:** Strict prohibition of AI sparkle stars (`Sparkles`, 4-point magic stars). All icons represent concrete, functional attendance and scheduling actions.
- **Content First & High Accessibility:** No glassmorphism, no eye-straining neon gradients, and dark readable ink (`#393F3F` / `#5C5A57`) ensuring WCAG AA compliance.

---

## 01. Color Palette Swatches & Semantic Tokens

### Color Balance Proportion:
- **70% Neutral Base:** Warm Ivory (`#FFFDF8`), Soft Canvas (`#FAF7F0`), Paper Beige (`#F5F1E8`).
- **20% Brand Palette:** Soft Mint (`#7CCFCF`), Sky Blue (`#A9D7F5`).
- **10% Accents:** Butter Yellow (`#FFD88A`), Soft Peach (`#FFBFA3`), Gentle Lavender (`#DCCCF3`).

### Complete Palette Specification:

| Token Name | HEX | Role & Usage | Text On Color |
|---|---|---|---|
| **Soft Mint** | `#7CCFCF` | Primary CTA, active tab, check-in indicator | `#244E52` (Deep Teal) |
| **Soft Mint Hover** | `#69BBBB` | Primary button hover state | `#244E52` |
| **Soft Mint Pressed** | `#59A9A9` | Primary button active state (3px pressed) | `#244E52` |
| **Mint Soft Surface** | `#D6EEED` | Subdued mint pill, active nav item background | `#244E52` |
| **Sky Blue** | `#A9D7F5` | Secondary button, info card, calendar accent | `#375C73` (Deep Sky) |
| **Sky Blue Soft** | `#EAF5FD` | Secondary button fill, info notification bg | `#375C73` |
| **Butter Yellow** | `#FFD88A` | Badge, shift highlight, warning pill | `#6D4E1F` (Warm Amber) |
| **Soft Peach** | `#FFBFA3` | Check-out (Pulang) button, decorative tape | `#764B3A` (Warm Terracotta) |
| **Warm Ivory** | `#FFFDF8` | Body background, card face | `#5C5A57` / `#393F3F` |
| **Paper Beige** | `#F5F1E8` | Card container, modal surface, navbar bg | `#5C5A57` |
| **Paper Depth** | `#EEE8DB` | Inset surface, table header, depth layer | `#393F3F` |
| **Warm Linen Line** | `#D8CDBE` | Default 1.5px border, card outlines | — |
| **Ink Strong** | `#393F3F` | Main headlines, high-contrast values, clock | — |
| **Warm Charcoal** | `#5C5A57` | Body copy, secondary titles, card headers | — |
| **Warm Gray** | `#6E6B67` | Subtitles, supporting text | — |
| **Muted Ink** | `#776F65` | Input placeholders, captions | — |
| **Soft Cocoa** | `#8B6F5A` | Illustration outlines, doodle borders | — |
| **Sticker White** | `#FFFFFF` | Die-cut outlines, polaroid photo borders | — |

---

## 02. Typography & Font System

Using warm, rounded, friendly Google Fonts:
- **Display / Headlines:** `Fredoka`, `Nunito` (Weight 700–800)
- **UI & Body:** `Nunito`, `Nunito Sans` (Weight 500, 600, 700)
- **Decorative Notes / Badges:** `Patrick Hand` (handwritten cursive for small tape notes & sticker badges)
- **Monospace (Time & Codes):** `JetBrains Mono` or tabular numerals

### Typographic Scale:
- **Kiosk Digital Clock:** 56px–64px | Weight 700 | Tabular numbers
- **H1 (Page Title):** 32px–36px | Weight 800
- **H2 (Card / Modal Title):** 22px–26px | Weight 700
- **H3 (Section Header):** 18px–20px | Weight 700
- **Body:** 15px–16px | Weight 500–600 | Line-height 1.6
- **Small / Metadata:** 13px–14px | Weight 600
- **Button Labels:** 16px–18px | Weight 700

---

## 03. 2D Skeuomorphic Depth & Tactile Effects

Three elevation tiers are used across the UI:

### Level 0 — Flat Inset
- **Properties:** Background `#EEE8DB` or `#FAF7F0`, border 1.5px `#D8CDBE`, shadow none.
- **Used for:** Form text inputs, nested tables, metadata strips.

### Level 1 — Paper Raised (Default Cards & Panels)
- **Properties:**
  - Background: `#FFFDF8` on `#F5F1E8`
  - Border: 1.5px solid `#D8CDBE`
  - Inset Highlight: `inset 0 2px 0 rgba(255, 255, 255, 0.85)`
  - Hard Paper Shadow: `0 4px 0 #E7DDCD, 0 8px 18px rgba(91, 78, 64, 0.07)`
  - Border Radius: 20px (mobile: 16px)
- **Used for:** Attendance cards, shift rosters, employee dossiers, modal dialogs.

### Level 2 — Floating Die-Cut Sticker / Mascot
- **Properties:**
  - Outline: 4px–6px solid `#FFFFFF`
  - Sticker Shadow: `0 6px 0 rgba(139, 111, 90, 0.12), 0 12px 25px rgba(67, 52, 37, 0.12)`
  - Optional slight tilt: `-2deg` to `+2deg` for stickers (cards remain straight for readability).
- **Used for:** Mascot *Koji*, celebration result badges, printable ID cards.

### Tactile Buttons:
- **Primary (Soft Mint):**
  - Background: `#7CCFCF`
  - Text: `#244E52`
  - Border: 1.5px solid `#5EA9A9`
  - Shadow: `0 4px 0 #59A9A9`, `inset 0 2px 0 rgba(255, 255, 255, 0.45)`
  - Active: `transform: translateY(3px); box-shadow: 0 1px 0 #59A9A9;`
- **Check-Out (Soft Peach):**
  - Background: `#FFBFA3`
  - Text: `#764B3A`
  - Border: 1.5px solid `#EAA183`
  - Shadow: `0 4px 0 #EAA183`, `inset 0 2px 0 rgba(255, 255, 255, 0.45)`
  - Active: `transform: translateY(3px); box-shadow: 0 1px 0 #EAA183;`

---

## 04. Component Styling Specifications

### 4.1 Header & Navigation Tab
- Header background is Paper Beige `#F5F1E8` with a bottom border `#D8CDBE`.
- Navigation items styled as tactile journal tabs with rounded top corners.
- Active tab has Soft Mint surface `#D6EEED`, deep teal text `#244E52`, and a raised appearance.

### 4.2 Kiosk Viewport & Washi Tape Accents
- The camera viewfinder is framed in a warm polaroid border with rounded corners (`24px`).
- Diagonal decorative **washi tape** strips (`#A9D7F5` or `#FFBFA3` at 70% opacity) pinned at corners.
- Dual touch buttons (`[ MASUK ]` in Soft Mint and `[ PULANG ]` in Soft Peach) with minimum 64px height.

### 4.3 Mascot (*Koji*) Micro-Interactions
- Rendered as a high-resolution die-cut sticker with a white border.
- States:
  - `IDLE`: Gentle floating breathing animation.
  - `SCANNING`: Ears perked, attentive gaze towards camera.
  - `SUCCESS`: Cheerful jump with confetti particles and green check stamp.
  - `DUPLICATE`: Friendly reminder hand gesture with yellow butter badge.
  - `INVALID`: Curious tilt with soft peach question mark.

### 4.4 Member Portal: Character Dossier Card
- Employee profile presented as an illustrated "ID Dossier" with polaroid photo, lanyard clip motif, and quick QR card.
- Attendance calendar resembles a monthly planner notebook with soft dashed lines and pastel status stamps.

### 4.5 Admin Console: Monthly Roster Spreadsheet
- Styled like an open binder notebook with tabbed dividers.
- Sticky column for employee roster; sticky header for dates 1..31.
- Shift assignments displayed as compact pill stickers with distinct pastel backgrounds and high-contrast labels.

---

## 05. Strict DO and DON'T Rules

### DO:
1. Keep backgrounds warm and clean (Warm Ivory `#FFFDF8` / Soft Canvas `#FAF7F0`).
2. Always pair pastel backgrounds with dark readable ink (`#244E52` on mint, `#375C73` on sky, `#6D4E1F` on yellow).
3. Use generous spacing (whitespace) to maintain a peaceful, cozy atmosphere.
4. Keep all button tap targets at 44px minimum (64px on Kiosk).
5. Maintain consistent 20px card radius and 1.5px linen borders.

### DON'T:
1. **NO AI ICONS OR SPARKLES:** Never use `Sparkles`, 4-point star bursts, or magic wands.
2. **NO NEON / HARSH CONTRASTS:** Avoid pitch-black (`#000000`) text or glowing saturated neons.
3. **NO GLASSMORPHISM:** Avoid transparent frosted-glass blur panels; use solid paper layers.
4. **NO ROTATING IMPORTANT DATA:** Only stickers or decorative washi tape can have slight tilt (`±2deg`); data cards and tables must always stay perfectly horizontal.
5. **NO WHITE TEXT ON LIGHT PASTEL:** White text on light mint or light yellow fails WCAG AA and is forbidden.

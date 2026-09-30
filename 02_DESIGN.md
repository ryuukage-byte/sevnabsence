# 02_DESIGN.md — Simplicity Modern Skeuomorphism Design System

**Project:** Web-Based Employee Attendance System (`Absence` / `sevnabsence`)  
**Design System:** Simplicity Modern Skeuomorphism (Tactile, Clean, Minimalist)  
**Reference Aesthetics:** Modern tactile physical UI, clean raised icon tiles, subtle micro-bevels, crisp outline iconography (Lucide 2px stroke), soft frosted blur.  
**Version:** 3.0 (Restart to Simplicity Modern Skeuomorphism)  

---

## 00. Visual Direction Summary

The interface is built around **Simplicity Modern Skeuomorphism**:
- Eliminates visual clutter (no cartoon stickers, no fake washi tape strips, no fake paperclips, no childish motifs).
- Retains physical, tactile satisfaction:
  - **Raised Tactile Icon Tiles:** Off-white buttons with subtle 1px border, soft drop-shadow (`box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 3px 8px rgba(0,0,0,0.04), inset 0 1px 0 #FFFFFF`), and responsive physical sink-in when pressed.
  - **Tactile Primary Actions:** High-contrast, tactile pills for `PRESENSI MASUK` (emerald gradient + bevel highlight) and `PRESENSI PULANG` (amber gradient + bevel highlight).
  - **Hardware Tablet Bezel:** Sleek ceramic white kiosk bezel encasing the front-camera scanner with a minimal emerald reticle and laser sweep.
  - **Segmented Control Navigation:** Recessed track with physically raised active button thumb.

---

## 01. Color Palette Swatches & Semantic Tokens

### Canvas & Neutral Palette:
- **Application Background:** `#F4F6F9` (Crisp, clean neutral canvas)
- **Card Surface:** `#FFFFFF` (Pure white card with soft 3D elevation)
- **Subtle Surface:** `#F8F9FA`
- **Inset Surface:** `#ECEFF3` (Recessed tracks and control wells)
- **Tactile Border:** `rgba(0, 0, 0, 0.08)` / `rgba(0, 0, 0, 0.05)`

### Primary Action Tokens:
- **Masuk (Check In):** Emerald gradient `linear-gradient(180deg, #10B981 0%, #059669 100%)` with tactile border `#047857` and glow shadow `0 4px 14px rgba(16, 185, 129, 0.28)`.
- **Pulang (Check Out):** Amber gradient `linear-gradient(180deg, #F59E0B 0%, #D97706 100%)` with tactile border `#B45309` and glow shadow `0 4px 14px rgba(245, 158, 11, 0.28)`.

### Text Hierarchy:
- **Heading & Heavy:** `#0F172A` (Slate 900)
- **Body Text:** `#334155` (Slate 700)
- **Muted Label:** `#64748B` (Slate 500)
- **Subtle / Hint:** `#94A3B8` (Slate 400)

---

## 02. Typography

Clean, refined, professional sans-serif:
- **Headlines & Display:** `Plus Jakarta Sans`, 700 / 800 weight
- **Body & Controls:** `Inter`, 500 / 600 weight
- **Time & Code:** `JetBrains Mono`, 700 weight

---

## 03. Tactile Button & Surface Elevation Spec

```css
/* Tactile Icon Tile (Matching user's reference image) */
.tactile-tile-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 3px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 #FFFFFF;
  transition: all 0.18s ease-out;
}

.tactile-tile-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 #FFFFFF;
}

.tactile-tile-btn:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.08);
}
```

---

## 04. Iconography Standard

- Uses standard 2px stroke outline icons from **Lucide** (matching the minimalist outline iconography in the user's reference sheet).
- Clean, functional, zero cartoonish or clutter elements.

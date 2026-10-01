# 02_DESIGN.md — Calm Tactile Design System

**Project:** Web-Based Employee Attendance System (`Absence` / `sevnabsence`)
**Design system:** Calm Tactile — Warm Linen, Mocha & Sage (minimalist modern skeuomorphism)
**Version:** 4.0 — disinkronkan dengan kode (sebelumnya v3.0 menjelaskan palet slate/emerald/amber yang tidak pernah dipakai di CSS)

> **Sumber kebenaran adalah `src/styles/00-tokens.css`.** Dokumen ini menjelaskan *aturan*; nilai persisnya
> selalu dibaca dari file token. Tabel di bawah dibangkitkan dari file tersebut. `npm run lint:design`
> menggagalkan build jika ada warna hex, radius, font-size, atau z-index mentah di luar token, atau
> `var(--x)` yang tidak terdefinisi.

---

## 1. Arah visual

- Permukaan fisik yang tenang: kartu putih "porselen" di atas kanvas linen hangat, ubin ikon yang timbul
  (`--shadow-tile`), segmented control dengan jalur cekung dan thumb timbul.
- Sidebar mocha (`--sidebar-bg`) adalah elemen kunci; teks aktif berupa tab putih yang "diekstrusi".
- Aksi utama berupa tombol bertekstur gradien: **Masuk = sage**, **Pulang = terracotta**, aksi netral = espresso gelap.
- **Tidak ada** stiker, washi tape, paperclip, atau motif kartun. (Aset `public/assets/scrapbook/` yang
  bertentangan dengan aturan ini sudah dihapus.)
- Ikon: **Lucide**, outline, stroke 2px. Tanpa emoji di UI.

## 2. Warna

### 2.1 Kanvas, teks, border, brand
| Token | Nilai |
|---|---|
| `--bg-app` | `#F5F2EB` |
| `--surface-card` | `#FFFFFF` |
| `--surface-muted` | `#F8F5EE` |
| `--surface-inset` | `#E7E1D6` |
| `--surface-hover` | `#F2ECE2` |
| `--sidebar-bg` | `#76665A` |
| `--sidebar-text` | `#FDFBF8` |
| `--sidebar-text-muted` | `rgba(253, 251, 248, 0.72)` |
| `--sidebar-active-text` | `#342B24` |
| `--border-light` | `rgba(140, 120, 100, 0.12)` |
| `--border-subtle` | `rgba(140, 120, 100, 0.08)` |
| `--border-strong` | `rgba(140, 120, 100, 0.22)` |
| `--text-main` | `#342B24` |
| `--text-body` | `#4E423A` |
| `--text-muted` | `#6A5E54` |
| `--text-subtle` | `#766A60` |
| `--color-white` | `#FFFFFF` |
| `--text-on-brand` | `var(--color-white)` |
| `--surface-warm` | `#FAF7F2` |
| `--surface-dark` | `#1C1714` |
| `--surface-dark-raised` | `#2D2520` |
| `--text-on-dark-muted` | `#A69B91` |
| `--border-paper` | `#E3DFD6` |

### 2.2 Aksen dan aksi
| Token | Nilai |
|---|---|
| `--accent-terracotta` | `#C87A58` |
| `--accent-caramel` | `#C9944A` |
| `--accent-sage` | `#3B7A57` |
| `--accent-mocha` | `#8D7B6D` |
| `--action-masuk-grad` | `linear-gradient(180deg, var(--accent-sage) 0%, var(--accent-sage-strong) 100%)` |
| `--action-masuk-shadow` | `0 4px 14px rgba(59, 122, 87, 0.28), 0 2px 0 var(--accent-sage-deep), inset 0 1px 0 rgba(255, 255, 255, 0.4)` |
| `--action-pulang-grad` | `linear-gradient(180deg, var(--accent-terracotta) 0%, var(--accent-terracotta-strong) 100%)` |
| `--action-pulang-shadow` | `0 4px 14px rgba(200, 122, 88, 0.28), 0 2px 0 #8E4C2C, inset 0 1px 0 rgba(255, 255, 255, 0.4)` |
| `--accent-sage-strong` | `#2E6044` |
| `--accent-sage-deep` | `#244E37` |
| `--accent-sage-light` | `#448962` |
| `--accent-sage-hover` | `#346B4D` |
| `--accent-terracotta-strong` | `#A85D3B` |
| `--action-masuk-grad-hover` | `linear-gradient(180deg, var(--accent-sage-light) 0%, var(--accent-sage-hover) 100%)` |
| `--action-dark-grad` | `linear-gradient(180deg, #52443A 0%, #3D322B 100%)` |
| `--action-dark-grad-hover` | `linear-gradient(180deg, #5F5045 0%, #463A32 100%)` |
| `--action-dark-border` | `#302620` |
| `--accent-terracotta-deep` | `#8E4C2C` |
| `--accent-terracotta-hover` | `#B46643` |
| `--accent-terracotta-light` | `#D48866` |

### 2.3 Status (satu-satunya sumber untuk badge, pill matriks, ubin KPI)

Setiap status punya trio `bg / text / border`. Menambah status baru = tambah token di sini, tambah varian
`.status-pill--<nama>` di `14-components.css`, dan satu baris di `components/common/Badge.tsx`. **Jangan**
menulis warna di komponen.

| Token | Nilai |
|---|---|
| `--status-present` | `#3B7A57` |
| `--status-present-bg` | `#EBF4EE` |
| `--status-late-bg` | `#FAF2E4` |
| `--status-leave-bg` | `#EEDFEA` |
| `--status-absent` | `#C87A58` |
| `--status-absent-bg` | `#F9ECE5` |
| `--status-present-text` | `var(--accent-sage-deep)` |
| `--status-present-border` | `#BBD8C6` |
| `--status-late-text` | `#6D4E1F` |
| `--status-late-border` | `#EBD3A0` |
| `--status-absent-text` | `#8C473A` |
| `--status-absent-border` | `#F2C4B3` |
| `--status-absent-bg-hover` | `#F2D8CB` |
| `--status-leave-text` | `#6C4266` |
| `--status-leave-border` | `#DCCCF3` |
| `--status-sick-bg` | `#F8E3DE` |
| `--status-sick-text` | `#8C473A` |
| `--status-sick-border` | `#F2C4B3` |
| `--status-off-bg` | `#E8E5DF` |
| `--status-off-border` | `#D8CDBE` |
| `--status-info-bg` | `#EAF5FD` |
| `--status-info-text` | `#375C73` |
| `--status-info-border` | `#A9D7F5` |
| `--status-late-bg-hover` | `#F5E6C8` |
| `--status-off-text` | `#55504A` |
| `--cell-sunday-bg` | `#FFF8F6` |
| `--cell-today-bg` | `#F3F8F5` |
| `--cell-hover-bg` | `#EFEBE4` |
| `--cell-selected-bg` | `#E9F4EE` |
| `--danger-strong` | `#8A3629` |
| `--danger-deep` | `#6F2B21` |
| `--danger` | `#A14234` |
| `--danger-bg` | `#F4EAE7` |
| `--danger-border` | `#E5C6BF` |

| Status data | Varian | Label |
|---|---|---|
| PRESENT, VERIFIED | `present` (sage) | Tepat Waktu / Terverifikasi |
| LATE, REVIEW_REQUIRED, PENDING_REVIEW | `late` (caramel) | Terlambat / Perlu Review |
| ABSENT, FLAGGED_INVALID | `absent` (terracotta) | Alpha / Tidak Sah |
| LEAVE | `leave` (ungu lembut) | Cuti |
| SICK | `sick` | Sakit |
| OFF, HOLIDAY | `off` (netral) | Libur |
| CORRECTED, SHIFT | `info` (biru lembut) | Dikoreksi / Masuk Shift |

> Warna **shift** (`color_code`) adalah *data* yang dipilih admin per shift dan disimpan di database. Itu bukan
> bagian dari tema dan satu-satunya warna hex yang sah di `.tsx`.

## 3. Tipografi

- **Display & UI:** Plus Jakarta Sans (`--font-family`, `--font-display`)
- **Waktu & kode:** JetBrains Mono (`--font-mono`)
- Font dimuat **sekali**, lewat `<link>` di `index.html`. (Inter pernah diimpor tetapi tidak pernah dipakai; sudah dihapus.)

| Token | Nilai |
|---|---|
| `--text-3xs` | `0.68rem` |
| `--text-2xs` | `0.74rem` |
| `--text-xs` | `0.8rem` |
| `--text-sm` | `0.86rem` |
| `--text-base` | `0.92rem` |
| `--text-md` | `1.05rem` |
| `--text-lg` | `1.2rem` |
| `--text-xl` | `1.35rem` |
| `--text-2xl` | `1.5rem` |
| `--text-3xl` | `1.75rem` |
| `--text-4xl` | `2.3rem` |

Pilih token terdekat. Jangan menulis `font-size: 0.87rem`.

## 4. Bentuk, layer, gerak

### Radius
| Token | Nilai |
|---|---|
| `--radius-2xs` | `4px` |
| `--radius-xs` | `6px` |
| `--radius-sm` | `8px` |
| `--radius-control` | `10px` |
| `--radius-tile` | `12px` |
| `--radius-md` | `14px` |
| `--radius-card` | `16px` |
| `--radius-lg` | `20px` |
| `--radius-xl` | `26px` |
| `--radius-full` | `9999px` |
| `--radius-round` | `50%` |

### Z-index
| Token | Nilai |
|---|---|
| `--z-cell` | `6` |
| `--z-cell-pinned` | `7` |
| `--z-raised` | `10` |
| `--z-sticky` | `20` |
| `--z-header` | `40` |
| `--z-drawer` | `50` |
| `--z-popover` | `99` |
| `--z-overlay` | `100` |
| `--z-modal` | `1000` |

### Gerak & fokus
| Token | Nilai |
|---|---|
| `--transition-base` | `all 0.16s ease` |
| `--focus-ring-color` | `#342B24` |
| `--focus-ring-on-dark` | `#FDFBF8` |

## 5. Komponen

| Komponen | Kelas | Catatan |
|---|---|---|
| Ubin ikon timbul | `.tactile-tile-btn` | hover naik 1px, active tenggelam |
| Tombol Masuk / Pulang | `--action-masuk-*`, `--action-pulang-*` | gradien + bevel + glow |
| Tombol primer gelap | `.btn-primary`, `.btn-auth-submit` | `--action-dark-grad` (satu definisi bersama) |
| Status pill | `.status-pill .status-pill--<varian>` | di-render `Badge.tsx`, titik status via `::before` |
| Ubin KPI / stat | `.kpi-tile-icon--*`, `.stat-icon-box--*` | varian kelas, bukan inline style |
| Tabel data | `.data-table` | satu definisi (di `08-tables.css`) |

## 6. Struktur stylesheet

`src/styles/index.css` hanya berisi `@import` berurutan. **Urutan = cascade**, jangan diacak.

| File | Isi |
|---|---|
| `00-tokens.css` | `:root` — semua token |
| `01-base.css` | reset, layout global |
| `02-navbar.css` | header & segmented nav |
| `03-kiosk.css` | layar kiosk |
| `05-admin.css` | konsol admin & modul |
| `06-modals-auth.css` | modal, auth, form |
| `07-utilities.css` | utilitas kecil |
| `08`–`13` | tabel, matriks jadwal, dashboard, shift, viewfinder, kartu ID |
| `14-components.css` | status pill, varian ubin, perbaikan baris aktivitas |
| `15-responsive.css` | drawer & breakpoint |
| `16-a11y.css` | `:focus-visible`, `prefers-reduced-motion` |

Aturan: satu selector = satu definisi. Jika perlu menimpa, ubah rule aslinya; jangan menambah duplikat di bawah.

## 7. Aksesibilitas

- Fokus keyboard selalu terlihat (`16-a11y.css`); di sidebar mocha cincin berwarna krem.
- Tombol ikon-saja wajib punya `aria-label`.
- Animasi dimatikan untuk `prefers-reduced-motion`.
- Teks informasional minimal 4.5:1. Hasil pengukuran saat ini:

| Teks | Latar | Kontras |
|---|---|---|
| `--text-main` #342B24 | bg-app #F5F2EB | 12.4:1 |
| `--text-body` #4E423A | bg-app #F5F2EB | 8.7:1 |
| `--text-muted` #6A5E54 | bg-app #F5F2EB | 5.6:1 |
| `--text-subtle` #766A60 | bg-app #F5F2EB | 4.7:1 |
| `--text-muted` #6A5E54 | surface-card #FFFFFF | 6.3:1 |
| `--text-subtle` #766A60 | surface-card #FFFFFF | 5.2:1 |
| `--status-present-text` #244E37 | `--status-present-bg` #EBF4EE | 8.4:1 |
| `--status-late-text` #6D4E1F | `--status-late-bg` #FAF2E4 | 6.8:1 |
| `--status-absent-text` #8C473A | `--status-absent-bg` #F9ECE5 | 5.9:1 |
| `--status-leave-text` #6C4266 | `--status-leave-bg` #EEDFEA | 6.3:1 |
| `--status-sick-text` #8C473A | `--status-sick-bg` #F8E3DE | 5.5:1 |
| `--status-off-text` #55504A | `--status-off-bg` #E8E5DF | 6.3:1 |
| `--status-info-text` #375C73 | `--status-info-bg` #EAF5FD | 6.5:1 |
| `--text-on-brand` #FFFFFF | `--accent-sage` #3B7A57 | 5.1:1 |
| `--text-on-brand` #FFFFFF | `--accent-terracotta-strong` #A85D3B | 4.9:1 |
| `--sidebar-text` #FDFBF8 | `--sidebar-bg` #76665A | 5.3:1 |
| `--sidebar-text-muted` (α 0.88) | `--sidebar-bg` #76665A | 4.55:1 |
| `--text-on-brand` #FFFFFF | `--accent-terracotta-deep` #8E4C2C | 6.5:1 |

Tombol *Pulang* memakai gradien `--accent-terracotta-strong` → `--accent-terracotta-deep` (4.9–6.5:1), dan sidebar
memakai `#76665A`. Tidak ada pengecualian kontras yang diketahui untuk teks informasional; pasangan warna baru
wajib diukur dan ditambahkan ke tabel ini.

## 8. Checklist PR

1. `npm run lint:design` lulus.
2. Warna/radius/font-size/z-index baru berasal dari token (atau token baru ditambahkan di `00-tokens.css` **dan** dijelaskan di sini).
3. Tidak ada `style={{ ... }}` untuk warna; gunakan kelas varian.
4. Tombol ikon-saja punya `aria-label`.

# 05_TECH_SPEC.md — Technical Specification & Architecture

**Document Version:** 1.0  
**Target Environment:** Modern Web Browsers, iOS Safari (PWA), Android Chrome (PWA)  
**Primary Tech Stack:** React, TypeScript, Vite, Supabase (PostgreSQL), PWA Service Workers  

---

## 1. System Architecture Overview

The system is constructed as a modern, decoupled single-page application (SPA) with Progressive Web App (PWA) enhancements, connected to a managed PostgreSQL backend via Supabase.

```
+----------------------------------------------------------------------------+
|                          CLIENT APPLICATION (PWA)                          |
|                                                                            |
|  +--------------------+  +----------------------+  +--------------------+  |
|  |    Kiosk Mode      |  |  Member Portal       |  |   Admin Console    |  |
|  |  - Front Camera QR |  |  - Daily Dashboard   |  |  - Today Overview  |  |
|  |  - Audio Chimes    |  |  - Schedule Roster   |  |  - Monthly Grid    |  |
|  |  - Fast Feedback   |  |  - Personal History  |  |  - Corrections/CSV |  |
|  +--------------------+  +----------------------+  +--------------------+  |
|                                                                            |
|  +----------------------------------------------------------------------+  |
|  | State Layer: React Context / Zustand + React Query (Cache & Mutate)  |  |
|  +----------------------------------------------------------------------+  |
|  | Hardware Layer: MediaDevices API (Front Camera) + HTML5 QR Engine    |  |
|  +----------------------------------------------------------------------+  |
|  | Service Worker: Offline App Shell, Asset Cache, Manifest Config     |  |
+--+----------------------------------------------------------------------+--+
                                      |
                      HTTPS / WSS (Supabase Realtime)
                                      |
+-------------------------------------v--------------------------------------+
|                           BACKEND & PERSISTENCE                            |
|                                                                            |
|  +------------------------+  +------------------------------------------+  |
|  |     Supabase Auth      |  |           PostgreSQL 15+                 |  |
|  |  - Admin / Member JWT  |  |  - Row-Level Security (RLS)              |  |
|  |  - Session Management  |  |  - Atomic Scan RPC:                      |  |
|  +------------------------+  |      `record_attendance_scan()`          |  |
|                              |  - Strict Multi-Tenancy (organization_id)|  |
|                              |  - Duplicate Protection Constraints      |  |
|                              |  - Comprehensive Audit Trails            |  |
|                              +------------------------------------------+  |
+----------------------------------------------------------------------------+
```

---

## 2. Technology Stack Selection & Rationale

| Layer | Technology | Justification |
|---|---|---|
| **Build & Bundler** | **Vite** | Sub-second HMR, optimized production builds, fast PWA plugin integration. |
| **Frontend Framework**| **React 18 / 19 + TypeScript** | Robust component model, type safety across shifts/schedules, extensive ecosystem. |
| **Styling** | **Vanilla CSS with Custom Properties** | Zero-runtime CSS overhead, total design freedom for warm/friendly kiosk styling without bulky framework constraints. |
| **Icons** | **Lucide React** | Clean, modern, highly legible iconography. |
| **QR Scanning Engine**| **`html5-qrcode` / `@zxing/library`** | Battle-tested front-camera auto-focus, barcode decoding directly from video stream canvas. |
| **QR Code Generator** | **`qrcode.react` / Canvas** | Generates printable vector QR badges for members client-side. |
| **Backend / Database**| **Supabase (PostgreSQL 15)** | ACID compliance, instant REST/RPC endpoints, robust RLS policies, native server timestamps (`NOW()`). |
| **Authentication** | **Supabase Auth** | Secure email/password login, JWT tokens, role-based authorization claims. |
| **PWA Engine** | **`vite-plugin-pwa` / Workbox** | Instant installability on iPads & Android tablets, full screen standalone kiosk mode. |

---

## 3. Application Routing Matrix

| Route | Mode | Access Control | Purpose |
|---|---|---|---|
| `/` | Gateway | Public | Redirects authenticated users to their portal; defaults to `/attendance`. |
| `/login` | Auth | Public | Administrative & Member credentials entry. |
| `/attendance` | Kiosk | Public / Kiosk Device | Front-camera QR scanner kiosk with `[ MASUK ]` and `[ PULANG ]` toggles. |
| `/member` | Member | `ROLE: MEMBER` | Personal dashboard (today's shift, check-in status, clock widget). |
| `/member/schedule` | Member | `ROLE: MEMBER` | Read-only monthly roster of assigned shifts and off-days. |
| `/member/attendance`| Member | `ROLE: MEMBER` | Personal historical attendance records and statuses. |
| `/admin` | Admin | `ROLE: ADMIN` | Today's command center: live metrics, late arrivals, missing scans. |
| `/admin/members` | Admin | `ROLE: ADMIN` | Member CRUD, QR card generator, token revocation and issuance. |
| `/admin/schedule` | Admin | `ROLE: ADMIN` | Interactive monthly roster grid (reassign shifts in 1-click). |
| `/admin/attendance`| Admin | `ROLE: ADMIN` | Attendance log, filter by dept/status, manual correction dialog. |
| `/admin/shifts` | Admin | `ROLE: ADMIN` | Shift configuration (start, end, tolerances, grace periods). |
| `/admin/reports` | Admin | `ROLE: ADMIN` | Aggregated summaries (late mins, absenteeism) + 1-click CSV export. |
| `/admin/settings` | Admin | `ROLE: ADMIN` | Organization details, branch naming, timezone settings. |

---

## 4. Front-Camera Integration Architecture

### 4.1 Device Initialization
The kiosk tablet is mounted with the screen and front-facing camera facing approaching personnel. The camera component invokes `navigator.mediaDevices.getUserMedia`:

```typescript
const constraints: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: 'user', // Defaults to Front Camera
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 }
  }
};

const stream = await navigator.mediaDevices.getUserMedia(constraints);
videoElement.srcObject = stream;
```

### 4.2 Mirror Transformation
To ensure natural movement (users moving their badge left will see it move left on-screen like a physical mirror), the video viewport is styled with:

```css
.kiosk-video-preview {
  transform: scaleX(-1);
  object-fit: cover;
  border-radius: var(--radius-lg);
  width: 100%;
  height: 100%;
}
```

### 4.3 QR Decoding Loop & Throttling
- Local frames are decoded at **10 FPS** via canvas extraction to minimize tablet CPU/GPU load and battery drain.
- Once a QR token is recognized, scanning is immediately paused and locked with an in-flight debounce flag to avoid sending burst requests.

---

## 5. Security & Cryptographic Architecture

### 5.1 Opaque QR Token Generation
QR codes NEVER store plain-text IDs, names, or emails. Tokens are generated using high-entropy random bytes:

```typescript
// Backend or Admin token generator:
import { randomBytes } from 'crypto';
const tokenValue = `tok_${randomBytes(24).toString('hex')}`;
// Example: "tok_a7f92b3c48e019dc564e9a8f117bc02e485a3c99"
```

### 5.2 Server Timestamp Authority
- Under no circumstances does the client submit a timestamp.
- The PostgreSQL server executes `NOW()` inside the `record_attendance_scan()` stored function.
- Prevents tablet system clock spoofing, manual time rollbacks, and timezone discrepancies.

### 5.3 Database Row-Level Security (RLS) & Multi-Tenancy
- Every record is keyed by `organization_id`.
- Supabase JWT tokens contain `app_metadata: { organization_id, role }`.
- Postgres RLS filters all `SELECT`, `UPDATE`, `DELETE` operations so tenants cannot access cross-organization records.

---

## 6. Progressive Web App (PWA) Specification

### 6.1 Web App Manifest (`manifest.json`)
```json
{
  "name": "Absence — Attendance System",
  "short_name": "Absence",
  "description": "Fast QR-based tablet attendance kiosk and management portal",
  "start_url": "/attendance",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#F8FAFC",
  "theme_color": "#10B981",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 6.2 Service Worker Caching Strategy
- **App Shell (HTML/CSS/JS/Fonts):** Stored using **Cache-First** strategy. The app loads instantly on kiosk tablets without white screens.
- **Attendance API Calls (`/rpc/record_attendance_scan`):** **Network-Only**. Scans are never cached offline to prevent invalid or duplicate timestamps.
- **Offline Detector:** The UI listens to `window.addEventListener('offline')` and immediately disables the scan trigger, displaying an amber connectivity notice.

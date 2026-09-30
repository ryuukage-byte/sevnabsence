# 08_DEPLOYMENT.md — Production Deployment & Operational Runbook

**Document Version:** 1.0  
**Target Infrastructure:** Supabase (Database/Auth) + Vercel / Netlify (Frontend PWA)  
**Tablet Target:** Apple iPadOS (Guided Access) / Android (Kiosk Lock)  

---

## 1. Environment Variables Configuration

Create a `.env.production` file for build and runtime environments:

```ini
# ============================================================================
# SUPABASE BACKEND CREDENTIALS
# ============================================================================
# Found in Supabase Dashboard -> Project Settings -> API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================================
# APPLICATION METADATA & BRANDING DEFAULTS
# ============================================================================
VITE_APP_NAME="Absence Attendance System"
VITE_APP_VERSION="1.0.0"
VITE_DEFAULT_TIMEZONE="Asia/Jakarta"

# ============================================================================
# SECURITY & SCANNER SETTINGS
# ============================================================================
VITE_SCANNER_CAMERA_FACING="user"         # 'user' for front camera, 'environment' for rear
VITE_FEEDBACK_AUTO_RESET_MS=3000           # Duration feedback modal remains visible (ms)
VITE_ENABLE_AUDIO_CHIMES=true             # Audible confirmation tone on scan
```

> **Security Notice:** NEVER commit `SUPABASE_SERVICE_ROLE_KEY` to frontend repositories. Only `VITE_SUPABASE_ANON_KEY` is public and protected by PostgreSQL Row-Level Security.

---

## 2. Database Migration & Schema Bootstrapping

### 2.1 Applying Database Migrations
Execute the SQL migrations in order via the Supabase SQL Editor or Supabase CLI:

```bash
# 1. Install Supabase CLI if managing locally
npm install -g supabase

# 2. Link local environment to Supabase cloud project
supabase link --project-ref your-project-id

# 3. Apply schema migrations
supabase db push
```

### 2.2 Initial Organization & Shift Seeding Script
Execute this seed script to prepare the default tenant and shift schedules:

```sql
-- Create initial demo organization
INSERT INTO organizations (id, company_name, branch_name, display_name, timezone)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'ABC Care',
    'Shimada Branch',
    'ABC Care - Shimada',
    'Asia/Jakarta'
) ON CONFLICT DO NOTHING;

-- Seed standard workplace shifts
INSERT INTO shifts (organization_id, name, code, start_time, end_time, early_tolerance_mins, late_tolerance_mins, color_code)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Shift Pagi (Shift A)', 'A', '08:00:00', '17:00:00', 30, 10, '#10B981'),
    ('00000000-0000-0000-0000-000000000001', 'Shift Siang (Shift B)', 'B', '13:00:00', '22:00:00', 30, 10, '#0284C7'),
    ('00000000-0000-0000-0000-000000000001', 'Shift Malam (Shift C)', 'C', '21:00:00', '06:00:00', 30, 10, '#8B5CF6')
ON CONFLICT DO NOTHING;
```

---

## 3. Production Frontend Deployment (Vercel)

### 3.1 Vercel One-Click / CLI Deployment
1. Connect Git repository to **Vercel** (`https://vercel.com`).
2. Set Build Command: `npm run build`.
3. Set Output Directory: `dist`.
4. Configure Environment Variables in Vercel Project Settings (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
5. Ensure SPA rewrites are enabled by adding a `vercel.json` in the root:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

---

## 4. Physical Tablet Kiosk Hardening & Setup Guide

To prevent employees or visitors from tampering with the tablet, exiting the app, or adjusting system clocks:

### 4.1 Apple iPad (iPadOS) Setup via Guided Access
1. Open **Safari** on the iPad and navigate to your production URL: `https://your-domain.com/attendance`.
2. Tap the **Share** button in Safari and tap **"Add to Home Screen"**.
3. Launch the newly created app icon (launches in full-screen standalone PWA mode without address bar).
4. Go to iPad **Settings -> Accessibility -> Guided Access**. Enable Guided Access and set a Passcode.
5. In Guided Access Options:
   - Disable **Hardware Buttons** (Sleep/Wake button, Volume buttons).
   - Disable **Touch Timeout**.
   - Enable **Touch** (so users can press `MASUK` and `PULANG`).
6. Triple-click the iPad Top/Home button to lock the iPad into permanent Kiosk Attendance Mode.

### 4.2 Android Tablet Setup via Screen Pinning / Kiosk Lock
1. Open **Chrome** on the Android tablet and navigate to `https://your-domain.com/attendance`.
2. Tap the three dots menu -> **"Install app"** or **"Add to Home screen"**.
3. Open **Settings -> Security -> App Pinning** (or use Dedicated Kiosk Launcher such as Fully Kiosk Browser).
4. Launch the PWA and pin the application. Prevent exiting without the Admin PIN.
5. Mount the tablet in a secure front-facing counter/wall enclosure with continuous power supply.

---

## 5. Backup, Disaster Recovery & Data Integrity

### 5.1 Automated Database Backups
- Supabase automatically takes **daily automated backups** of PostgreSQL databases with 7-day retention on Pro plans.
- For high-compliance environments, enable **Point-In-Time Recovery (PITR)** to allow restoring to any second within the last 7 to 28 days.

### 5.2 Manual Backup CLI Script
Admins can generate an on-demand SQL dump before major schema updates:

```bash
# Export schema and attendance records
supabase db dump --data-only -f backup_attendance_$(date +%Y%m%d).sql
```

---

## 6. Health Checks, Logging & Monitoring

### 6.1 Critical Monitoring Points
- **PostgreSQL Connection Pool:** Monitor active connections in Supabase metrics dashboard.
- **Kiosk Uptime & Connectivity:** Check client-side connectivity health and report network dropouts.
- **Error Tracking:** Integrate Sentry for real-time capture of client-side camera initialization errors or API latency spikes.
- **Audit Trail Review:** Weekly administrative review of `attendance_corrections` and `audit_logs` to ensure no unauthorized manual alterations occurred.

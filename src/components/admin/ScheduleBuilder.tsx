import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CalendarCog,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Send,
  Sparkles,
  Undo2,
  Wand2
} from 'lucide-react';
import { facilityService, DAY_NAMES } from '../../services/facilityService';
import { attendanceService } from '../../services/attendanceService';
import { generateMonthSchedule, type GeneratorResult } from '../../services/scheduleGenerator';
import { useFacility } from '../../hooks/useFacility';
import { SchedulePill } from '../common/SchedulePill';

interface Props {
  onOpenMatrix: () => void;
}

export const ScheduleBuilder: React.FC<Props> = ({ onOpenMatrix }) => {
  useFacility();
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1;
  const N = new Date(year, month, 0).getDate();
  const rules = facilityService.getRules();
  const floors = facilityService.getFloors();
  const shifts = attendanceService.getShifts();
  const coverage = facilityService.getCoverage();
  const members = attendanceService.getMembers().filter((m) => m.is_active);
  const published = facilityService.isPublished(year, month);
  const existingCount = attendanceService.getSchedules(year, month).length;
  const mk = `${year}-${String(month).padStart(2, '0')}`;
  const pendingOff = facilityService.getOffRequests({ month: mk, status: 'PENDING' }).length;
  const approvedOff = facilityService.getOffRequests({ month: mk, status: 'APPROVED' }).length;

  const monthLabel = cursor.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const moveMonth = (delta: number) => {
    setCursor(new Date(year, month - 1 + delta, 1));
    setResult(null);
  };

  const cellMap = useMemo(() => {
    const map = new Map<string, GeneratorResult['cells'][number]>();
    result?.cells.forEach((c) => map.set(`${c.member_id}|${c.schedule_date}`, c));
    return map;
  }, [result]);

  const dateOf = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const days = Array.from({ length: N }, (_, i) => i + 1);

  const generate = () => {
    setResult(generateMonthSchedule(year, month));
    setFlash(null);
  };

  const apply = () => {
    if (!result) return;
    if (existingCount && !confirm(`Jadwal ${monthLabel} yang ada (${existingCount} sel) akan diganti. Lanjutkan?`)) return;
    attendanceService.replaceMonthSchedules(year, month, result.cells);
    facilityService.touch();
    setFlash(`Jadwal ${monthLabel} disimpan sebagai draft. Cek & edit manual di Matriks Jadwal, lalu publikasikan.`);
  };

  const floorShort = (id?: string) => {
    const f = floors.find((x) => x.id === id);
    return f ? `${f.level}F` : '';
  };

  const sortedMembers = [...members].sort((a, b) => {
    const fa = floors.findIndex((f) => f.id === facilityService.getStaffProfile(a.id).home_floor_id);
    const fb = floors.findIndex((f) => f.id === facilityService.getStaffProfile(b.id).home_floor_id);
    return fa - fb;
  });

  return (
    <div className="kg-page">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Pembuat Jadwal Bulanan</h2>
          <p className="view-subtitle">
            Generate otomatis 勤務表 berdasarkan kebutuhan per lantai & shift, tugas ruangan, identitas staf, pengajuan libur dan cuti
            yang sudah disetujui.
          </p>
        </div>
        <div className="matrix-month-controls">
          <button className="btn-cal-nav" onClick={() => moveMonth(-1)} aria-label="Bulan sebelumnya">
            <ChevronLeft size={18} />
          </button>
          <div className="current-month-banner">
            <span className="current-month-display">{monthLabel}</span>
          </div>
          <button className="btn-cal-nav" onClick={() => moveMonth(1)} aria-label="Bulan berikutnya">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="kg-stat-row">
        <div className="kg-stat">
          <span className="kg-stat-num">{members.length}</span>
          <span className="kg-stat-label">Staf aktif</span>
        </div>
        <div className="kg-stat">
          <span className="kg-stat-num">{approvedOff}</span>
          <span className="kg-stat-label">希望休 disetujui</span>
        </div>
        <div className={`kg-stat ${pendingOff ? 'kg-stat-warn' : ''}`}>
          <span className="kg-stat-num">{pendingOff}</span>
          <span className="kg-stat-label">Pengajuan pending</span>
        </div>
        <div className={`kg-stat ${published ? 'kg-stat-ok' : ''}`}>
          <span className="kg-stat-num">{published ? 'Terbit' : existingCount ? 'Draft' : '–'}</span>
          <span className="kg-stat-label">Status jadwal</span>
        </div>
      </div>

      <div className="kg-two-col">
        <section className="kg-card">
          <h3 className="kg-section-title">
            <CalendarCog size={18} /> Aturan penjadwalan
          </h3>
          <div className="kg-rule-grid">
            <label>
              Libur (公休) per bulan
              <input type="number" min={0} max={20} value={rules.monthly_off_days} onChange={(e) => facilityService.updateRules({ monthly_off_days: Number(e.target.value) })} />
            </label>
            <label>
              Maks hari kerja berturut-turut
              <input type="number" min={1} max={12} value={rules.max_consecutive_work_days} onChange={(e) => facilityService.updateRules({ max_consecutive_work_days: Number(e.target.value) })} />
            </label>
            <label>
              Maks 希望休 per staf / bulan
              <input type="number" min={0} max={10} value={rules.request_off_max_per_month} onChange={(e) => facilityService.updateRules({ request_off_max_per_month: Number(e.target.value) })} />
            </label>
            <label>
              Maks staf 希望休 di hari yang sama
              <input type="number" min={1} max={20} value={rules.request_off_max_per_day} onChange={(e) => facilityService.updateRules({ request_off_max_per_day: Number(e.target.value) })} />
            </label>
            <label>
              Batas pengajuan (tgl bulan sebelumnya)
              <input type="number" min={1} max={28} value={rules.request_deadline_day} onChange={(e) => facilityService.updateRules({ request_deadline_day: Number(e.target.value) })} />
            </label>
            <label>
              Shift malam
              <select value={rules.night_shift_id || ''} onChange={(e) => facilityService.updateRules({ night_shift_id: e.target.value || undefined })}>
                <option value="">Tidak ada</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="kg-check">
              <input type="checkbox" checked={rules.off_after_ake} onChange={(e) => facilityService.updateRules({ off_after_ake: e.target.checked })} />
              夜 → 明 → 公 (libur setelah 明け)
            </label>
            <label className="kg-check">
              <input type="checkbox" checked={rules.forbid_late_to_early} onChange={(e) => facilityService.updateRules({ forbid_late_to_early: e.target.checked })} />
              Larang 遅番 lalu 早番 besoknya
            </label>
          </div>
        </section>

        <section className="kg-card">
          <h3 className="kg-section-title">
            <Sparkles size={18} /> Kebutuhan staf minimum per hari
          </h3>
          <div className="table-responsive">
            <table className="data-table kg-coverage-table">
              <thead>
                <tr>
                  <th>Lantai</th>
                  {shifts.map((s) => (
                    <th key={s.id}>
                      <span className="kg-shift-chip" style={{ backgroundColor: s.color_code }}>
                        {s.code}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {floors.map((f) => (
                  <tr key={f.id}>
                    <td className="name-bold">{f.name}</td>
                    {shifts.map((s) => {
                      const c = coverage.find((x) => x.floor_id === f.id && x.shift_id === s.id);
                      return (
                        <td key={s.id}>
                          <div className="kg-cov-cell">
                            <input
                              type="number"
                              min={0}
                              aria-label={`${f.name} ${s.name} hari biasa`}
                              value={c?.min_staff ?? 0}
                              onChange={(e) => facilityService.setCoverage(f.id, s.id, Number(e.target.value), c?.weekend_min_staff)}
                            />
                            <input
                              type="number"
                              min={0}
                              className="kg-weekend-input"
                              aria-label={`${f.name} ${s.name} akhir pekan`}
                              title="Sabtu/Minggu (kosong = sama)"
                              placeholder="S/M"
                              value={c?.weekend_min_staff ?? ''}
                              onChange={(e) =>
                                facilityService.setCoverage(f.id, s.id, c?.min_staff ?? 0, e.target.value === '' ? undefined : Number(e.target.value))
                              }
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="kg-muted">Kolom kecil = kebutuhan Sabtu/Minggu (kosong = sama dengan hari biasa).</p>
        </section>
      </div>

      <div className="kg-generate-bar">
        <button type="button" className="btn-primary kg-btn-lg" onClick={generate} disabled={!members.length}>
          <Wand2 size={18} /> Generate jadwal {monthLabel}
        </button>
        {result && (
          <>
            <button type="button" className="btn-secondary" onClick={generate}>
              <Undo2 size={15} /> Generate ulang
            </button>
            <button type="button" className="btn-primary" onClick={apply}>
              <CheckCircle2 size={15} /> Simpan ke jadwal
            </button>
          </>
        )}
        {existingCount > 0 && (
          <button type="button" className="btn-secondary" onClick={onOpenMatrix}>
            Buka matriks
          </button>
        )}
        {existingCount > 0 &&
          (published ? (
            <button type="button" className="btn-secondary" onClick={() => facilityService.unpublishMonth(year, month)}>
              Tarik publikasi
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary kg-btn-sage"
              onClick={() => {
                facilityService.publishMonth(year, month);
                setFlash(`Jadwal ${monthLabel} dipublikasikan. Semua staf menerima notifikasi di Kotak Pesan.`);
              }}
            >
              <Send size={15} /> Publikasikan ke staf
            </button>
          ))}
      </div>
      {!members.length && (
        <div className="kg-card kg-empty-cta">
          <p className="kg-muted">Belum ada staf. Muat 7 karyawan contoh untuk mencoba pembuat jadwal.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              const n = facilityService.seedDemoStaff();
              setFlash(n ? `${n} karyawan contoh dimuat.` : 'Karyawan contoh sudah ada.');
            }}
          >
            <Sparkles size={15} /> Muat 7 staf contoh
          </button>
        </div>
      )}
      {flash && <div className="kg-flash">{flash}</div>}

      {result && (
        <>
          <section className="kg-card">
            <h3 className="kg-section-title">
              Hasil: {result.filledSlots}/{result.requiredSlots} slot kebutuhan terisi
            </h3>
            <ul className="kg-warning-list">
              {result.warnings.map((w, i) => (
                <li key={i} className={`kg-warning kg-warning-${w.severity}`}>
                  {w.severity === 'error' ? <AlertOctagon size={15} /> : w.severity === 'warning' ? <AlertTriangle size={15} /> : <Info size={15} />}
                  <span>{w.message}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="matrix-table-wrapper kg-preview">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="sticky-col header-member-col">
                    <span className="header-member-title">Staf</span>
                  </th>
                  {days.map((d) => {
                    const dow = new Date(year, month - 1, d).getDay();
                    return (
                      <th key={d} className={`day-col-header ${dow === 0 ? 'sunday-col' : ''} ${dow === 6 ? 'saturday-col' : ''}`}>
                        <div className="header-day-stack">
                          <span className="header-day-num">{d}</span>
                          <span className="header-day-name">{DAY_NAMES[dow]}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="kg-stat-col">Kerja</th>
                  <th className="kg-stat-col">Libur</th>
                  <th className="kg-stat-col">夜</th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((m) => {
                  const stat = result.stats.find((s) => s.member_id === m.id);
                  const p = facilityService.getStaffProfile(m.id);
                  return (
                    <tr key={m.id}>
                      <td className="sticky-col member-row-header">
                        <div className="member-matrix-cell">
                          <span className="member-name-text">{m.full_name}</span>
                          <span className="member-dept-text">
                            {floorShort(p.home_floor_id)} · Lv{p.level}
                          </span>
                        </div>
                      </td>
                      {days.map((d) => {
                        const c = cellMap.get(`${m.id}|${dateOf(d)}`);
                        const dow = new Date(year, month - 1, d).getDay();
                        return (
                          <td key={d} className={`matrix-data-cell ${dow === 0 ? 'sunday-cell' : ''} ${dow === 6 ? 'saturday-cell' : ''}`}>
                            <SchedulePill sch={c} shifts={shifts} suffix={c?.schedule_type === 'SHIFT' && c.floor_id !== p.home_floor_id ? floorShort(c.floor_id) : undefined} />
                          </td>
                        );
                      })}
                      <td className="kg-stat-col">{stat?.work}</td>
                      <td className={`kg-stat-col ${stat && Math.abs(stat.off - stat.target_off) >= 2 ? 'kg-warn-text' : ''}`}>
                        {stat?.off}/{stat?.target_off}
                      </td>
                      <td className="kg-stat-col">{stat?.nights}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {floors.flatMap((f) =>
                  shifts.map((s) => {
                    const rule = coverage.find((c) => c.floor_id === f.id && c.shift_id === s.id);
                    return (
                      <tr key={`${f.id}-${s.id}`} className="kg-cov-row">
                        <td className="sticky-col member-row-header">
                          <span className="kg-cov-label">
                            {f.level}F <span className="kg-shift-chip" style={{ backgroundColor: s.color_code }}>{s.code}</span>
                          </span>
                        </td>
                        {days.map((d) => {
                          const dow = new Date(year, month - 1, d).getDay();
                          const need = rule ? ((dow === 0 || dow === 6) && rule.weekend_min_staff !== undefined ? rule.weekend_min_staff : rule.min_staff) : 0;
                          const have = result.cells.filter(
                            (c) => c.schedule_date === dateOf(d) && c.schedule_type === 'SHIFT' && c.shift_id === s.id && c.floor_id === f.id
                          ).length;
                          return (
                            <td key={d} className={`kg-cov-count ${have < need ? 'short' : have > need ? 'extra' : ''}`}>
                              {have}
                            </td>
                          );
                        })}
                        <td colSpan={3} />
                      </tr>
                    );
                  })
                )}
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { BadgeCheck, KeyRound, Moon, Pencil, Search, UserCog } from 'lucide-react';
import {
  EMPLOYMENT_LABELS,
  LEVEL_LABELS,
  QUALIFICATION_LABELS,
  facilityService
} from '../../services/facilityService';
import { attendanceService } from '../../services/attendanceService';
import { useFacility } from '../../hooks/useFacility';
import type { StaffProfile } from '../../types/facility';

export const StaffIdentity: React.FC = () => {
  useFacility();
  const members = attendanceService.getMembers();
  const shifts = attendanceService.getShifts();
  const skills = facilityService.getSkills();
  const floors = facilityService.getFloors();
  const rules = facilityService.getRules();
  const [query, setQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [editing, setEditing] = useState<{ name: string; profile: StaffProfile } | null>(null);

  const rows = members
    .map((m) => ({ m, p: facilityService.getStaffProfile(m.id), has: facilityService.hasStaffProfile(m.id) }))
    .filter(({ m }) => m.full_name.toLowerCase().includes(query.toLowerCase()) || m.member_number.includes(query))
    .filter(({ p }) => !floorFilter || p.home_floor_id === floorFilter);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const nightCapable = rows.filter(({ p }) => rules.night_shift_id && p.allowed_shift_ids?.includes(rules.night_shift_id));
  const nightCapacity = nightCapable.reduce((s, { p }) => s + (p.max_night_per_month || 0), 0);

  return (
    <div className="kg-page">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Identitas & Kapasitas Staf</h2>
          <p className="view-subtitle">
            Atur level, kualifikasi, skill, shift yang sudah bisa dikerjakan, lantai utama dan batas shift malam per staf.
            Pembuat jadwal hanya menempatkan staf sesuai identitas ini.
          </p>
        </div>
      </div>

      <div className="kg-stat-row">
        <div className="kg-stat">
          <span className="kg-stat-num">{members.length}</span>
          <span className="kg-stat-label">Total staf</span>
        </div>
        <div className="kg-stat">
          <span className="kg-stat-num">{members.filter((m) => facilityService.hasStaffProfile(m.id)).length}</span>
          <span className="kg-stat-label">Identitas lengkap</span>
        </div>
        <div className="kg-stat">
          <span className="kg-stat-num">{nightCapable.length}</span>
          <span className="kg-stat-label">Bisa shift malam</span>
        </div>
        <div className="kg-stat">
          <span className="kg-stat-num">{nightCapacity}</span>
          <span className="kg-stat-label">Kapasitas malam / bulan</span>
        </div>
      </div>

      <div className="filter-toolbar kg-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input placeholder="Cari nama / nomor pegawai" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} aria-label="Filter lantai">
          <option value="">Semua lantai</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {members.length === 0 && (
        <div className="kg-card kg-empty">
          Belum ada staf. Tambahkan di menu "Data Karyawan & QR" atau klik "Muat staf demo" di Profil Fasilitas.
        </div>
      )}

      <div className="kg-staff-grid">
        {rows.map(({ m, p, has }) => (
          <article key={m.id} className={`kg-staff-card ${has ? '' : 'incomplete'}`}>
            <header>
              <div className="kg-avatar">{m.full_name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div>
              <div className="kg-staff-name">
                <b>{m.full_name}</b>
                <span>
                  {m.member_number} · {m.position}
                </span>
              </div>
              <span className={`kg-level kg-level-${p.level}`}>{LEVEL_LABELS[p.level] || `Lv${p.level}`}</span>
            </header>
            <dl className="kg-dl">
              <dt>Kualifikasi</dt>
              <dd>{QUALIFICATION_LABELS[p.qualification]}</dd>
              <dt>Status kerja</dt>
              <dd>{EMPLOYMENT_LABELS[p.employment_type]}</dd>
              <dt>Lantai utama</dt>
              <dd>
                {floors.find((f) => f.id === p.home_floor_id)?.name || '–'} {p.can_float && <span className="kg-muted">(bisa pindah lantai)</span>}
              </dd>
              <dt>Shift</dt>
              <dd className="kg-chip-row">
                {shifts.map((s) => (
                  <span
                    key={s.id}
                    className={`kg-shift-chip ${p.allowed_shift_ids?.includes(s.id) ? '' : 'disabled'}`}
                    style={p.allowed_shift_ids?.includes(s.id) ? { backgroundColor: s.color_code } : undefined}
                    title={s.name}
                  >
                    {s.code}
                  </span>
                ))}
                {rules.night_shift_id && p.allowed_shift_ids?.includes(rules.night_shift_id) && (
                  <span className="kg-muted">
                    <Moon size={12} /> maks {p.max_night_per_month}x
                  </span>
                )}
              </dd>
              <dt>Skill</dt>
              <dd className="kg-chip-row">
                {p.skill_ids?.length ? (
                  p.skill_ids.map((id) => (
                    <span key={id} className="kg-chip">
                      {skills.find((s) => s.id === id)?.name || id}
                    </span>
                  ))
                ) : (
                  <span className="kg-muted">Belum diatur</span>
                )}
              </dd>
            </dl>
            <footer>
              {!has && <span className="kg-warn-text">Identitas belum diatur</span>}
              <span className="kg-muted">Cuti: {p.paid_leave_balance} hari</span>
              <button type="button" className="btn-action-sm" onClick={() => setEditing({ name: m.full_name, profile: structuredClone(p) })}>
                <Pencil size={14} /> Edit
              </button>
            </footer>
          </article>
        ))}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal-card kg-modal kg-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <UserCog size={18} /> Identitas: {editing.name}
              </h3>
              <button type="button" className="btn-close" onClick={() => setEditing(null)} aria-label="Tutup">
                &times;
              </button>
            </div>
            {(() => {
              const p = editing.profile;
              const set = (patch: Partial<StaffProfile>) => setEditing({ ...editing, profile: { ...p, ...patch } });
              return (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Level kemampuan</label>
                      <select value={p.level} onChange={(e) => set({ level: Number(e.target.value) })}>
                        {[1, 2, 3, 4, 5].map((l) => (
                          <option key={l} value={l}>
                            {LEVEL_LABELS[l]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Kualifikasi</label>
                      <select value={p.qualification} onChange={(e) => set({ qualification: e.target.value as StaffProfile['qualification'] })}>
                        {Object.entries(QUALIFICATION_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status kerja</label>
                      <select value={p.employment_type} onChange={(e) => set({ employment_type: e.target.value as StaffProfile['employment_type'] })}>
                        {Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Lantai utama</label>
                      <select value={p.home_floor_id || ''} onChange={(e) => set({ home_floor_id: e.target.value || undefined })}>
                        <option value="">–</option>
                        {floors.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Bisa ditempatkan di lantai lain?</label>
                      <select value={p.can_float ? 'y' : 'n'} onChange={(e) => set({ can_float: e.target.value === 'y' })}>
                        <option value="y">Ya, jika kekurangan staf</option>
                        <option value="n">Tidak</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Shift yang sudah bisa dikerjakan</label>
                    <div className="kg-chip-row">
                      {shifts.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          className={`kg-toggle ${p.allowed_shift_ids.includes(s.id) ? 'on' : ''}`}
                          onClick={() => set({ allowed_shift_ids: toggle(p.allowed_shift_ids, s.id) })}
                        >
                          {s.code} · {s.name} ({s.start_time}–{s.end_time})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <Moon size={13} /> Maks shift malam / bulan
                      </label>
                      <input type="number" min={0} max={15} value={p.max_night_per_month} onChange={(e) => set({ max_night_per_month: Number(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Target libur / bulan</label>
                      <input
                        type="number"
                        min={0}
                        max={31}
                        placeholder={`Default ${rules.monthly_off_days}`}
                        value={p.monthly_off_target ?? ''}
                        onChange={(e) => set({ monthly_off_target: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Sisa cuti berbayar (hari)</label>
                      <input type="number" min={0} value={p.paid_leave_balance} onChange={(e) => set({ paid_leave_balance: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <BadgeCheck size={13} /> Skill & kualifikasi
                    </label>
                    {(['QUALIFICATION', 'CARE', 'OPERATION'] as const).map((cat) => (
                      <div key={cat} className="kg-chip-row kg-skill-pick">
                        {skills
                          .filter((s) => s.category === cat)
                          .map((s) => (
                            <button
                              type="button"
                              key={s.id}
                              className={`kg-toggle ${p.skill_ids.includes(s.id) ? 'on' : ''}`}
                              onClick={() => set({ skill_ids: toggle(p.skill_ids, s.id) })}
                            >
                              {s.name}
                              {s.name_jp && <small> {s.name_jp}</small>}
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>
                        <KeyRound size={13} /> PIN portal member
                      </label>
                      <input inputMode="numeric" maxLength={6} value={p.pin} onChange={(e) => set({ pin: e.target.value.replace(/\D/g, '') })} />
                    </div>
                    <div className="form-group">
                      <label>Catatan atasan</label>
                      <input value={p.notes || ''} onChange={(e) => set({ notes: e.target.value })} placeholder="misal: belum boleh mandi mesin sendiri" />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                      Batal
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={p.pin.length < 4}
                      onClick={() => {
                        facilityService.saveStaffProfile(p);
                        setEditing(null);
                      }}
                    >
                      Simpan identitas
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

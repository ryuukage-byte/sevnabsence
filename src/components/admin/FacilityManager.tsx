import React, { useState } from 'react';
import { Bath, Building, Clock, Layers, Pencil, Plus, RotateCcw, Sparkles, Trash2, Users, Wrench } from 'lucide-react';
import {
  DAY_NAMES,
  FACILITY_TYPES,
  ROOM_CATEGORY_LABELS,
  facilityService,
  uid
} from '../../services/facilityService';
import { attendanceService } from '../../services/attendanceService';
import { useFacility } from '../../hooks/useFacility';
import type { Floor, Room, RoomTask, Skill } from '../../types/facility';

type Editing =
  | { kind: 'floor'; value: Floor }
  | { kind: 'room'; value: Room }
  | { kind: 'task'; value: RoomTask }
  | { kind: 'skill'; value: Skill }
  | null;

export const FacilityManager: React.FC = () => {
  useFacility();
  const profile = facilityService.getProfile();
  const floors = facilityService.getFloors();
  const skills = facilityService.getSkills();
  const shifts = attendanceService.getShifts();
  const [floorId, setFloorId] = useState<string>(floors[0]?.id || '');
  const [editing, setEditing] = useState<Editing>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const activeFloor = floors.find((f) => f.id === floorId) || floors[0];
  const rooms = activeFloor ? facilityService.getRooms(activeFloor.id) : [];
  const skillName = (id: string) => skills.find((s) => s.id === id);
  const shiftOf = (id: string) => shifts.find((s) => s.id === id);

  const save = () => {
    if (!editing) return;
    if (editing.kind === 'floor') facilityService.saveFloor(editing.value);
    if (editing.kind === 'room') facilityService.saveRoom(editing.value);
    if (editing.kind === 'task') facilityService.saveTask(editing.value);
    if (editing.kind === 'skill') facilityService.saveSkill(editing.value);
    if (editing.kind === 'floor') setFloorId(editing.value.id);
    setEditing(null);
  };

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const toggleNum = (list: number[], n: number) => (list.includes(n) ? list.filter((x) => x !== n) : [...list, n].sort());

  const staffCount = attendanceService.getMembers().length;

  return (
    <div className="kg-page">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Profil Fasilitas</h2>
          <p className="view-subtitle">
            Jenis shisetsu, lantai, ruangan, dan tugas per ruangan (jam, shift pelaksana, skill wajib). Data ini dipakai
            oleh Pembuat Jadwal otomatis.
          </p>
        </div>
        <div className="kg-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (confirm('Reset lantai, ruangan, tugas, skill, kebutuhan & shift ke template Tokuyou 2 lantai?')) {
                facilityService.applyKaigoTemplate();
                setFloorId('fl_1');
                setFlash('Template Tokuyou 2 lantai diterapkan (shift 早・日・遅・夜).');
              }
            }}
          >
            <RotateCcw size={15} /> Template 2 lantai
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              const n = facilityService.seedDemoStaff();
              setFlash(n ? `${n} staf demo ditambahkan beserta identitasnya. PIN = 4 digit terakhir nomor pegawai.` : 'Staf demo sudah ada.');
            }}
          >
            <Sparkles size={15} /> Muat staf demo
          </button>
        </div>
      </div>

      {flash && (
        <div className="kg-flash" onClick={() => setFlash(null)}>
          {flash}
        </div>
      )}

      {/* Facility type */}
      <section className="kg-card">
        <h3 className="kg-section-title">
          <Building size={18} /> Pilih jenis shisetsu
        </h3>
        <div className="kg-type-grid">
          {FACILITY_TYPES.map((t) => (
            <button
              type="button"
              key={t.type}
              disabled={!t.available}
              className={`kg-type-card ${profile.facility_type === t.type ? 'active' : ''}`}
              onClick={() => facilityService.updateProfile({ facility_type: t.type })}
            >
              <span className="kg-type-jp">{t.label_jp}</span>
              <span className="kg-type-label">{t.label}</span>
              <span className="kg-type-desc">{t.description}</span>
              {!t.available && <span className="kg-soon">Segera hadir</span>}
            </button>
          ))}
        </div>
        <div className="form-row kg-profile-row">
          <div className="form-group">
            <label>Nama fasilitas</label>
            <input value={profile.facility_name} onChange={(e) => facilityService.updateProfile({ facility_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Kapasitas penghuni</label>
            <input
              type="number"
              min={0}
              value={profile.resident_capacity}
              onChange={(e) => facilityService.updateProfile({ resident_capacity: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="kg-mini-stats">
          <span>
            <Layers size={14} /> {floors.length} lantai
          </span>
          <span>
            <Bath size={14} /> {facilityService.getRooms().length} ruangan
          </span>
          <span>
            <Clock size={14} /> {facilityService.getTasks().length} tugas
          </span>
          <span>
            <Users size={14} /> {staffCount} staf
          </span>
        </div>
      </section>

      {/* Floors & rooms */}
      <section className="kg-card">
        <div className="kg-section-head">
          <h3 className="kg-section-title">
            <Layers size={18} /> Lantai & ruangan
          </h3>
          <button
            type="button"
            className="btn-secondary kg-btn-sm"
            onClick={() =>
              setEditing({ kind: 'floor', value: { id: uid('fl'), level: floors.length + 1, name: `Lantai ${floors.length + 1}` } })
            }
          >
            <Plus size={14} /> Lantai
          </button>
        </div>
        <div className="kg-tabs" role="tablist">
          {floors.map((f) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeFloor?.id === f.id}
              key={f.id}
              className={`kg-tab ${activeFloor?.id === f.id ? 'active' : ''}`}
              onClick={() => setFloorId(f.id)}
            >
              {f.level}F · {f.name}
            </button>
          ))}
        </div>

        {activeFloor && (
          <>
            <div className="kg-floor-head">
              <p className="kg-muted">{activeFloor.description || 'Tanpa deskripsi'}</p>
              <div className="kg-actions">
                <button type="button" className="btn-action-sm" onClick={() => setEditing({ kind: 'floor', value: { ...activeFloor } })}>
                  <Pencil size={14} /> Edit lantai
                </button>
                <button
                  type="button"
                  className="btn-action-sm kg-danger"
                  onClick={() => {
                    if (confirm(`Hapus ${activeFloor.name} beserta ruangan & tugasnya?`)) facilityService.deleteFloor(activeFloor.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  className="btn-primary kg-btn-sm"
                  onClick={() =>
                    setEditing({ kind: 'room', value: { id: uid('rm'), floor_id: activeFloor.id, name: '', category: 'OTHER' } })
                  }
                >
                  <Plus size={14} /> Ruangan
                </button>
              </div>
            </div>

            <div className="kg-room-grid">
              {rooms.length === 0 && <div className="kg-empty">Belum ada ruangan di lantai ini.</div>}
              {rooms.map((room) => {
                const tasks = facilityService.getTasks(room.id);
                return (
                  <article key={room.id} className="kg-room">
                    <header className="kg-room-head">
                      <div>
                        <span className="kg-room-cat">{ROOM_CATEGORY_LABELS[room.category]}</span>
                        <h4>
                          {room.name} {room.name_jp && <small>{room.name_jp}</small>}
                        </h4>
                        {room.resident_count ? <span className="kg-muted">{room.resident_count} penghuni</span> : null}
                        {room.notes && <p className="kg-muted">{room.notes}</p>}
                      </div>
                      <div className="kg-actions">
                        <button type="button" className="btn-action-sm" onClick={() => setEditing({ kind: 'room', value: { ...room } })} aria-label="Edit ruangan">
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-action-sm kg-danger"
                          aria-label="Hapus ruangan"
                          onClick={() => confirm(`Hapus ruangan ${room.name}?`) && facilityService.deleteRoom(room.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </header>

                    <ul className="kg-task-list">
                      {tasks.map((t) => (
                        <li key={t.id} className="kg-task">
                          <div className="kg-task-time">
                            {t.start_time}
                            <span>{t.end_time}</span>
                          </div>
                          <div className="kg-task-body">
                            <span className="kg-task-name">{t.name}</span>
                            <div className="kg-chip-row">
                              {t.shift_ids.map((sid) => {
                                const s = shiftOf(sid);
                                return s ? (
                                  <span key={sid} className="kg-shift-chip" style={{ backgroundColor: s.color_code }}>
                                    {s.code}
                                  </span>
                                ) : null;
                              })}
                              {t.required_skill_ids.map((sk) => (
                                <span key={sk} className="kg-chip">
                                  {skillName(sk)?.name || sk}
                                </span>
                              ))}
                              <span className="kg-chip kg-chip-ghost">min {t.min_staff} org</span>
                              <span className="kg-chip kg-chip-ghost">
                                {t.days_of_week.length === 7 ? 'Setiap hari' : t.days_of_week.map((d) => DAY_NAMES[d]).join(' ')}
                              </span>
                            </div>
                            {t.notes && <span className="kg-muted">{t.notes}</span>}
                          </div>
                          <div className="kg-task-actions">
                            <button type="button" className="btn-action-sm" aria-label="Edit tugas" onClick={() => setEditing({ kind: 'task', value: structuredClone(t) })}>
                              <Pencil size={13} />
                            </button>
                            <button type="button" className="btn-action-sm kg-danger" aria-label="Hapus tugas" onClick={() => facilityService.deleteTask(t.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="kg-add-task"
                      onClick={() =>
                        setEditing({
                          kind: 'task',
                          value: {
                            id: uid('tk'),
                            room_id: room.id,
                            name: '',
                            start_time: '09:00',
                            end_time: '10:00',
                            days_of_week: [0, 1, 2, 3, 4, 5, 6],
                            shift_ids: [],
                            required_skill_ids: [],
                            min_staff: 1
                          }
                        })
                      }
                    >
                      <Plus size={14} /> Tambah tugas / kebutuhan
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Skills master */}
      <section className="kg-card">
        <div className="kg-section-head">
          <h3 className="kg-section-title">
            <Wrench size={18} /> Master skill & kualifikasi
          </h3>
          <button
            type="button"
            className="btn-secondary kg-btn-sm"
            onClick={() => setEditing({ kind: 'skill', value: { id: uid('sk'), code: '', name: '', category: 'CARE' } })}
          >
            <Plus size={14} /> Skill
          </button>
        </div>
        {(['QUALIFICATION', 'CARE', 'OPERATION'] as const).map((cat) => (
          <div key={cat} className="kg-skill-group">
            <span className="kg-label">
              {cat === 'QUALIFICATION' ? 'Kualifikasi / sertifikat' : cat === 'CARE' ? 'Keterampilan perawatan' : 'Operasional'}
            </span>
            <div className="kg-chip-row">
              {skills
                .filter((s) => s.category === cat)
                .map((s) => (
                  <button type="button" key={s.id} className="kg-chip kg-chip-btn" onClick={() => setEditing({ kind: 'skill', value: { ...s } })}>
                    <b>{s.code}</b> {s.name} {s.name_jp && <small>{s.name_jp}</small>}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </section>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal-card kg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editing.kind === 'floor' && 'Lantai'}
                {editing.kind === 'room' && 'Ruangan'}
                {editing.kind === 'task' && 'Tugas ruangan'}
                {editing.kind === 'skill' && 'Skill'}
              </h3>
              <button type="button" className="btn-close" onClick={() => setEditing(null)} aria-label="Tutup">
                &times;
              </button>
            </div>

            {editing.kind === 'floor' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Level</label>
                    <input type="number" value={editing.value.level} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, level: Number(e.target.value) } })} />
                  </div>
                  <div className="form-group">
                    <label>Nama</label>
                    <input value={editing.value.name} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name: e.target.value } })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Deskripsi</label>
                  <textarea rows={2} value={editing.value.description || ''} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, description: e.target.value } })} />
                </div>
              </>
            )}

            {editing.kind === 'room' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nama ruangan</label>
                    <input value={editing.value.name} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name: e.target.value } })} placeholder="Ofuro Besar" />
                  </div>
                  <div className="form-group">
                    <label>Nama Jepang</label>
                    <input value={editing.value.name_jp || ''} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name_jp: e.target.value } })} placeholder="大浴場" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Kategori</label>
                    <select value={editing.value.category} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, category: e.target.value as Room['category'] } })}>
                      {Object.entries(ROOM_CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Jumlah penghuni</label>
                    <input type="number" min={0} value={editing.value.resident_count || 0} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, resident_count: Number(e.target.value) } })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <textarea rows={2} value={editing.value.notes || ''} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, notes: e.target.value } })} />
                </div>
              </>
            )}

            {editing.kind === 'task' && (
              <>
                <div className="form-group">
                  <label>Nama tugas</label>
                  <input value={editing.value.name} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name: e.target.value } })} placeholder="Bantuan mandi pagi" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Dari jam</label>
                    <input type="time" value={editing.value.start_time} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, start_time: e.target.value } })} />
                  </div>
                  <div className="form-group">
                    <label>Sampai jam</label>
                    <input type="time" value={editing.value.end_time} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, end_time: e.target.value } })} />
                  </div>
                  <div className="form-group">
                    <label>Min. staf</label>
                    <input type="number" min={1} value={editing.value.min_staff} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, min_staff: Number(e.target.value) } })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Hari</label>
                  <div className="kg-chip-row">
                    {DAY_NAMES.map((d, i) => (
                      <button
                        type="button"
                        key={d}
                        className={`kg-toggle ${editing.value.days_of_week.includes(i) ? 'on' : ''}`}
                        onClick={() => setEditing({ ...editing, value: { ...editing.value, days_of_week: toggleNum(editing.value.days_of_week, i) } })}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Dikerjakan oleh shift</label>
                  <div className="kg-chip-row">
                    {shifts.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className={`kg-toggle ${editing.value.shift_ids.includes(s.id) ? 'on' : ''}`}
                        onClick={() => setEditing({ ...editing, value: { ...editing.value, shift_ids: toggle(editing.value.shift_ids, s.id) } })}
                      >
                        {s.code} · {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Skill yang dibutuhkan</label>
                  <div className="kg-chip-row">
                    {skills.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className={`kg-toggle ${editing.value.required_skill_ids.includes(s.id) ? 'on' : ''}`}
                        onClick={() =>
                          setEditing({ ...editing, value: { ...editing.value, required_skill_ids: toggle(editing.value.required_skill_ids, s.id) } })
                        }
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan</label>
                  <input value={editing.value.notes || ''} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, notes: e.target.value } })} />
                </div>
              </>
            )}

            {editing.kind === 'skill' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Kode</label>
                    <input value={editing.value.code} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, code: e.target.value.toUpperCase() } })} />
                  </div>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select value={editing.value.category} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, category: e.target.value as Skill['category'] } })}>
                      <option value="QUALIFICATION">Kualifikasi</option>
                      <option value="CARE">Perawatan</option>
                      <option value="OPERATION">Operasional</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nama</label>
                    <input value={editing.value.name} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name: e.target.value } })} />
                  </div>
                  <div className="form-group">
                    <label>Nama Jepang</label>
                    <input value={editing.value.name_jp || ''} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name_jp: e.target.value } })} />
                  </div>
                </div>
              </>
            )}

            <div className="modal-actions">
              {editing.kind === 'skill' && facilityService.getSkills().some((s) => s.id === editing.value.id) && (
                <button
                  type="button"
                  className="btn-secondary kg-danger"
                  onClick={() => {
                    facilityService.deleteSkill(editing.value.id);
                    setEditing(null);
                  }}
                >
                  <Trash2 size={14} /> Hapus
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Batal
              </button>
              <button type="button" className="btn-primary" onClick={save} disabled={!('name' in editing.value) || !editing.value.name.trim()}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  UserPlus,
  QrCode,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit2,
  Upload,
  Trash2,
  User
} from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import type { Member } from '../../types/attendance';
import { PekerjaIDCard } from './PekerjaIDCard';

export const MemberManager: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(attendanceService.getMembers());
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedQRMember, setSelectedQRMember] = useState<Member | null>(null);
  const [confirmRevokeTarget, setConfirmRevokeTarget] = useState<Member | null>(null);

  const addFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const org = attendanceService.getOrganization();

  // Form State for New Member
  const [newMember, setNewMember] = useState({
    member_number: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'Operasional',
    position: 'Staff',
    gender: 'MALE',
    date_of_birth: '1995-10-05',
    is_active: true,
    avatar_url: ''
  });

  // Form State for Editing Member
  const [editFormData, setEditFormData] = useState({
    member_number: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'Operasional',
    position: 'Staff',
    gender: 'MALE',
    date_of_birth: '1995-10-05',
    is_active: true,
    avatar_url: ''
  });

  const departments = Array.from(new Set(members.map((m) => m.department)));

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.member_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || m.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Photo Source Helper
  const getAvatarSrc = (avatarUrl?: string) => {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) return avatarUrl;
    return `${import.meta.env.BASE_URL}${avatarUrl}`;
  };

  // Photo Upload Handler (Supports JPG/PNG/WEBP up to 2MB, stored as base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar resmi (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isEdit) {
        setEditFormData((prev) => ({ ...prev, avatar_url: dataUrl }));
      } else {
        setNewMember((prev) => ({ ...prev, avatar_url: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (isEdit: boolean) => {
    if (isEdit) {
      setEditFormData((prev) => ({ ...prev, avatar_url: '' }));
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    } else {
      setNewMember((prev) => ({ ...prev, avatar_url: '' }));
      if (addFileInputRef.current) addFileInputRef.current.value = '';
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.full_name || !newMember.member_number) return;

    attendanceService.addMember(newMember);
    setMembers([...attendanceService.getMembers()]);
    setShowAddModal(false);
    setNewMember({
      member_number: '',
      full_name: '',
      email: '',
      phone: '',
      department: 'Operasional',
      position: 'Staff',
      gender: 'MALE',
      date_of_birth: '1995-10-05',
      is_active: true,
      avatar_url: ''
    });
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setEditFormData({
      member_number: member.member_number || '',
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      department: member.department || 'Operasional',
      position: member.position || 'Staff',
      gender: member.gender || 'MALE',
      date_of_birth: member.date_of_birth ? member.date_of_birth.replace(/\//g, '-') : '1995-10-05',
      is_active: member.is_active ?? true,
      avatar_url: member.avatar_url || ''
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editFormData.full_name || !editFormData.member_number) return;

    attendanceService.updateMember(editingMember.id, editFormData);
    const updated = [...attendanceService.getMembers()];
    setMembers(updated);

    // If card modal is currently showing this member, sync state
    if (selectedQRMember && selectedQRMember.id === editingMember.id) {
      setSelectedQRMember(updated.find((m) => m.id === editingMember.id) || null);
    }

    setEditingMember(null);
  };

  const handleToggleActive = (member: Member) => {
    attendanceService.updateMember(member.id, { is_active: !member.is_active });
    setMembers([...attendanceService.getMembers()]);
  };

  const handleExecuteRevoke = () => {
    if (!confirmRevokeTarget) return;

    attendanceService.revokeAndIssueNewQR(confirmRevokeTarget.id);
    const updated = [...attendanceService.getMembers()];
    setMembers(updated);
    if (selectedQRMember && selectedQRMember.id === confirmRevokeTarget.id) {
      setSelectedQRMember(updated.find((m) => m.id === confirmRevokeTarget.id) || null);
    }
    if (editingMember && editingMember.id === confirmRevokeTarget.id) {
      const fresh = updated.find((m) => m.id === confirmRevokeTarget.id) || null;
      setEditingMember(fresh);
      if (fresh) {
        setEditFormData((prev) => ({
          ...prev,
          active_token: fresh.active_token
        }));
      }
    }
    setConfirmRevokeTarget(null);
  };

  return (
    <div className="member-manager-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Manajemen Karyawan & Kartu QR</h2>
          <p className="view-subtitle">
            Kelola profil staf, unggah foto resmi, penerbitan kartu identitas berstandar ISO/IEC 7810 ID-1, dan token keamanan.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="filter-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari nama atau NIK/No. Karyawan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select-group">
          <Filter size={18} />
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="ALL">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>No. Karyawan</th>
              <th style={{ minWidth: '220px' }}>Nama Lengkap</th>
              <th style={{ width: '130px' }}>Departemen</th>
              <th style={{ width: '120px' }}>Jabatan</th>
              <th style={{ width: '110px' }}>Status</th>
              <th style={{ width: '160px' }}>Kartu QR Pass</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                  Belum ada data karyawan. Klik &quot;+ Tambah Karyawan&quot; untuk menambahkan staf baru.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td className="font-mono font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {member.member_number}
                  </td>
                  <td>
                    <div className="member-cell-flex">
                      <div className="member-avatar-thumb">
                        {member.avatar_url ? (
                          <img
                            src={getAvatarSrc(member.avatar_url)}
                            alt={member.full_name}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <User size={18} />
                        )}
                      </div>
                      <div className="member-cell">
                        <span className="name-bold">{member.full_name}</span>
                        <span className="email-sub">{member.email || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{member.department}</td>
                  <td>{member.position}</td>
                  <td>
                    <button
                      className={`status-toggle-btn ${member.is_active ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleActive(member)}
                      title="Klik untuk mengubah status aktif/non-aktif"
                    >
                      {member.is_active ? (
                        <>
                          <CheckCircle size={14} /> Aktif
                        </>
                      ) : (
                        <>
                          <XCircle size={14} /> Non-Aktif
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-qr-view"
                      onClick={() => setSelectedQRMember(member)}
                      title="Cetak Kartu QR Pekerja"
                    >
                      <QrCode size={15} />
                      <span>Cetak Kartu QR</span>
                    </button>
                  </td>
                  <td>
                    <div className="member-actions-group" style={{ justifyContent: 'center' }}>
                      <button
                        className="btn-edit-member"
                        onClick={() => handleOpenEdit(member)}
                        title="Ubah data profil, foto & token karyawan"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------------------------------------------------
          ADD MEMBER MODAL (With Photo Upload)
          ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>Tambah Karyawan Baru</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddMember} className="modal-form">
              {/* Photo Uploader */}
              <div className="photo-uploader-box">
                <div className="photo-uploader-preview">
                  {newMember.avatar_url ? (
                    <img src={getAvatarSrc(newMember.avatar_url)} alt="Foto Karyawan" />
                  ) : (
                    <User size={30} />
                  )}
                </div>
                <div className="photo-uploader-info">
                  <span className="photo-uploader-label">Foto Resmi Karyawan</span>
                  <span className="photo-uploader-hint">
                    Format JPG, PNG, atau WEBP (maks. 2MB). Foto akan dicetak pada Kartu Identitas Pegawai (rasio 4:5).
                  </span>
                  <div className="photo-uploader-buttons">
                    <input
                      type="file"
                      ref={addFileInputRef}
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoUpload(e, false)}
                    />
                    <button
                      type="button"
                      className="btn-upload-trigger"
                      onClick={() => addFileInputRef.current?.click()}
                    >
                      <Upload size={13} />
                      <span>{newMember.avatar_url ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    </button>
                    {newMember.avatar_url && (
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => handleRemovePhoto(false)}
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Nomor Induk Karyawan (NIK) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: EMP005"
                    value={newMember.member_number}
                    onChange={(e) =>
                      setNewMember({ ...newMember, member_number: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap staf"
                    value={newMember.full_name}
                    onChange={(e) =>
                      setNewMember({ ...newMember, full_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Departemen</label>
                  <input
                    type="text"
                    required
                    placeholder="Operasional"
                    value={newMember.department}
                    onChange={(e) =>
                      setNewMember({ ...newMember, department: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Jabatan</label>
                  <input
                    type="text"
                    placeholder="Staff / Koordinator"
                    value={newMember.position}
                    onChange={(e) =>
                      setNewMember({ ...newMember, position: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Jenis Kelamin</label>
                  <select
                    value={newMember.gender}
                    onChange={(e) =>
                      setNewMember({ ...newMember, gender: e.target.value })
                    }
                  >
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Tanggal Lahir</label>
                  <input
                    type="date"
                    value={newMember.date_of_birth}
                    onChange={(e) =>
                      setNewMember({ ...newMember, date_of_birth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newMember.email}
                    onChange={(e) =>
                      setNewMember({ ...newMember, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>No. HP / WhatsApp (Opsional)</label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={newMember.phone}
                    onChange={(e) =>
                      setNewMember({ ...newMember, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan & Terbitkan QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          EDIT MEMBER MODAL (With Photo Upload & All Master Data)
          ------------------------------------------------------------- */}
      {editingMember && (
        <div className="modal-backdrop" onClick={() => setEditingMember(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3>Edit Data & Foto Karyawan</h3>
              <button className="btn-close" onClick={() => setEditingMember(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              {/* Photo Uploader */}
              <div className="photo-uploader-box">
                <div className="photo-uploader-preview">
                  {editFormData.avatar_url ? (
                    <img src={getAvatarSrc(editFormData.avatar_url)} alt="Foto Karyawan" />
                  ) : (
                    <User size={30} />
                  )}
                </div>
                <div className="photo-uploader-info">
                  <span className="photo-uploader-label">Foto Resmi Karyawan</span>
                  <span className="photo-uploader-hint">
                    Format JPG, PNG, atau WEBP (maks. 2MB). Foto akan dicetak pada Kartu Identitas Pegawai (rasio 4:5).
                  </span>
                  <div className="photo-uploader-buttons">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoUpload(e, true)}
                    />
                    <button
                      type="button"
                      className="btn-upload-trigger"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <Upload size={13} />
                      <span>{editFormData.avatar_url ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    </button>
                    {editFormData.avatar_url && (
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => handleRemovePhoto(true)}
                      >
                        <Trash2 size={13} />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Nomor Induk Karyawan (NIK) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: EMP001"
                    value={editFormData.member_number}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, member_number: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap staf"
                    value={editFormData.full_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, full_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Departemen</label>
                  <input
                    type="text"
                    required
                    placeholder="Operasional"
                    value={editFormData.department}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, department: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Jabatan</label>
                  <input
                    type="text"
                    placeholder="Staff / Koordinator"
                    value={editFormData.position}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, position: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Jenis Kelamin</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, gender: e.target.value })
                    }
                  >
                    <option value="MALE">Laki-laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editFormData.date_of_birth}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, date_of_birth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 0 }}>
                  <label>No. HP / WhatsApp (Opsional)</label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status Kepegawaian</label>
                <select
                  value={editFormData.is_active ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      is_active: e.target.value === 'ACTIVE'
                    })
                  }
                >
                  <option value="ACTIVE">Aktif (Dapat Presensi di Kiosk)</option>
                  <option value="INACTIVE">Non-Aktif (Akses Presensi Diblokir)</option>
                </select>
              </div>

              {/* Token Keamanan / Ganti Token QR */}
              <div className="token-security-box">
                <div className="token-security-info">
                  <span className="token-security-title">Keamanan Kartu & Token QR</span>
                  <span className="token-security-desc">
                    Jika kartu fisik hilang atau perlu diganti, klik Ganti Token untuk membatalkan akses kartu lama dan menerbitkan kode baru.
                  </span>
                  <div className="token-current-display">
                    <span className="token-label">Token Aktif:</span>
                    <code className="token-code">
                      {editingMember.active_token ? `${editingMember.active_token.slice(0, 10)}...` : 'Belum dibuat'}
                    </code>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-revoke-qr"
                  onClick={() => setConfirmRevokeTarget(editingMember)}
                  title="Cabut akses kartu lama dan terbitkan token baru"
                >
                  <RefreshCw size={13} />
                  <span>Ganti Token</span>
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingMember(null)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          STANDARD PEKERJA PHYSICAL ID CARD MODAL (99% Replica)
          ------------------------------------------------------------- */}
      {selectedQRMember && (
        <PekerjaIDCard
          member={selectedQRMember}
          org={org}
          onClose={() => setSelectedQRMember(null)}
          onRequestRevoke={(m) => setConfirmRevokeTarget(m)}
          onEditMember={(m) => handleOpenEdit(m)}
        />
      )}

      {/* -------------------------------------------------------------
          CONFIRMATION DIALOG FOR REVOKING TOKEN
          ------------------------------------------------------------- */}
      {confirmRevokeTarget && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 'calc(var(--z-modal) + 20)' }}
          onClick={() => setConfirmRevokeTarget(null)}
        >
          <div className="modal-card modal-confirm-danger" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-terracotta)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} /> Cabut & Ganti Kartu QR?
              </h3>
              <button className="btn-close" onClick={() => setConfirmRevokeTarget(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body-pad">
              <p>
                Anda akan mencabut akses kartu QR milik <strong>{confirmRevokeTarget.full_name}</strong> ({confirmRevokeTarget.member_number}).
              </p>
              <p style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Kartu fisik atau digital lama akan <strong>seketika diblokir</strong> dan tidak lagi dapat digunakan di Kiosk. Sistem akan menghasilkan token acak baru.
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmRevokeTarget(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={handleExecuteRevoke}
              >
                Ya, Cabut & Terbitkan Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

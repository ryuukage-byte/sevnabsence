import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  QrCode,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { attendanceService } from '../../services/attendanceService';
import type { Member } from '../../types/attendance';

export const MemberManager: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(attendanceService.getMembers());
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedQRMember, setSelectedQRMember] = useState<Member | null>(null);
  const [confirmRevokeTarget, setConfirmRevokeTarget] = useState<Member | null>(null);

  const org = attendanceService.getOrganization();

  // Form State for New Member
  const [newMember, setNewMember] = useState({
    member_number: '',
    full_name: '',
    email: '',
    phone: '',
    department: 'Operasional',
    position: 'Staff',
    is_active: true
  });

  const departments = Array.from(new Set(members.map((m) => m.department)));

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.member_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || m.department === deptFilter;
    return matchesSearch && matchesDept;
  });

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
      is_active: true
    });
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
    setConfirmRevokeTarget(null);
  };

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div className="member-manager-container">
      <div className="admin-view-header">
        <div>
          <h2 className="view-title">Manajemen Karyawan & Kartu QR</h2>
          <p className="view-subtitle">
            Kelola profil staf, penerbitan kartu identitas berstandar ISO/IEC 7810 ID-1, dan pencabutan token.
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
              <th style={{ minWidth: '180px' }}>Nama Lengkap</th>
              <th style={{ width: '140px' }}>Departemen</th>
              <th style={{ width: '130px' }}>Jabatan</th>
              <th style={{ width: '110px' }}>Status</th>
              <th style={{ width: '160px' }}>Kartu QR Pass</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Keamanan</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td className="font-mono font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {member.member_number}
                </td>
                <td>
                  <div className="member-cell">
                    <span className="name-bold">{member.full_name}</span>
                    <span className="email-sub">{member.email || '-'}</span>
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
                    title="Buka pratinjau kartu ID dan cetak"
                  >
                    <QrCode size={15} />
                    <span>Lihat & Cetak ID</span>
                  </button>
                </td>
                <td>
                  <button
                    className="btn-revoke-qr"
                    onClick={() => setConfirmRevokeTarget(member)}
                    title="Cabut akses kartu lama jika hilang / rusak"
                  >
                    <RefreshCw size={13} />
                    <span>Ganti Token</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Tambah Karyawan Baru</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAddMember} className="modal-form">
              <div className="form-group">
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

              <div className="form-group">
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

      {/* Standard Physical ID Card Modal (85.6 x 54 mm ratio) */}
      {selectedQRMember && (
        <div className="modal-backdrop" onClick={() => setSelectedQRMember(null)}>
          <div
            className="modal-card qr-card-modal printable-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <h3>Kartu Identitas Karyawan (ID Pass)</h3>
              <button className="btn-close" onClick={() => setSelectedQRMember(null)}>
                &times;
              </button>
            </div>

            {/* ISO 7810 ID-1 Physical Aspect Ratio Badge (85.6 x 54mm) */}
            <div className="id-card-frame-wrapper">
              <div className="printable-badge id-card-iso-standard" id="printable-id-card">
                <div className="badge-header-top">
                  <div className="badge-brand-chip">
                    <img
                      src="/koji_mascot.png"
                      alt="Koji"
                      style={{ width: 18, height: 18, objectFit: 'contain' }}
                    />
                    <span className="badge-company-name">{org.display_name}</span>
                  </div>
                  <span className="badge-type-pill">OFFICIAL PASS</span>
                </div>

                <div className="badge-body-grid">
                  <div className="qr-container-box">
                    {selectedQRMember.active_token && (
                      <QRCodeSVG
                        value={selectedQRMember.active_token}
                        size={120}
                        level="H"
                        includeMargin={false}
                      />
                    )}
                  </div>

                  <div className="badge-profile-section">
                    <h3 className="badge-profile-name">{selectedQRMember.full_name}</h3>
                    <div className="badge-profile-number">{selectedQRMember.member_number}</div>
                    <div className="badge-profile-dept">
                      {selectedQRMember.department} • {selectedQRMember.position}
                    </div>
                  </div>
                </div>

                <div className="badge-footer-bottom">
                  <span className="badge-token-preview">
                    SECURE TOKEN: {selectedQRMember.active_token?.substring(0, 14)}...
                  </span>
                  <span className="badge-branch-tag">{org.branch_name}</span>
                </div>
              </div>
            </div>

            {/* Separate Actions: Primary Print vs Destructive Revoke */}
            <div className="id-card-modal-actions">
              <button type="button" className="btn-primary btn-print-hero" onClick={handlePrintBadge}>
                <Printer size={16} />
                <span>Cetak Kartu ID (Ukuran Standar)</span>
              </button>

              <div className="id-card-secondary-row">
                <button
                  type="button"
                  className="btn-revoke-subtle"
                  onClick={() => setConfirmRevokeTarget(selectedQRMember)}
                >
                  <ShieldAlert size={14} />
                  <span>Cabut & Terbitkan Ulang Token</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedQRMember(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Revoking Token */}
      {confirmRevokeTarget && (
        <div className="modal-backdrop" onClick={() => setConfirmRevokeTarget(null)}>
          <div className="modal-card modal-confirm-danger" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-copper)', display: 'flex', alignItems: 'center', gap: 8 }}>
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
              <p style={{ marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
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

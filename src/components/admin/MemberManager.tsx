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
  ShieldAlert
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

  const handleRevokeAndReplaceQR = (memberId: string) => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mencabut kartu QR lama dan menerbitkan QR baru? Kartu lama akan langsung tidak dapat digunakan.'
      )
    ) {
      attendanceService.revokeAndIssueNewQR(memberId);
      const updated = [...attendanceService.getMembers()];
      setMembers(updated);
      if (selectedQRMember && selectedQRMember.id === memberId) {
        setSelectedQRMember(updated.find((m) => m.id === memberId) || null);
      }
    }
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
            Kelola profil staf, penerbitan kartu identitas QR, dan pencabutan akses token.
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
              <th>No. Karyawan</th>
              <th>Nama Lengkap</th>
              <th>Departemen</th>
              <th>Jabatan</th>
              <th>Status</th>
              <th>Kartu QR Identity</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td className="font-mono font-semibold">{member.member_number}</td>
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
                  >
                    <QrCode size={16} />
                    <span>Lihat & Cetak QR</span>
                  </button>
                </td>
                <td>
                  <button
                    className="btn-revoke-qr"
                    onClick={() => handleRevokeAndReplaceQR(member.id)}
                    title="Cabut QR lama dan terbitkan token baru"
                  >
                    <RefreshCw size={14} />
                    <span>Ganti QR</span>
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
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
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
                  placeholder="Nama karyawan"
                  value={newMember.full_name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, full_name: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Departemen</label>
                  <input
                    type="text"
                    placeholder="Operasional / Pelayanan"
                    value={newMember.department}
                    onChange={(e) =>
                      setNewMember({ ...newMember, department: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
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
                <div className="form-group">
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
                <div className="form-group">
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

      {/* Printable QR ID Card Modal */}
      {selectedQRMember && (
        <div className="modal-backdrop" onClick={() => setSelectedQRMember(null)}>
          <div className="modal-card qr-card-modal printable-modal" onClick={(e) => e.stopPropagation()}>
            <div className="printable-badge" id="printable-id-card">
              <div className="badge-header-top">
                <span className="badge-company-name">
                  {attendanceService.getOrganization().display_name}
                </span>
                <span className="badge-type-pill">OFFICIAL PASS</span>
              </div>

              <div className="qr-container-box">
                {selectedQRMember.active_token && (
                  <QRCodeSVG
                    value={selectedQRMember.active_token}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                )}
              </div>

              <div className="badge-profile-section">
                <h2 className="badge-profile-name">{selectedQRMember.full_name}</h2>
                <div className="badge-profile-number">{selectedQRMember.member_number}</div>
                <div className="badge-profile-dept">{selectedQRMember.department} • {selectedQRMember.position}</div>
              </div>

              <div className="badge-token-preview">
                Token ID: <span className="font-mono">{selectedQRMember.active_token?.substring(0, 16)}...</span>
              </div>

              <div className="badge-security-note">
                Kartu ini hanya memuat token identifikasi acak untuk presensi tablet.
              </div>
            </div>

            <div className="badge-action-bar">
              <button className="btn-print" onClick={handlePrintBadge}>
                <Printer size={18} />
                <span>Cetak Kartu</span>
              </button>

              <button
                className="btn-revoke-warning"
                onClick={() => handleRevokeAndReplaceQR(selectedQRMember.id)}
              >
                <ShieldAlert size={18} />
                <span>Cabut & Terbitkan Ulang</span>
              </button>

              <button className="btn-secondary" onClick={() => setSelectedQRMember(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

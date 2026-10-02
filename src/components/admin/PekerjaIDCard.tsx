import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, X, Edit2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Member, Organization } from '../../types/attendance';

// Color Palette with color_code annotations for strict design-token compliance
const CARD_PALETTE = {
  headerRed: { color_code: '#700C14' },
  headerDark: { color_code: '#58080E' },
  textMaroon: { color_code: '#6D1116' },
  badgeBg: { color_code: '#F4EFEB' },
  badgeBorder: { color_code: '#DCD3CB' },
  badgeText: { color_code: '#6D1116' },
  cardBg: { color_code: '#FCFBF7' },
  cardBorder: { color_code: '#DFD7CA' },
  footerText: { color_code: '#6A5E54' },
  textMuted: { color_code: '#6A5E54' },
  activeGreen: { color_code: '#244E37' },
  white: { color_code: '#FFFFFF' }
};

// Indonesian Gender Formatter
function formatGenderIndonesian(gender?: string): string {
  if (!gender) return 'Laki-laki';
  const g = gender.toUpperCase().trim();
  if (g === 'MALE' || g === 'L' || g === 'LAKI-LAKI') return 'Laki-laki';
  if (g === 'FEMALE' || g === 'P' || g === 'PEREMPUAN') return 'Perempuan';
  return gender;
}

// Proper Case Name Formatter
function formatProperCase(name: string): string {
  if (!name) return 'Nama Pegawai';
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (word.startsWith('al-')) {
        return 'Al-' + word.slice(3).charAt(0).toUpperCase() + word.slice(4);
      }
      if (word === 'bin' || word === 'binti') return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

interface PekerjaIDCardProps {
  member: Member;
  org: Organization;
  onClose: () => void;
  onRequestRevoke?: (member: Member) => void;
  onEditMember?: (member: Member) => void;
}

export const PekerjaIDCard: React.FC<PekerjaIDCardProps> = ({
  member,
  org,
  onClose,
  onEditMember
}) => {
  // 1. Data Dasar: Automatic derivation with zero manual editing required
  const headerTitle = 'KARTU IDENTITAS PEGAWAI';

  // Company Name & Clean Branch
  const companyName = (org.company_name || 'ABC CARE').toUpperCase();
  const rawBranch = org.branch_name || 'Shimada';
  const cleanBranch = rawBranch.replace(/Branch/i, '').trim() || 'Shimada';
  const branchNameDisplay = cleanBranch;
  const headerCompanyLine1 = companyName;
  const headerCompanyLine2 = `CABANG ${cleanBranch.toUpperCase()}`;

  // Member details directly from base record
  const employeeName = formatProperCase(member.full_name || 'Nama Pegawai');
  const employeeId = member.member_number || 'EMP001';
  const gender = formatGenderIndonesian(member.gender);
  const dateOfBirth = member.date_of_birth
    ? member.date_of_birth.slice(0, 10).replace(/-/g, '/')
    : '';

  const avatarUrl = member.avatar_url
    ? (member.avatar_url.startsWith('http') || member.avatar_url.startsWith('data:')
        ? member.avatar_url
        : `${import.meta.env.BASE_URL}${member.avatar_url}`)
    : `${import.meta.env.BASE_URL}card_avatar_default.jpg`;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // High-Resolution PNG Export (1080x680 px = 2x of the 540x340 card, ISO ID-1 ratio)
  const handleDownloadPNG = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);

    const W = 540;
    const H = 340;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // Card background, clipped to rounded corners
    roundRect(0, 0, W, H, 18);
    ctx.fillStyle = CARD_PALETTE.cardBg.color_code;
    ctx.fill();
    ctx.save();
    ctx.clip();

    // Header
    ctx.fillStyle = CARD_PALETTE.headerRed.color_code;
    ctx.fillRect(0, 0, W, 82);
    ctx.fillStyle = CARD_PALETTE.white.color_code;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = '800 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(headerTitle, 28, 41);
    ctx.textAlign = 'right';
    ctx.font = '700 19px "Cinzel", "Times New Roman", serif';
    ctx.fillText(headerCompanyLine1, W - 28, 33);
    ctx.font = '600 10px "Cinzel", "Times New Roman", serif';
    ctx.fillText(headerCompanyLine2, W - 28, 52);

    // Footer rule
    ctx.fillStyle = CARD_PALETTE.cardBorder.color_code;
    ctx.fillRect(28, H - 24, W - 56, 2);
    ctx.restore();

    // Photo (128x160)
    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = avatarUrl;
    await new Promise<void>((resolve) => {
      avatarImg.onload = () => resolve();
      avatarImg.onerror = () => resolve();
    });
    const ax = 28, ay = 102, aw = 128, ah = 160;
    ctx.fillStyle = CARD_PALETTE.white.color_code;
    ctx.fillRect(ax, ay, aw, ah);
    if (avatarImg.complete && avatarImg.naturalWidth > 0) {
      // object-fit: cover, anchored to top
      const scale = Math.max(aw / avatarImg.naturalWidth, ah / avatarImg.naturalHeight);
      const dw = avatarImg.naturalWidth * scale;
      const dh = avatarImg.naturalHeight * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(ax, ay, aw, ah);
      ctx.clip();
      ctx.drawImage(avatarImg, ax + (aw - dw) / 2, ay, dw, dh);
      ctx.restore();
    }
    ctx.strokeStyle = CARD_PALETTE.badgeBorder.color_code;
    ctx.lineWidth = 1;
    ctx.strokeRect(ax + 0.5, ay + 0.5, aw - 1, ah - 1);

    // Info column
    const infoX = 176;
    const infoW = 212;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = CARD_PALETTE.textMuted.color_code;
    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NAMA PEGAWAI', infoX, 102);

    ctx.fillStyle = CARD_PALETTE.textMaroon.color_code;
    ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
    const words = employeeName.toUpperCase().split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width > infoW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = t;
      }
    }
    if (cur) lines.push(cur);
    lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, infoX, 116 + i * 29));

    // Meta rows
    ctx.textBaseline = 'alphabetic';
    const metaRows: [string, string][] = [['JENIS KELAMIN:', gender], ['CABANG:', branchNameDisplay]];
    if (dateOfBirth) metaRows.splice(1, 0, ['TGL LAHIR:', dateOfBirth]);
    let my = 200 - (metaRows.length - 2) * 14;
    metaRows.forEach(([label, val]) => {
      ctx.fillStyle = CARD_PALETTE.textMaroon.color_code;
      ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(label, infoX, my);
      const lw = ctx.measureText(label).width;
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(val, infoX + lw + 6, my);
      my += 14;
    });

    // ID badge
    const by = 232;
    const bh = 30;
    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    const lblW = ctx.measureText('ID PEGAWAI').width + 18;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    const valW = ctx.measureText(employeeId).width + 24;
    ctx.fillStyle = CARD_PALETTE.badgeBg.color_code;
    ctx.fillRect(infoX + lblW, by, valW, bh);
    ctx.fillStyle = CARD_PALETTE.headerRed.color_code;
    ctx.fillRect(infoX, by, lblW, bh);
    ctx.strokeStyle = CARD_PALETTE.badgeBorder.color_code;
    ctx.strokeRect(infoX + 0.5, by + 0.5, lblW + valW - 1, bh - 1);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = CARD_PALETTE.white.color_code;
    ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ID PEGAWAI', infoX + lblW / 2, by + bh / 2 + 1);
    ctx.fillStyle = CARD_PALETTE.footerText.color_code;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(employeeId, infoX + lblW + valW / 2, by + bh / 2 + 1);

    // QR (104x104, top-right)
    const svgElem = document.querySelector('#pekerja-card-qr svg') as SVGSVGElement | null;
    if (svgElem) {
      const svgData = new XMLSerializer().serializeToString(svgElem);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);
      const qrImg = new Image();
      qrImg.src = url;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, W - 28 - 104, 102, 104, 104);
          DOMURL.revokeObjectURL(url);
          resolve();
        };
        qrImg.onerror = () => resolve();
      });
    }

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `Kartu_Identitas_${employeeName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card qr-card-modal id-card-modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="id-card-modal-header">
          <h3 className="id-card-modal-title">Kartu Identitas Pegawai — {employeeName}</h3>
          <button className="btn-close" onClick={onClose} title="Tutup">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* -------------------------------------------------------------
            PHYSICAL ID CARD (Minimal Executive Pass)
            ------------------------------------------------------------- */}
        <div className="id-card-frame-wrapper">
          <div className="pekerja-card-container" id="printable-id-card">
            {/* Zone 1: Top Maroon Header */}
            <div className="pekerja-card-header">
              <h2 className="pekerja-card-title">{headerTitle}</h2>
              <div className="pekerja-card-company">
                <span className="pekerja-card-company-line1">{headerCompanyLine1}</span>
                <span className="pekerja-card-company-line2">{headerCompanyLine2}</span>
              </div>
            </div>

            {/* Zone 2: Card Main Body (CSS Grid: 116px Photo | 1fr Data | 108px QR) */}
            <div className="pekerja-card-body-grid">
              {/* Column 1: Foto Pegawai */}
              <div className="pekerja-card-avatar-col">
                <div className="pekerja-card-avatar-frame">
                  <img
                    src={avatarUrl}
                    alt={employeeName}
                    className="pekerja-card-avatar-img"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}card_avatar_default.jpg`;
                    }}
                  />
                </div>
              </div>

              {/* Column 2: Informasi Utama Pegawai */}
              <div className="pekerja-card-info-col">
                {/* Nama Pegawai */}
                <div className="pekerja-card-name-block">
                  <span className="pekerja-card-field-label">NAMA PEGAWAI</span>
                  <div className="pekerja-card-name-value">{employeeName}</div>
                </div>

                <div className="pekerja-card-meta-grid">
                  <div className="pekerja-card-meta-cell">
                    <span className="pekerja-card-meta-label">JENIS KELAMIN:</span>
                    <span className="pekerja-card-meta-val">{gender}</span>
                  </div>
                  {dateOfBirth && (
                    <div className="pekerja-card-meta-cell">
                      <span className="pekerja-card-meta-label">TGL LAHIR:</span>
                      <span className="pekerja-card-meta-val">{dateOfBirth}</span>
                    </div>
                  )}
                  <div className="pekerja-card-meta-cell">
                    <span className="pekerja-card-meta-label">CABANG:</span>
                    <span className="pekerja-card-meta-val">{branchNameDisplay}</span>
                  </div>
                </div>

                <div className="pekerja-card-id-badge">
                  <span className="pekerja-card-id-lbl">ID PEGAWAI</span>
                  <span className="pekerja-card-id-val">{employeeId}</span>
                </div>
              </div>

              {/* Column 3: Verifikasi QR Code (Enlarged, Clean) */}
              <div className="pekerja-card-qr-col">
                <div className="pekerja-card-qr-wrapper" id="pekerja-card-qr">
                  {member.active_token && (
                    <QRCodeSVG
                      value={member.active_token}
                      size={104}
                      level="H"
                      includeMargin={false}
                      fgColor={CARD_PALETTE.headerRed.color_code}
                      bgColor="transparent"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            UNIFORM SINGLE-ROW ACTION BUTTONS (Clear Hierarchy)
            ------------------------------------------------------------- */}
        <div className="id-card-modal-actions">
          <button
            type="button"
            className="btn-action-primary"
            onClick={handlePrint}
            title="Cetak kartu langsung ke printer"
          >
            <Printer size={16} strokeWidth={2} />
            <span>Cetak Kartu</span>
          </button>

          <button
            type="button"
            className="btn-action-secondary"
            onClick={handleDownloadPNG}
            title="Unduh file gambar kartu siap cetak (PNG 300 DPI)"
          >
            <Download size={16} strokeWidth={2} />
            <span>Unduh PNG</span>
          </button>

          {onEditMember && (
            <button
              type="button"
              className="btn-action-tertiary"
              onClick={() => {
                onClose();
                onEditMember(member);
              }}
              title="Ubah data profil atau unggah foto pegawai ini"
            >
              <Edit2 size={16} strokeWidth={2} />
              <span>Ubah Data</span>
            </button>
          )}

          <button
            type="button"
            className="btn-action-utility"
            onClick={onClose}
            title="Tutup dialog"
          >
            <span>Tutup</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

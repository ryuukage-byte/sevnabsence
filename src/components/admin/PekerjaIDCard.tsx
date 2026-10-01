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

  const avatarUrl = member.avatar_url
    ? (member.avatar_url.startsWith('http') || member.avatar_url.startsWith('data:')
        ? member.avatar_url
        : `${import.meta.env.BASE_URL}${member.avatar_url}`)
    : `${import.meta.env.BASE_URL}card_avatar_default.jpg`;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // High-Resolution PNG Export (1040x620 px at 300 DPI physical card ratio)
  const handleDownloadPNG = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1040;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper: Draw rounded rectangle
    const drawRoundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      fillColor: string,
      strokeColor?: string,
      lineWidth = 1
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    };

    // 1. Draw Card Background
    drawRoundRect(0, 0, 1020, 500, 24, CARD_PALETTE.cardBg.color_code, CARD_PALETTE.cardBorder.color_code, 2);

    // 2. Draw Top Maroon Header Bar (Zone 1)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(1020 - 24, 0);
    ctx.quadraticCurveTo(1020, 0, 1020, 24);
    ctx.lineTo(1020, 115);
    ctx.lineTo(0, 115);
    ctx.lineTo(0, 24);
    ctx.quadraticCurveTo(0, 0, 24, 0);
    ctx.closePath();
    ctx.fillStyle = CARD_PALETTE.headerRed.color_code;
    ctx.fill();
    ctx.restore();

    // 3. Header Texts
    // Left: KARTU IDENTITAS PEGAWAI
    ctx.fillStyle = CARD_PALETTE.white.color_code;
    ctx.font = '800 34px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(headerTitle, 40, 58);

    // Right: ABC CARE / CABANG SHIMADA
    ctx.textAlign = 'right';
    ctx.font = '700 26px "Cinzel", "Times New Roman", serif';
    ctx.fillText(headerCompanyLine1, 980, 46);
    ctx.font = '600 15px "Cinzel", "Times New Roman", serif';
    ctx.fillText(headerCompanyLine2, 980, 78);

    // 4. Zone 2 - Column 1: Foto Pegawai (Exact 4:5 ratio)
    const avatarX = 40;
    const avatarY = 145;
    const avatarW = 232;
    const avatarH = 290;

    const avatarImg = new Image();
    avatarImg.crossOrigin = 'anonymous';
    avatarImg.src = avatarUrl;

    await new Promise<void>((resolve) => {
      avatarImg.onload = () => resolve();
      avatarImg.onerror = () => resolve();
    });

    ctx.save();
    drawRoundRect(
      avatarX,
      avatarY,
      avatarW,
      avatarH,
      16,
      CARD_PALETTE.white.color_code,
      CARD_PALETTE.badgeBorder.color_code,
      2
    );
    ctx.clip();
    if (avatarImg.complete && avatarImg.naturalWidth > 0) {
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarW, avatarH);
    }
    ctx.restore();

    // Re-stroke subtle border around avatar
    drawRoundRect(avatarX, avatarY, avatarW, avatarH, 16, '', CARD_PALETTE.badgeBorder.color_code, 2);

    // 5. Zone 2 - Column 2: Data Pegawai
    const infoX = 304;

    // Label: NAMA PEGAWAI
    ctx.fillStyle = CARD_PALETTE.textMuted.color_code;
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('NAMA PEGAWAI', infoX, 155);

    // Value: Nama Karyawan
    ctx.fillStyle = CARD_PALETTE.textMaroon.color_code;
    ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(employeeName, infoX, 180);

    // Badge: ID PEGAWAI (Administrative Maroon Header & Warm Value)
    const badgeY = 240;
    drawRoundRect(infoX, badgeY, 126, 36, 6, CARD_PALETTE.headerRed.color_code, CARD_PALETTE.badgeBorder.color_code, 1);
    ctx.fillStyle = CARD_PALETTE.white.color_code;
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ID PEGAWAI', infoX + 63, badgeY + 9);

    drawRoundRect(infoX + 126, badgeY, 144, 36, 6, CARD_PALETTE.badgeBg.color_code, CARD_PALETTE.badgeBorder.color_code, 1);
    ctx.fillStyle = CARD_PALETTE.footerText.color_code;
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.fillText(employeeId, infoX + 198, badgeY + 7);

    // 2-Field Metadata: JENIS KELAMIN & CABANG
    ctx.textAlign = 'left';
    const metaY = 320;
    const col2X = infoX + 220;

    // JENIS KELAMIN
    ctx.fillStyle = CARD_PALETTE.textMuted.color_code;
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('JENIS KELAMIN', infoX, metaY);
    ctx.fillStyle = CARD_PALETTE.textMaroon.color_code;
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(gender, infoX, metaY + 24);

    // CABANG
    ctx.fillStyle = CARD_PALETTE.textMuted.color_code;
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CABANG', col2X, metaY);
    ctx.fillStyle = CARD_PALETTE.textMaroon.color_code;
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(branchNameDisplay, col2X, metaY + 24);

    // 6. Zone 2 - Column 3: Verifikasi QR Code (Significantly Larger, Clean)
    const qrColX = 890;
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
          ctx.drawImage(qrImg, qrColX - 100, 190, 200, 200);
          DOMURL.revokeObjectURL(url);
          resolve();
        };
        qrImg.onerror = () => resolve();
      });
    }

    // Download PNG
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
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

                {/* ID Pegawai Badge (Refined Administrative Style) */}
                <div className="pekerja-card-id-badge">
                  <span className="pekerja-card-id-lbl">ID PEGAWAI</span>
                  <span className="pekerja-card-id-val">{employeeId}</span>
                </div>

                {/* 2-Field Minimal Metadata Grid */}
                <div className="pekerja-card-meta-grid">
                  <div className="pekerja-card-meta-cell">
                    <span className="pekerja-card-meta-label">JENIS KELAMIN</span>
                    <span className="pekerja-card-meta-val">{gender}</span>
                  </div>

                  <div className="pekerja-card-meta-cell">
                    <span className="pekerja-card-meta-label">CABANG</span>
                    <span className="pekerja-card-meta-val">{branchNameDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Verifikasi QR Code (Enlarged, Clean) */}
              <div className="pekerja-card-qr-col">
                <div className="pekerja-card-qr-wrapper" id="pekerja-card-qr">
                  {member.active_token && (
                    <QRCodeSVG
                      value={member.active_token}
                      size={96}
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

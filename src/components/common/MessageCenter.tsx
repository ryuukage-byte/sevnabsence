import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bell, Inbox, Megaphone, MessageSquare, PenSquare, Send, Settings2 } from 'lucide-react';
import { facilityService } from '../../services/facilityService';
import { attendanceService } from '../../services/attendanceService';
import { useFacility } from '../../hooks/useFacility';
import { ADMIN_SENDER, BROADCAST, type MessageCategory } from '../../types/facility';

const CATEGORY_META: Record<MessageCategory, { label: string; icon: React.ReactNode; tone: string }> = {
  FEEDBACK: { label: 'Masukan', icon: <MessageSquare size={14} />, tone: 'info' },
  WARNING: { label: 'Peringatan', icon: <AlertTriangle size={14} />, tone: 'absent' },
  NOTICE: { label: 'Pemberitahuan', icon: <Megaphone size={14} />, tone: 'late' },
  SYSTEM: { label: 'Sistem', icon: <Settings2 size={14} />, tone: 'present' },
  REPLY: { label: 'Balasan', icon: <MessageSquare size={14} />, tone: 'off' }
};

const FEEDBACK_TOPICS = ['Saran', 'Keluhan', 'Laporan insiden (ヒヤリハット)', 'Pertanyaan jadwal', 'Lainnya'];

interface Props {
  viewer: string; // ADMIN or member id
}

export const MessageCenter: React.FC<Props> = ({ viewer }) => {
  useFacility();
  const isAdmin = viewer === ADMIN_SENDER;
  const members = attendanceService.getMembers();
  const threads = facilityService.getThreads(viewer);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | MessageCategory>('all');
  const [reply, setReply] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // compose form
  const [to, setTo] = useState<string>(isAdmin ? BROADCAST : ADMIN_SENDER);
  const [category, setCategory] = useState<MessageCategory>(isAdmin ? 'NOTICE' : 'FEEDBACK');
  const [topic, setTopic] = useState(FEEDBACK_TOPICS[0]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const nameOf = (id: string) =>
    id === ADMIN_SENDER ? 'Admin / Atasan' : id === BROADCAST ? 'Semua staf' : members.find((m) => m.id === id)?.full_name || 'Staf';

  const filtered = useMemo(
    () =>
      threads.filter((t) => {
        if (filter === 'all') return true;
        if (filter === 'unread') return t.unread > 0;
        return t.root.category === filter;
      }),
    [threads, filter]
  );

  const active = threads.find((t) => t.root.id === activeId);

  const openThread = (id: string) => {
    setActiveId(id);
    setComposing(false);
    setReply('');
    setFeedback(null);
    facilityService.markThreadRead(id, viewer);
  };

  const handleSend = () => {
    const finalSubject = !isAdmin ? `[${topic}] ${subject}` : subject;
    const res = facilityService.sendMessage({
      sender_id: viewer,
      recipient_id: isAdmin ? to : ADMIN_SENDER,
      category: isAdmin ? category : 'FEEDBACK',
      subject: finalSubject,
      body
    });
    setFeedback(res.message);
    if (res.ok) {
      setSubject('');
      setBody('');
      setComposing(false);
    }
  };

  const handleReply = () => {
    if (!active) return;
    // reply goes to the other side of the conversation
    const otherParty = isAdmin
      ? [...active.messages].reverse().find((m) => m.sender_id !== ADMIN_SENDER)?.sender_id || active.root.recipient_id
      : ADMIN_SENDER;
    const res = facilityService.sendMessage({
      sender_id: viewer,
      recipient_id: otherParty,
      category: 'REPLY',
      subject: active.root.subject,
      body: reply,
      thread_id: active.root.id
    });
    if (res.ok) setReply('');
    else setFeedback(res.message);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="kg-inbox">
      <div className="kg-inbox-list">
        <div className="kg-inbox-toolbar">
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter pesan">
            <option value="all">Semua pesan</option>
            <option value="unread">Belum dibaca</option>
            <option value="WARNING">Peringatan</option>
            <option value="NOTICE">Pemberitahuan</option>
            <option value="FEEDBACK">Masukan</option>
            <option value="SYSTEM">Sistem</option>
          </select>
          <button
            type="button"
            className="btn-primary kg-btn-sm"
            onClick={() => {
              setComposing(true);
              setActiveId(null);
              setFeedback(null);
            }}
          >
            <PenSquare size={15} /> {isAdmin ? 'Tulis' : 'Kirim masukan'}
          </button>
        </div>
        {filtered.length === 0 && (
          <div className="kg-empty">
            <Inbox size={28} />
            <span>Belum ada pesan.</span>
          </div>
        )}
        {filtered.map((t) => {
          const meta = CATEGORY_META[t.root.category];
          const counterpart = isAdmin
            ? t.root.sender_id === ADMIN_SENDER
              ? `Ke: ${nameOf(t.root.recipient_id)}`
              : `Dari: ${nameOf(t.root.sender_id)}`
            : t.root.sender_id === viewer
              ? 'Ke: Admin / Atasan'
              : 'Dari: Admin / Atasan';
          return (
            <button
              key={t.root.id}
              type="button"
              className={`kg-thread-item ${activeId === t.root.id ? 'active' : ''} ${t.unread ? 'unread' : ''}`}
              onClick={() => openThread(t.root.id)}
            >
              <div className="kg-thread-top">
                <span className={`status-pill status-pill--${meta.tone}`}>
                  {meta.icon} {meta.label}
                </span>
                <span className="kg-thread-time">{fmt(t.last.created_at)}</span>
              </div>
              <span className="kg-thread-subject">{t.root.subject}</span>
              <span className="kg-thread-meta">
                {counterpart} · {t.messages.length} pesan
              </span>
              <span className="kg-thread-preview">{t.last.body}</span>
              {t.unread > 0 && <span className="kg-unread-dot">{t.unread}</span>}
            </button>
          );
        })}
      </div>

      <div className="kg-inbox-view">
        {feedback && <div className="kg-flash">{feedback}</div>}
        {composing && (
          <div className="kg-compose">
            <h3 className="kg-section-title">
              <Send size={18} /> {isAdmin ? 'Pesan baru ke staf' : 'Kirim masukan ke atasan'}
            </h3>
            {isAdmin ? (
              <div className="form-row">
                <div className="form-group">
                  <label>Penerima</label>
                  <select value={to} onChange={(e) => setTo(e.target.value)}>
                    <option value={BROADCAST}>Semua staf (broadcast)</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} · {m.department}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Jenis</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as MessageCategory)}>
                    <option value="NOTICE">Pemberitahuan</option>
                    <option value="WARNING">Peringatan</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>Topik</label>
                <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {FEEDBACK_TOPICS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Judul</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ringkas, misal: Kursi roda di Lt.2 rusak" />
            </div>
            <div className="form-group">
              <label>Isi pesan</label>
              <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="kg-actions">
              <button type="button" className="btn-secondary" onClick={() => setComposing(false)}>
                Batal
              </button>
              <button type="button" className="btn-primary" onClick={handleSend}>
                <Send size={15} /> Kirim
              </button>
            </div>
          </div>
        )}

        {!composing && active && (
          <div className="kg-thread">
            <div className="kg-thread-header">
              <span className={`status-pill status-pill--${CATEGORY_META[active.root.category].tone}`}>
                {CATEGORY_META[active.root.category].icon} {CATEGORY_META[active.root.category].label}
              </span>
              <h3>{active.root.subject}</h3>
            </div>
            <div className="kg-bubbles">
              {active.messages.map((m) => (
                <div key={m.id} className={`kg-bubble ${m.sender_id === viewer ? 'mine' : ''}`}>
                  <div className="kg-bubble-meta">
                    {nameOf(m.sender_id)}
                    {isAdmin && m.recipient_id === BROADCAST && ' → Semua staf'}
                    <span>{fmt(m.created_at)}</span>
                  </div>
                  <div className="kg-bubble-body">{m.body}</div>
                  {isAdmin && m.sender_id === ADMIN_SENDER && m.recipient_id === BROADCAST && (
                    <div className="kg-bubble-read">Dibaca {Math.max(0, m.read_by.length - 1)} / {members.length} staf</div>
                  )}
                  {isAdmin && m.sender_id === ADMIN_SENDER && m.recipient_id !== BROADCAST && (
                    <div className="kg-bubble-read">{m.read_by.includes(m.recipient_id) ? '✓ Sudah dibaca' : 'Belum dibaca'}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="kg-reply">
              <textarea
                rows={2}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Tulis balasan…"
                aria-label="Balasan"
              />
              <button type="button" className="btn-primary" onClick={handleReply} disabled={!reply.trim()}>
                <Send size={15} /> Balas
              </button>
            </div>
          </div>
        )}

        {!composing && !active && (
          <div className="kg-empty kg-empty-tall">
            <Bell size={30} />
            <span>Pilih pesan di sebelah kiri, atau {isAdmin ? 'tulis pemberitahuan baru' : 'kirim masukan ke atasan'}.</span>
          </div>
        )}
      </div>
    </div>
  );
};

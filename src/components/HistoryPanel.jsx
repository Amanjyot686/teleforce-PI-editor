import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { formatDate, formatINR } from '../utils/invoice.js';

export default function HistoryPanel({ history, onClose, onOpen, onCopy, onDelete }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const rows = q
    ? history.filter((h) =>
        [h.companyName, h.piNumber, h.gstin].some((v) => (v || '').toLowerCase().includes(q)),
      )
    : history;

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-label="PI history">
        <div className="drawer-head">
          <div>
            <h2>Downloaded PIs</h2>
            <p className="muted">Saved in this browser. Open to edit, or copy a buyer into a new PI.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <input
          className="input drawer-search"
          placeholder="Search by company, PI number or GST No."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="drawer-list">
          {rows.length === 0 && (
            <div className="empty">
              {history.length ? 'No matches.' : 'No PIs downloaded yet. They will appear here after you download one.'}
            </div>
          )}
          {rows.map((h) => (
            <div className="history-item" key={h.piNumber}>
              <div className="history-main">
                <div className="history-company">{h.companyName}</div>
                <div className="history-meta">
                  <span>{h.piNumber}</span>
                  <span>·</span>
                  <span>{formatDate(h.date)}</span>
                </div>
              </div>
              <div className="history-amount">₹ {formatINR(h.grandTotal)}</div>
              <div className="history-actions">
                <button className="btn btn-small" onClick={() => onOpen(h)} title="Open this PI for editing">
                  <Icon name="open" /> Open
                </button>
                <button className="btn btn-small" onClick={() => onCopy(h)} title="New PI for the same buyer & items">
                  <Icon name="copy" /> Copy as new
                </button>
                <button
                  className="icon-btn danger"
                  title="Remove from history"
                  onClick={() => window.confirm(`Remove ${h.piNumber} from history?`) && onDelete(h.piNumber)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

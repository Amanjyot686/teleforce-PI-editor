import { useEffect, useMemo, useRef, useState } from 'react';
import InvoiceDocument from './components/InvoiceDocument.jsx';
import InvoiceForm from './components/InvoiceForm.jsx';
import ScaledPreview from './components/ScaledPreview.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import { PI_PREFIX } from './config/company.js';
import {
  computeTotals,
  detectTaxMode,
  financialYear,
  isValidGSTIN,
  newItem,
  safeFileName,
  todayISO,
  toNumber,
} from './utils/invoice.js';
import Icon from './components/Icon.jsx';
import { addToHistory, loadDraft, loadHistory, removeFromHistory, saveDraft } from './utils/storage.js';

function blankInvoice(piNumber) {
  const date = todayISO();
  return {
    companyName: '',
    address: '',
    gstin: '',
    piNumber: piNumber ?? `${PI_PREFIX}/${financialYear(date)}/`,
    date,
    taxMode: 'AUTO',
    items: [newItem()],
  };
}

// "GA/IT/26-27/001" -> "GA/IT/26-27/002", rolling the FY segment if needed.
function nextPiNumber(last) {
  const fy = financialYear(todayISO());
  if (!last) return `${PI_PREFIX}/${fy}/`;
  const m = /^(.*?)(\d{2}-\d{2})\/(\d+)$/.exec(last.trim());
  if (!m) return `${PI_PREFIX}/${fy}/`;
  const [, head, lastFy, num] = m;
  if (lastFy !== fy) return `${head}${fy}/1`;
  return `${head}${fy}/${String(Number(num) + 1).padStart(num.length, '0')}`;
}

function validate(data) {
  const errors = {};
  if (!data.companyName.trim()) errors.companyName = 'Company name is required';
  if (!data.address.trim()) errors.address = 'Address is required';
  if (!/\/\d+$/.test(data.piNumber.trim())) errors.piNumber = 'PI number must end with a number, e.g. GA/IT/26-27/001';
  if (!data.date) errors.date = 'Date is required';

  const filled = data.items.filter((r) => r.description.trim() || r.qty !== '' || r.rate !== '');
  if (filled.length === 0) errors.items = 'Add at least one particular';
  const rowErrors = {};
  filled.forEach((r) => {
    const e = {};
    if (!r.description.trim()) e.description = 'Required';
    if (!(toNumber(r.qty) > 0)) e.qty = 'Enter quantity';
    if (r.validity !== undefined && !(toNumber(r.validity) > 0)) e.validity = 'Enter months';
    if (r.rate === '' || toNumber(r.rate) < 0) e.rate = 'Enter rate';
    if (Object.keys(e).length) rowErrors[r.id] = e;
  });
  if (Object.keys(rowErrors).length) errors.rows = rowErrors;
  return errors;
}

export default function App() {
  const [data, setData] = useState(() => loadDraft() ?? blankInvoice(nextPiNumber(loadHistory()[0]?.piNumber)));
  const [history, setHistory] = useState(loadHistory);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => saveDraft(data), 300);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const resolvedTaxMode = data.taxMode === 'AUTO' ? detectTaxMode(data.gstin) : data.taxMode;
  const docData = useMemo(() => ({ ...data, taxMode: resolvedTaxMode }), [data, resolvedTaxMode]);
  const totals = useMemo(
    () => computeTotals(data.items, resolvedTaxMode),
    [data.items, resolvedTaxMode],
  );

  const update = (patch) => {
    setData((d) => ({ ...d, ...patch }));
    if (Object.keys(errors).length) setErrors({});
  };

  const handleDownload = async () => {
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setToast({ type: 'error', text: 'Please fix the highlighted fields before downloading.' });
      return;
    }
    setBusy(true);
    try {
      const fileName = safeFileName(data.companyName, 'PI', data.piNumber.replace(/\//g, '-'));
      const { downloadInvoicePdf } = await import('./utils/pdf.js');
      await downloadInvoicePdf(exportRef.current, fileName);
      setHistory(addToHistory(data, totals.grandTotal));
      setToast({
        type: 'success',
        text: `Downloaded ${fileName}.pdf${data.gstin && !isValidGSTIN(data.gstin) ? ' (note: GST No. format looks unusual)' : ''}`,
      });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', text: 'Could not generate the PDF. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const handleNew = () => {
    if (!window.confirm('Start a new blank PI? The current form will be cleared.')) return;
    setData(blankInvoice(nextPiNumber(history[0]?.piNumber)));
    setErrors({});
  };

  const handleLoad = (entry, asCopy) => {
    const { grandTotal, savedAt, ...rest } = entry;
    setData({
      ...rest,
      items: rest.items.map((r) => newItem({ description: r.description, qty: r.qty, validity: r.validity ?? '1', rate: r.rate })),
      ...(asCopy ? { piNumber: nextPiNumber(history[0]?.piNumber), date: todayISO() } : {}),
    });
    setErrors({});
    setShowHistory(false);
    setToast({ type: 'success', text: asCopy ? `Copied ${entry.companyName} into a new PI` : `Opened PI ${entry.piNumber}` });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">PI</div>
          <div>
            <div className="brand-title">Proforma Invoice Builder</div>
            <div className="brand-sub">Teleforce · Garuda Advertising Pvt. Ltd.</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => setShowHistory(true)}>
            <Icon name="history" /> History{history.length ? <span className="pill">{history.length}</span> : null}
          </button>
          <button className="btn btn-ghost" onClick={handleNew}>
            <Icon name="plus" /> New PI
          </button>
          <button className="btn btn-primary" onClick={handleDownload} disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="download" />}
            {busy ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="form-pane">
          <InvoiceForm
            data={data}
            update={update}
            errors={errors}
            totals={totals}
            resolvedTaxMode={resolvedTaxMode}
          />
        </section>

        <section className="preview-pane">
          <div className="preview-label">
            <span>Live preview</span>
            <span className="muted">A4 · exactly what will be downloaded</span>
          </div>
          <ScaledPreview>
            <InvoiceDocument data={docData} />
          </ScaledPreview>
        </section>
      </main>

      {/* Unscaled off-screen copy used for PDF capture */}
      <div className="export-stage" aria-hidden="true">
        <InvoiceDocument data={docData} ref={exportRef} />
      </div>

      {showHistory && (
        <HistoryPanel
          history={history}
          onClose={() => setShowHistory(false)}
          onOpen={(h) => handleLoad(h, false)}
          onCopy={(h) => handleLoad(h, true)}
          onDelete={(pi) => setHistory(removeFromHistory(pi))}
        />
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.text}</div>}
    </div>
  );
}

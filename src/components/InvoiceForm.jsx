import Icon from './Icon.jsx';
import {
  amountInWords,
  formatINR,
  isValidGSTIN,
  newItem,
  rowAmount,
  SELLER_STATE_CODE,
} from '../utils/invoice.js';

function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`field ${error ? 'has-error' : ''} ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

// Allow only digits and a single decimal point while typing.
const numeric = (v) => v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');

export default function InvoiceForm({ data, update, errors, totals, resolvedTaxMode }) {
  const setItem = (id, patch) =>
    update({ items: data.items.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  const removeItem = (id) => {
    const items = data.items.filter((r) => r.id !== id);
    update({ items: items.length ? items : [newItem()] });
  };

  const moveItem = (index, dir) => {
    const items = [...data.items];
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    [items[index], items[j]] = [items[j], items[index]];
    update({ items });
  };

  const duplicateItem = (index) => {
    const items = [...data.items];
    const { description, qty, validity, rate } = items[index];
    items.splice(index + 1, 0, newItem({ description, qty, validity, rate }));
    update({ items });
  };

  const gstin = data.gstin.trim();
  const gstinState =
    !gstin ? null : isValidGSTIN(gstin) ? 'valid' : gstin.length >= 15 ? 'invalid' : 'partial';

  return (
    <div className="form">
      {/* Buyer */}
      <div className="card">
        <div className="card-head">
          <span className="step">1</span>
          <h2>Buyer details</h2>
        </div>
        <div className="grid">
          <Field label="Company name" error={errors.companyName} className="span-2">
            <input
              className="input"
              value={data.companyName}
              placeholder="e.g. ABC TECHNOLOGIES PVT. LTD."
              onChange={(e) => update({ companyName: e.target.value })}
            />
          </Field>
          <Field label="Company address" error={errors.address} className="span-2">
            <textarea
              className="input"
              rows={3}
              value={data.address}
              placeholder="e.g. Office No. 101, Business Park, Main Road, City, State, 400001"
              onChange={(e) => update({ address: e.target.value })}
            />
          </Field>
          <Field
            label="GST number"
            className="span-2"
            error={gstinState === 'invalid' ? 'This doesn’t look like a valid 15-character GSTIN' : null}
            hint={
              gstinState === 'valid'
                ? `✓ Valid GSTIN · ${gstin.slice(0, 2) === SELLER_STATE_CODE ? 'Gujarat buyer (intra-state)' : 'Out-of-state buyer (IGST)'}`
                : '15 characters, e.g. 22AAAAA0000A1Z5'
            }
          >
            <input
              className="input mono"
              value={data.gstin}
              maxLength={15}
              placeholder="22AAAAA0000A1Z5"
              onChange={(e) => update({ gstin: e.target.value.toUpperCase().replace(/\s/g, '') })}
            />
          </Field>
        </div>
      </div>

      {/* Invoice meta */}
      <div className="card">
        <div className="card-head">
          <span className="step">2</span>
          <h2>Invoice details</h2>
        </div>
        <div className="grid">
          <Field label="PI number" error={errors.piNumber} hint="Auto-suggested from your last downloaded PI">
            <input
              className="input mono"
              value={data.piNumber}
              placeholder="GA/IT/26-27/001"
              onChange={(e) => update({ piNumber: e.target.value })}
            />
          </Field>
          <Field label="Date" error={errors.date}>
            <input
              className="input"
              type="date"
              value={data.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          </Field>
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <div className="card-head">
          <span className="step">3</span>
          <h2>Particulars</h2>
          <span className="muted card-head-note">{data.items.length} row{data.items.length > 1 ? 's' : ''}</span>
        </div>
        {errors.items && <div className="banner-error">{errors.items}</div>}

        <div className="items">
          {data.items.map((row, i) => {
            const rowErr = errors.rows?.[row.id] || {};
            return (
              <div className="item" key={row.id}>
                <div className="item-top">
                  <span className="item-sn">SN {i + 1}</span>
                  <div className="item-tools">
                    <button className="icon-btn" title="Move up" onClick={() => moveItem(i, -1)} disabled={i === 0}>
                      <Icon name="up" />
                    </button>
                    <button
                      className="icon-btn"
                      title="Move down"
                      onClick={() => moveItem(i, 1)}
                      disabled={i === data.items.length - 1}
                    >
                      <Icon name="down" />
                    </button>
                    <button className="icon-btn" title="Duplicate row" onClick={() => duplicateItem(i)}>
                      <Icon name="copy" />
                    </button>
                    <button className="icon-btn danger" title="Delete row" onClick={() => removeItem(row.id)}>
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>

                <Field label="Particulars" error={rowErr.description}>
                  <textarea
                    className="input"
                    rows={2}
                    value={row.description}
                    placeholder="e.g. Towards Cost of Basic Plan, Validity From 01/04/2026 to 30/04/2026"
                    onChange={(e) => setItem(row.id, { description: e.target.value })}
                  />
                </Field>

                <div className="item-nums">
                  <Field label="Qnty / Users" error={rowErr.qty}>
                    <input
                      className="input num"
                      inputMode="decimal"
                      value={row.qty}
                      placeholder="10"
                      onChange={(e) => setItem(row.id, { qty: numeric(e.target.value) })}
                    />
                  </Field>
                  <span className="op">×</span>
                  <Field label="Validity (Mo.)" error={rowErr.validity}>
                    <input
                      className="input num"
                      inputMode="decimal"
                      value={row.validity ?? '1'}
                      placeholder="1"
                      onChange={(e) => setItem(row.id, { validity: numeric(e.target.value) })}
                    />
                  </Field>
                  <span className="op">×</span>
                  <Field label="Rate (₹)" error={rowErr.rate}>
                    <input
                      className="input num"
                      inputMode="decimal"
                      value={row.rate}
                      placeholder="1000"
                      onChange={(e) => setItem(row.id, { rate: numeric(e.target.value) })}
                    />
                  </Field>
                  <span className="op">=</span>
                  <div className="field">
                    <span className="field-label">Amount (₹)</span>
                    <div className="amount-box">{formatINR(rowAmount(row))}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-dashed" onClick={() => update({ items: [...data.items, newItem()] })}>
          <Icon name="plus" /> Add particular
        </button>
      </div>

      {/* Summary */}
      <div className="card summary">
        <div className="card-head">
          <span className="step">4</span>
          <h2>Summary</h2>
          <select
            className="input select-small"
            value={data.taxMode}
            onChange={(e) => update({ taxMode: e.target.value })}
            title="Tax type"
          >
            <option value="AUTO">Tax: Auto from GST No.</option>
            <option value="IGST">Tax: IGST 18%</option>
            <option value="CGST_SGST">Tax: CGST 9% + SGST 9%</option>
          </select>
        </div>

        <div className="sum-rows">
          <div className="sum-row">
            <span>Total</span>
            <span>₹ {formatINR(totals.total)}</span>
          </div>
          {resolvedTaxMode === 'IGST' ? (
            <div className="sum-row">
              <span>IGST @ 18%</span>
              <span>₹ {formatINR(totals.tax)}</span>
            </div>
          ) : (
            <>
              <div className="sum-row">
                <span>CGST @ 9%</span>
                <span>₹ {formatINR(totals.cgst)}</span>
              </div>
              <div className="sum-row">
                <span>SGST @ 9%</span>
                <span>₹ {formatINR(totals.sgst)}</span>
              </div>
            </>
          )}
          <div className="sum-row grand">
            <span>Grand Total (Rounded Off)</span>
            <span>₹ {formatINR(totals.grandTotal)}</span>
          </div>
        </div>
        <div className="words">{amountInWords(totals.grandTotal)}</div>
      </div>
    </div>
  );
}

import { forwardRef } from 'react';
import headerImg from '../assets/header.png';
import footerImg from '../assets/footer.png';
import stampImg from '../assets/stamp.png';
import signatureImg from '../assets/digital-signature.png';
import { COMPANY } from '../config/company.js';
import {
  amountInWords,
  computeTotals,
  formatDate,
  formatINR,
  rowAmount,
  rowValidity,
} from '../utils/invoice.js';

// The printable A4 Proforma Invoice. Rendered at 794px wide (A4 @ 96dpi).
const InvoiceDocument = forwardRef(function InvoiceDocument({ data }, ref) {
  const items = data.items.filter((r) => r.description.trim() || r.qty !== '' || r.rate !== '');
  const totals = computeTotals(items, data.taxMode);

  return (
    <div className="pi-page" ref={ref}>
      <img className="pi-header" src={headerImg} alt="" />

      <div className="pi-body">
        <div className="pi-title">Proforma Invoice</div>

        <table className="pi-table">
          <colgroup>
            <col style={{ width: 26 }} />
            <col />
            <col style={{ width: 76 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 88 }} />
            <col style={{ width: 108 }} />
          </colgroup>
          <tbody>
            {/* Buyer block */}
            <tr className="pi-buyer">
              <td colSpan={4} className="pi-buyer-left">
                <div className="pi-bold">Buyer's</div>
                <div className="pi-company">{data.companyName || ' '}</div>
                <div className="pi-address">{data.address}</div>
                <div className="pi-bold pi-gst">GST No.: {data.gstin}</div>
              </td>
              <td colSpan={2} className="pi-buyer-right">
                <div className="pi-bold">PI: {data.piNumber}</div>
                <div className="pi-bold">Date: {formatDate(data.date)}</div>
              </td>
            </tr>

            {/* Items header */}
            <tr className="pi-head">
              <th>SN</th>
              <th>Particulars</th>
              <th>Qnty/Users</th>
              <th>Validity (Months)</th>
              <th>Rate</th>
              <th>Amount (RS)</th>
            </tr>

            {items.map((row, i) => (
              <tr className="pi-item" key={row.id}>
                <td className="pi-c">{i + 1}</td>
                <td className="pi-particular">{row.description}</td>
                <td className="pi-c">{row.qty}</td>
                <td className="pi-c">{rowValidity(row)}</td>
                <td className="pi-r">{row.rate === '' ? '' : formatINR(row.rate)}</td>
                <td className="pi-r">{formatINR(rowAmount(row))}</td>
              </tr>
            ))}

            {/* Totals */}
            <tr className="pi-total-row pi-first-total">
              <td colSpan={2} rowSpan={totals.taxMode === 'IGST' ? 3 : 4} className="pi-words">
                {amountInWords(totals.grandTotal)}
              </td>
              <td colSpan={3} className="pi-c pi-bold">Total</td>
              <td className="pi-r pi-bold">{formatINR(totals.total)}</td>
            </tr>
            {totals.taxMode === 'IGST' ? (
              <tr className="pi-total-row">
                <td colSpan={3} className="pi-c pi-bold">IGST @ 18%</td>
                <td className="pi-r">{formatINR(totals.tax)}</td>
              </tr>
            ) : (
              <>
                <tr className="pi-total-row">
                  <td colSpan={3} className="pi-c pi-bold">CGST @ 9%</td>
                  <td className="pi-r">{formatINR(totals.cgst)}</td>
                </tr>
                <tr className="pi-total-row">
                  <td colSpan={3} className="pi-c pi-bold">SGST @ 9%</td>
                  <td className="pi-r">{formatINR(totals.sgst)}</td>
                </tr>
              </>
            )}
            <tr className="pi-total-row pi-grand">
              <td colSpan={3} className="pi-c pi-bold">Grand Total (Rounded Off)</td>
              <td className="pi-r pi-bold">{formatINR(totals.grandTotal)}</td>
            </tr>

            {/* Constant footer block */}
            <tr>
              <td colSpan={6} className="pi-notes">
                <div className="pi-note-label">Note:</div>
                <div className="pi-neft">NEFT / RTGS - Details</div>
                <div className="pi-bold">Cheque in favour:&nbsp; {COMPANY.bank.chequeInFavour}</div>
                <div className="pi-bold pi-bank-line">
                  <span className="pi-bank-col">Bank :{COMPANY.bank.name}</span>
                  <span>;&nbsp; Branch: {COMPANY.bank.branch}</span>
                </div>
                <div className="pi-bold pi-bank-line">
                  <span className="pi-bank-col">Current A/C . : {COMPANY.bank.account}</span>
                  <span>;&nbsp; IFSC/RTGS : {COMPANY.bank.ifsc}</span>
                </div>
                <div className="pi-ids">
                  <span>(i) PAN: {COMPANY.pan}</span>
                  <span>(ii) GST No. {COMPANY.gstin}</span>
                  <span>(iii) HSN/SAC Code:&nbsp; {COMPANY.hsnSac}</span>
                </div>

                <div className="pi-terms-title">Terms &amp; Conditions</div>
                <ol className="pi-terms">
                  {COMPANY.terms.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>

                <div className="pi-bold pi-eoe">E. &amp; O. E.</div>

                <div className="pi-sign-row">
                  <div className="pi-sign-left">
                    <img className="pi-stamp" src={stampImg} alt="" />
                    <div>Prepared by</div>
                  </div>
                  <div className="pi-sign-right">
                    <div className="pi-bold">{COMPANY.signatoryFor}</div>
                    <div className="pi-dsig-wrap">
                      <img className="pi-dsig" src={signatureImg} alt="" />
                      <span className="pi-auth">Authorised Signatory</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="pi-computer">“This is computer generated invoice no signature required.”</div>
      </div>

      <img className="pi-footer" src={footerImg} alt="" />
    </div>
  );
});

export default InvoiceDocument;

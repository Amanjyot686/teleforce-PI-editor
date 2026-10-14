# Teleforce Proforma Invoice Builder

A React (Vite) web app for the finance team to create Proforma Invoices (PI) in the Garuda Advertising / Teleforce format and download them as PDF. It replaces editing the Excel template by hand.

## Run it

```bash
npm install
npm run dev        # opens http://localhost:5173
```

To deploy, run `npm run build` and host the `dist/` folder on any static web server (Nginx, S3, Netlify, etc.). No backend is needed.

## What the user fills in

| Field | Notes |
|---|---|
| Company name, address, GST No. | Shows whether the GSTIN format is valid |
| PI number | Suggests the next number after the last downloaded PI (e.g. `GA/IT/26-27/001` → `GA/IT/26-27/002`) and moves to the new financial year automatically |
| Date | Printed as `dd/mm/yyyy` |
| Particulars | Any number of rows (SN is automatic). Each row has a description (can be multi-line), quantity/users and rate. Rows can be reordered, duplicated or deleted |

Calculated automatically:

- **Amount** for each row = quantity × rate
- **Total**, **IGST @ 18%**, and **Grand Total (Rounded Off)**
- **Amount in words** in the Indian system (lakh/crore), e.g. `INR- One lakh eighteen thousand rupees only./`
- **Tax type**: IGST by default. If the buyer's GSTIN starts with `24` (Gujarat, the same state as the seller), it switches to CGST 9% + SGST 9%. You can also choose the tax type yourself from the dropdown in the Summary card.

Everything else (header, bank details, PAN/GST, terms, stamp, signature, footer) stays the same on every PI. These values are in [src/config/company.js](src/config/company.js), and the images are in [src/assets/](src/assets/).

## Other features

- **Live A4 preview**: the preview shows exactly what the downloaded PDF will look like.
- **Auto-save**: the form is saved in the browser, so a refresh doesn't lose work.
- **History**: every downloaded PI is saved, so you can reopen it, or use **Copy as new** to start a new PI for the same buyer with the next PI number.
- **Long invoices**: a PI that is slightly too long is shrunk to fit one page. A longer one runs onto more pages, with page breaks only between rows.

> History and drafts are saved in the browser on each computer (localStorage). They are not shared between users or machines.

## Project layout

```
src/
  App.jsx                      app shell, validation, download, history
  components/InvoiceDocument   the printable A4 PI (single source of truth for the layout)
  components/InvoiceForm       the form
  components/HistoryPanel      downloaded-PI history drawer
  config/company.js            constant seller details, bank, terms
  utils/invoice.js             calculations, number-to-words, GSTIN, dates
  utils/pdf.js                 html2canvas + jsPDF export
```

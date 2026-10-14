// Fixed seller details printed on every Proforma Invoice.
// Update here if bank / tax / terms ever change.

export const COMPANY = {
  legalName: 'Garuda Advertising Pvt. Ltd.',
  signatoryFor: 'For GARUDA ADVERTISING PVT. LTD',
  pan: 'AACCG4943R',
  gstin: '24AACCG4943R1Z5',
  hsnSac: '998419/998313',
  bank: {
    chequeInFavour: 'Garuda Advertising Pvt. Ltd.',
    name: 'Punjab National Bank',
    branch: 'Mahipalpur New Delhi-110037',
    account: '0029102100000227',
    ifsc: 'PUNB0002910',
  },
  terms: [
    'Payment 100% Advance.',
    'All payment should be made by crossed cheque or NEFT/RTGS only.',
    'Interest will be charged at the rate of 18% p.a. if the bill is not paid on due date.',
    'All disputes are subject to jurisdiction of Delhi Courts only.',
  ],
};

export const PI_PREFIX = 'GA/IT';

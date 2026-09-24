import { Quotation } from '../types/quotation';
import { SIGNATURE_BASE64 } from '../assets/signatureBase64';

export const generateQuotationHtml = (quotation: Quotation): string => {
  const itemRows = quotation.items
    .map(
      (item) => `
    <tr>
      <td style="text-align: center; border-right: 1px solid #0f2c59; padding: 6px 4px;">${item.srNo}</td>
      <td style="text-align: left; border-right: 1px solid #0f2c59; padding: 6px 8px;">${item.particular}</td>
      <td style="text-align: center; border-right: 1px solid #0f2c59; padding: 6px 4px;">[${item.qty} ${item.qtyUnit}]</td>
      <td style="text-align: center; border-right: 1px solid #0f2c59; padding: 6px 4px;">
        ${item.rate}/-
        ${item.isGst ? '<br/><span style="font-size: 8px; color: #6c757d;">(Including GST)</span>' : ''}
      </td>
      <td style="text-align: center; padding: 6px 4px;">
        ${item.amount}/-
        ${item.isGst ? '<br/><span style="font-size: 8px; color: #6c757d;">(Including GST)</span>' : ''}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quotation - ${quotation.companyDetails.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 10px;
      color: #212529;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-center {
      text-align: center;
      margin-bottom: 8px;
    }
    .company-title {
      font-size: 26px;
      font-weight: 800;
      color: #c00000;
      margin: 0 0 4px 0;
      letter-spacing: 0.5px;
    }
    .company-sub {
      font-size: 11px;
      font-weight: bold;
      color: #0f2c59;
      margin: 2px 0;
      text-transform: uppercase;
    }
    .divider-double {
      border: none;
      border-top: 2px solid #0f2c59;
      border-bottom: 1px solid #0f2c59;
      height: 3px;
      margin: 8px 0 12px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .date-text {
      font-size: 12px;
      font-weight: bold;
      text-align: right;
      width: 100%;
    }
    .title-wrapper {
      text-align: center;
      margin: 10px 0 16px 0;
    }
    .quotation-title {
      font-size: 22px;
      font-weight: bold;
      color: #0f2c59;
      text-decoration: underline;
      letter-spacing: 1px;
      margin: 0;
    }
    .quotation-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #0f2c59;
      font-size: 11px;
    }
    .quotation-table th {
      background-color: #0f2c59 !important;
      color: #ffffff !important;
      padding: 8px 4px;
      font-weight: bold;
      text-align: center;
      border-right: 1px solid #ffffff;
    }
    .quotation-table th:last-child {
      border-right: none;
    }
    .quotation-table td {
      border-bottom: 1px solid #d0d7de;
    }
    .total-row {
      background-color: #d4e3fc !important;
      color: #0f2c59;
      font-weight: bold;
      font-size: 12px;
    }
    .total-row td {
      padding: 8px;
      border-top: 1px solid #0f2c59;
      border-bottom: 1px solid #0f2c59;
    }
    .tax-row td {
      padding: 6px 8px;
      border-top: 1px solid #0f2c59;
    }
    .words-box {
      border: 1px solid #0f2c59;
      border-top: none;
      padding: 6px 8px;
      font-size: 10px;
    }
    .words-label {
      font-weight: bold;
      color: #212529;
    }
    .footer-section {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      font-size: 10px;
      page-break-inside: avoid;
    }
    .bank-box {
      width: 58%;
      color: #0f2c59;
    }
    .bank-box .bank-title {
      font-weight: bold;
      margin-bottom: 4px;
    }
    .bank-box .bank-line {
      color: #212529;
      margin: 2px 0;
    }
    .signature-box {
      width: 38%;
      text-align: center;
    }
    .signature-box .for-company {
      font-weight: bold;
      color: #0f2c59;
      font-size: 10px;
      margin-bottom: 4px;
    }
    .signature-box img {
      max-height: 48px;
      max-width: 120px;
      object-fit: contain;
      margin: 4px 0;
    }
    .sig-line {
      width: 140px;
      margin: 4px auto;
      border-top: 1px solid #212529;
    }
    .proprietor-label {
      font-weight: bold;
      color: #0f2c59;
      font-size: 10px;
      margin-top: 2px;
    }
    .sig-label {
      font-size: 8px;
      color: #6c757d;
    }
    .bottom-tagline {
      text-align: center;
      margin-top: 36px;
      font-size: 9px;
      font-weight: bold;
      color: #0f2c59;
      letter-spacing: 1px;
      border-top: 1px solid #0f2c59;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="header-center">
    <h1 class="company-title">${quotation.companyDetails.name}</h1>
    <div class="company-sub">ADDRESS :- ${quotation.companyDetails.address}</div>
    <div class="company-sub">GST :- ${quotation.companyDetails.gstin}</div>
  </div>

  <div class="divider-double"></div>

  <div class="meta-row">
    <div class="date-text">Date :- ${quotation.date}</div>
  </div>

  <div class="title-wrapper">
    <h2 class="quotation-title">QUOTATION</h2>
  </div>

  <table class="quotation-table">
    <thead>
      <tr>
        <th style="width: 8%;">Sr<br/>No.</th>
        <th style="width: 44%; text-align: left; padding-left: 8px;">Particular</th>
        <th style="width: 16%;">Qty</th>
        <th style="width: 16%;">Rate</th>
        <th style="width: 16%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      
      <tr class="tax-row">
        <td colspan="4" style="text-align: left; padding-left: 8px; border-right: 1px solid #0f2c59;">
          CGST @ ${quotation.cgstRate}%
        </td>
        <td style="text-align: center;">${quotation.cgstAmount}/-</td>
      </tr>
      <tr class="tax-row">
        <td colspan="4" style="text-align: left; padding-left: 8px; border-right: 1px solid #0f2c59;">
          SGST @ ${quotation.sgstRate}%
        </td>
        <td style="text-align: center;">${quotation.sgstAmount}/-</td>
      </tr>

      <tr class="total-row">
        <td colspan="4" style="text-align: left; padding-left: 12px; border-right: 1px solid #0f2c59;">
          TOTAL AMOUNT (Including GST)
        </td>
        <td style="text-align: center;">${quotation.totalAmount}/-</td>
      </tr>
    </tbody>
  </table>

  <div class="words-box">
    <span class="words-label">Amount in Words:</span>
    <span>${quotation.amountInWords}</span>
  </div>

  <div class="footer-section">
    <div class="bank-box">
      <div class="bank-title">BANK DETAILS FOR ${quotation.bankDetails.bankName.toUpperCase()}</div>
      <div class="bank-line">BRANCH: ${quotation.bankDetails.branch.toUpperCase()}</div>
      <div class="bank-line">A/C NO :- ${quotation.bankDetails.accountNumber}</div>
      <div class="bank-line">IFSC CODE :- ${quotation.bankDetails.ifscCode.toUpperCase()}</div>
    </div>

    <div class="signature-box">
      <div class="for-company">For ${quotation.companyDetails.name.toUpperCase()}</div>
      <img src="${SIGNATURE_BASE64}" alt="Signature" />
      <div class="sig-line"></div>
      <div class="proprietor-label">Proprietor</div>
      <div class="sig-label">SIGNATURE</div>
    </div>
  </div>

  <div class="bottom-tagline">
    — THANK YOU FOR YOUR BUSINESS! —
  </div>
</body>
</html>
  `;
};

import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Quotation } from '../models/quotation.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  // Load signature and convert it to Base64 data URL
  private getBase64ImageFromUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg');
          resolve(dataURL);
        } else {
          reject(new Error('Could not create canvas 2D context'));
        }
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = imageUrl;
    });
  }

  async buildPdfDocument(quotation: Quotation, signatureUrl: string = 'signature.jpg'): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color definitions
    const RED = [192, 0, 0];       // #c00000
    const NAVY = [15, 44, 89];     // #0f2c59
    const LIGHT_BLUE = [212, 227, 252]; // #d4e3fc
    const TEXT_DARK = [33, 37, 41];
    const TEXT_MUTED = [108, 117, 125];

    // Page boundaries
    const startX = 15;
    const endX = 195;
    const contentWidth = 180;

    // 1. Header Details (VITHAL HARDWARE)
    doc.setTextColor(RED[0], RED[1], RED[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(quotation.companyDetails.name, 105, 20, { align: 'center' });

    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`ADDRESS :- ${quotation.companyDetails.address.toUpperCase()}`, 105, 26, { align: 'center' });
    doc.text(`GST :- ${quotation.companyDetails.gstin.toUpperCase()}`, 105, 31, { align: 'center' });

    // Double Horizontal Line (Navy Blue)
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(1.0);
    doc.line(startX, 35, endX, 35);
    doc.setLineWidth(0.3);
    doc.line(startX, 36.2, endX, 36.2);

    // 2. Date and Quotation Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(`Date :- ${quotation.date}`, endX, 44, { align: 'right' });

    doc.setFontSize(22);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('QUOTATION', 105, 55, { align: 'center' });
    
    // Draw underline for QUOTATION
    const titleWidth = doc.getTextWidth('QUOTATION');
    doc.setLineWidth(0.8);
    doc.line(105 - (titleWidth / 2), 57, 105 + (titleWidth / 2), 57);

    // 3. Table Layout
    const tableTop = 63;
    const headerHeight = 10;
    const itemsAreaHeight = 72;
    const rowHeight = 8; // Height for each table row
    const cgstTop = tableTop + headerHeight + itemsAreaHeight; // 63 + 10 + 72 = 145
    const sgstTop = cgstTop + 8; // 153
    const totalTop = sgstTop + 8; // 161
    const totalHeight = 10;
    const wordsTop = totalTop + totalHeight; // 171
    const wordsHeight = 12;
    const tableBottom = wordsTop + wordsHeight; // 183

    // Columns:
    // Sr No. (15mm) | Particular (80mm) | Qty (25mm) | Rate (30mm) | Amount (30mm)
    const colX = {
      sr: startX,          // 15
      part: startX + 15,    // 30
      qty: startX + 95,     // 110
      rate: startX + 120,   // 135
      amount: startX + 150, // 165
    };

    // Draw Table Outline and Borders
    doc.setLineWidth(0.4);
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    
    // Outer Borders
    doc.rect(startX, tableTop, contentWidth, tableBottom - tableTop);

    // Header Background
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(startX, tableTop, contentWidth, headerHeight, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    doc.text('Sr\nNo.', colX.sr + 7.5, tableTop + 4, { align: 'center' });
    doc.text('Particular', colX.part + 4, tableTop + 6);
    doc.text('Qty', colX.qty + 12.5, tableTop + 6, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Rate', colX.rate + 15, tableTop + 6, { align: 'center' });
    doc.text('Amount', colX.amount + 15, tableTop + 6, { align: 'center' });

    // Table divider lines (Vertical)
    doc.line(colX.part, tableTop, colX.part, cgstTop);
    doc.line(colX.qty, tableTop, colX.qty, cgstTop);
    doc.line(colX.rate, tableTop, colX.rate, cgstTop);
    doc.line(colX.amount, tableTop, colX.amount, totalTop + totalHeight); // Amount separator line goes down to total row

    // Horizontal line below Header
    doc.line(startX, tableTop + headerHeight, endX, tableTop + headerHeight);

    // Render Items
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont('helvetica', 'normal');
    
    quotation.items.forEach((item, index) => {
      const y = tableTop + headerHeight + 5 + (index * 12);
      
      if (y < cgstTop - 4) {
        // Sr No
        doc.setFontSize(10);
        doc.text(item.srNo.toString(), colX.sr + 7.5, y + 2, { align: 'center' });

        // Particular
        doc.text(item.particular, colX.part + 4, y + 2);

        // Qty
        doc.text(`[${item.qty} ${item.qtyUnit}]`, colX.qty + 12.5, y + 2, { align: 'center' });

        // Rate
        doc.text(`${item.rate}/-`, colX.rate + 15, y, { align: 'center' });
        if (item.isGst) {
          doc.setFontSize(7.5);
          doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
          doc.text('(Including GST)', colX.rate + 15, y + 3.5, { align: 'center' });
          doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
          doc.setFontSize(10);
        }

        // Amount
        doc.text(`${item.qty * item.rate}/-`, colX.amount + 15, y, { align: 'center' });
        if (item.isGst) {
          doc.setFontSize(7.5);
          doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
          doc.text('(Including GST)', colX.amount + 15, y + 3.5, { align: 'center' });
          doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
          doc.setFontSize(10);
        }
      }
    });

    // 4. CGST Row
    doc.line(startX, cgstTop, endX, cgstTop);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`CGST @ ${quotation.cgstRate}%`, colX.sr + 3, cgstTop + 5);
    doc.text(`${quotation.cgstAmount}/-`, colX.amount + 15, cgstTop + 5, { align: 'center' });

    // 5. SGST Row
    doc.line(startX, sgstTop, endX, sgstTop);
    doc.text(`SGST @ ${quotation.sgstRate}%`, colX.sr + 3, sgstTop + 5);
    doc.text(`${quotation.sgstAmount}/-`, colX.amount + 15, sgstTop + 5, { align: 'center' });

    // 6. TOTAL AMOUNT Row
    doc.line(startX, totalTop, endX, totalTop);
    doc.setFillColor(LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2]);
    doc.rect(startX, totalTop, contentWidth, totalHeight, 'F');
    
    // Redraw the middle vertical line and outer rectangle for TOTAL Row overlay
    doc.rect(startX, totalTop, contentWidth, totalHeight);
    doc.line(colX.amount, totalTop, colX.amount, totalTop + totalHeight);

    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL AMOUNT (Including GST)', colX.sr + 25, totalTop + 6.5);
    doc.text(`${quotation.totalAmount}/-`, colX.amount + 15, totalTop + 6.5, { align: 'center' });

    // 7. Amount in Words Row
    doc.line(startX, wordsTop, endX, wordsTop);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Amount in Words:', colX.sr + 3, wordsTop + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.amountInWords, colX.sr + 3, wordsTop + 9);

    // 8. Bank Details & Signature Section
    const footerTop = tableBottom + 10; // 183 + 10 = 193
    
    // Bank Details (Left)
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`BANK DETAILS FOR ${quotation.bankDetails.bankName.toUpperCase()}`, startX, footerTop);
    
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`BRANCH ${quotation.bankDetails.branch.toUpperCase()}`, startX, footerTop + 5);
    doc.text(`A/C NO :- ${quotation.bankDetails.accountNumber}`, startX, footerTop + 10);
    doc.text(`IFSC CODE :- ${quotation.bankDetails.ifscCode.toUpperCase()}`, startX, footerTop + 15);

    // Signature Area (Right)
    const sigColCenterX = 160;
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`For ${quotation.companyDetails.name.toUpperCase()}`, sigColCenterX, footerTop, { align: 'center' });

    // Embed Signature Image
    try {
      const base64Sig = await this.getBase64ImageFromUrl(signatureUrl);
      // Center signature in the space
      doc.addImage(base64Sig, 'JPEG', sigColCenterX - 15, footerTop + 2, 30, 12);
    } catch (e) {
      console.warn('Could not load signature image. Drawing blank space.', e);
    }

    // Signature Line
    doc.setDrawColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setLineWidth(0.3);
    doc.line(sigColCenterX - 25, footerTop + 16, sigColCenterX + 25, footerTop + 16);

    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Proprietor', sigColCenterX, footerTop + 20, { align: 'center' });
    
    doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('SIGNATURE', sigColCenterX, footerTop + 23.5, { align: 'center' });

    // 9. Bottom-most Footer (Thank you)
    const bottomLineY = 250;
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(0.3);
    
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const thankYouText = 'THANK YOU FOR YOUR BUSINESS!';
    const textWidth = doc.getTextWidth(thankYouText);

    // Draw lines extending from text to margins
    doc.line(startX, bottomLineY, 105 - (textWidth / 2) - 2, bottomLineY);
    doc.text(thankYouText, 105, bottomLineY + 1, { align: 'center' });
    doc.line(105 + (textWidth / 2) + 2, bottomLineY, endX, bottomLineY);

    // Return the generated jsPDF instance
    return doc;
  }

  async generatePdf(quotation: Quotation, signatureUrl: string = 'signature.jpg'): Promise<void> {
    const doc = await this.buildPdfDocument(quotation, signatureUrl);
    doc.save(`Quotation_${quotation.date.replace(/\//g, '-')}.pdf`);
  }

  async generatePdfBlobUrl(quotation: Quotation, signatureUrl: string = 'signature.jpg'): Promise<string> {
    const doc = await this.buildPdfDocument(quotation, signatureUrl);
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  async generatePdfBlob(quotation: Quotation, signatureUrl: string = 'signature.jpg'): Promise<Blob> {
    const doc = await this.buildPdfDocument(quotation, signatureUrl);
    return doc.output('blob');
  }
}

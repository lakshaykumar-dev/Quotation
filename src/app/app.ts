import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QuotationFormComponent } from './components/quotation-form/quotation-form';
import { QuotationPreviewComponent } from './components/quotation-preview/quotation-preview';
import { Quotation } from './models/quotation.model';
import { QuotationService } from './services/quotation.service';
import { PdfService } from './services/pdf.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MatDialogModule, QuotationFormComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  quotation = signal<Quotation | null>(null);

  constructor(
    private quotationService: QuotationService,
    private pdfService: PdfService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const defaultCompany = this.quotationService.getCompanyDetails();
    const defaultBank = this.quotationService.getBankDetails();

    this.quotation.set({
      date: new Date().toISOString().split('T')[0],
      companyDetails: defaultCompany,
      bankDetails: defaultBank,
      items: [
        {
          srNo: 1,
          particular: 'Safety Shoes',
          qty: 100,
          qtyUnit: 'pair',
          rate: 200,
          amount: 20000,
          isGst: true
        }
      ],
      cgstRate: 2.5,
      sgstRate: 2.5,
      cgstAmount: 500,
      sgstAmount: 500,
      totalAmount: 20000,
      amountInWords: 'Rupees Twenty Thousand Only'
    });
  }

  onQuotationChange(updated: Quotation) {
    this.quotation.set({ ...updated });
  }

  openPreviewDialog() {
    const activeQuotation = this.quotation();
    if (activeQuotation) {
      this.dialog.open(QuotationPreviewComponent, {
        data: activeQuotation,
        width: '850px',
        maxHeight: '90vh',
        panelClass: 'custom-dialog-container',
        autoFocus: false
      });
    }
  }

  async downloadPdf() {
    const activeQuotation = this.quotation();
    if (activeQuotation) {
      await this.pdfService.generatePdf(activeQuotation, 'signature.jpg');
    }
  }
}

import { Component, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Quotation } from '../../models/quotation.model';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-quotation-preview',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './quotation-preview.html',
  styleUrl: './quotation-preview.css'
})
export class QuotationPreviewComponent {
  quotation!: Quotation;
  isDialogMode: boolean = false;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Quotation,
    @Optional() private dialogRef: MatDialogRef<QuotationPreviewComponent>,
    private pdfService: PdfService
  ) {
    if (data) {
      this.quotation = data;
      this.isDialogMode = true;
    }
  }

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  async downloadPdf() {
    if (this.quotation) {
      await this.pdfService.generatePdf(this.quotation, 'signature.jpg');
    }
  }
}

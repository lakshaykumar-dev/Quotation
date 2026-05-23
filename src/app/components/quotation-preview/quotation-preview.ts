import { Component, Inject, Optional, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { Quotation } from '../../models/quotation.model';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-quotation-preview',
  standalone: true,
  imports: [CommonModule, MatDialogModule, NgxExtendedPdfViewerModule],
  templateUrl: './quotation-preview.html',
  styleUrl: './quotation-preview.css'
})
export class QuotationPreviewComponent implements OnInit {
  quotation!: Quotation;
  isDialogMode: boolean = false;
  pdfBlob: Blob | null = null;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Quotation,
    @Optional() private dialogRef: MatDialogRef<QuotationPreviewComponent>,
    private pdfService: PdfService,
    private cdr: ChangeDetectorRef
  ) {
    if (data) {
      this.quotation = data;
      this.isDialogMode = true;
    }
  }

  async ngOnInit() {
    if (this.quotation) {
      await this.loadPdfPreview();
    }
  }

  async loadPdfPreview() {
    try {
      const blob = await this.pdfService.generatePdfBlob(this.quotation, 'signature.jpg');
      
      // Wrap in setTimeout to shift change detection to the next macro-task cycle,
      // resolving the NG0100 ExpressionChangedAfterItHasBeenCheckedError.
      setTimeout(() => {
        this.pdfBlob = blob;
        this.cdr.detectChanges();
      });
    } catch (error) {
      console.error('Error generating PDF preview:', error);
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

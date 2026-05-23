import { Component, Inject, Optional, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Quotation } from '../../models/quotation.model';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-quotation-preview',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './quotation-preview.html',
  styleUrl: './quotation-preview.css'
})
export class QuotationPreviewComponent implements OnInit, OnDestroy {
  quotation!: Quotation;
  isDialogMode: boolean = false;
  pdfSafeUrl: SafeResourceUrl | null = null;
  private pdfRawUrl: string | null = null;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Quotation,
    @Optional() private dialogRef: MatDialogRef<QuotationPreviewComponent>,
    private pdfService: PdfService,
    private sanitizer: DomSanitizer,
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

  ngOnDestroy() {
    if (this.pdfRawUrl) {
      URL.revokeObjectURL(this.pdfRawUrl);
    }
  }

  async loadPdfPreview() {
    try {
      const rawUrl = await this.pdfService.generatePdfBlobUrl(this.quotation, 'signature.jpg');
      this.pdfRawUrl = rawUrl;
      
      // Wrap in setTimeout to shift change detection to the next macro-task cycle,
      // resolving the NG0100 ExpressionChangedAfterItHasBeenCheckedError.
      setTimeout(() => {
        this.pdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
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

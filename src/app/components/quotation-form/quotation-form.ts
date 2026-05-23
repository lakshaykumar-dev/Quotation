import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quotation, QuotationItem } from '../../models/quotation.model';
import { QuotationService } from '../../services/quotation.service';
import { NumberOnlyDirective } from '../../directives/number-only.directive';

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NumberOnlyDirective],
  templateUrl: './quotation-form.html',
  styleUrl: './quotation-form.css'
})
export class QuotationFormComponent implements OnInit {
  @Input() quotation!: Quotation;
  @Output() quotationChange = new EventEmitter<Quotation>();
  @Output() downloadPdf = new EventEmitter<void>();
  @Output() previewQuotation = new EventEmitter<void>();

  constructor(private quotationService: QuotationService) {}

  ngOnInit() {
    if (!this.quotation) {
      this.quotation = {
        date: new Date().toISOString().split('T')[0],
        companyDetails: this.quotationService.getCompanyDetails(),
        bankDetails: this.quotationService.getBankDetails(),
        items: [
          { srNo: 1, particular: 'Safety Shoes', qty: 100, qtyUnit: 'pair', rate: 200, amount: 20000, isGst: true }
        ],
        cgstRate: 2.5,
        sgstRate: 2.5,
        cgstAmount: 500,
        sgstAmount: 500,
        totalAmount: 20000,
        amountInWords: 'Rupees Twenty Thousand Only'
      };
      this.updateCalculations();
    }
  }

  onModelChange() {
    // Coerce numeric inputs from string to numbers
    this.quotation.cgstRate = Number(this.quotation.cgstRate) || 0;
    this.quotation.sgstRate = Number(this.quotation.sgstRate) || 0;
    this.quotation.items.forEach(item => {
      item.qty = Number(item.qty) || 0;
      item.rate = Number(item.rate) || 0;
    });
    this.updateCalculations();
  }

  updateCalculations() {
    // Update individual item amounts (Qty * Rate)
    this.quotation.items.forEach(item => {
      item.amount = item.qty * item.rate;
    });

    const totals = this.quotationService.calculateTotals(
      this.quotation.items,
      this.quotation.cgstRate,
      this.quotation.sgstRate
    );

    this.quotation.totalAmount = totals.totalAmount;
    this.quotation.cgstAmount = totals.cgstAmount;
    this.quotation.sgstAmount = totals.sgstAmount;
    this.quotation.amountInWords = totals.amountInWords;
    
    this.quotationChange.emit(this.quotation);
  }

  addItem() {
    const nextSrNo = this.quotation.items.length + 1;
    const newItem: QuotationItem = {
      srNo: nextSrNo,
      particular: '',
      qty: 1,
      qtyUnit: 'pcs',
      rate: 0,
      amount: 0,
      isGst: true
    };
    this.quotation.items.push(newItem);
    this.updateCalculations();
  }

  removeItem(index: number) {
    this.quotation.items.splice(index, 1);
    // Re-index srNo
    this.quotation.items.forEach((item, idx) => item.srNo = idx + 1);
    this.updateCalculations();
  }

  saveCompanyDefaults() {
    this.quotationService.saveCompanyDetails(this.quotation.companyDetails);
  }

  saveBankDefaults() {
    this.quotationService.saveBankDetails(this.quotation.bankDetails);
  }

  triggerPdfDownload() {
    this.downloadPdf.emit();
  }

  triggerPreview() {
    this.previewQuotation.emit();
  }
}

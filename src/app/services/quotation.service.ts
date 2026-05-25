import { Injectable } from '@angular/core';
import { CompanyDetails, BankDetails, QuotationItem } from '../models/quotation.model';

@Injectable({
  providedIn: 'root'
})
export class QuotationService {
  private readonly COMPANY_KEY = 'quotation_company_details_v2';
  private readonly BANK_KEY = 'quotation_bank_details_v2';

  // Default values based on the template
  private defaultCompany: CompanyDetails = {
    name: 'VITTHAL HARDWARE',
    address: 'OPP JAIN DAIRY, MAHAL ROAD, BHANDARA - 441904',
    gstin: '27BXIPT8519D1Z2'
  };

  private defaultBank: BankDetails = {
    bankName: 'RTGS/NEFT ICICI BANK',
    branch: 'BHANDARA',
    accountNumber: '049505005700',
    ifscCode: 'ICIC0000495'
  };

  getCompanyDetails(): CompanyDetails {
    const saved = localStorage.getItem(this.COMPANY_KEY);
    return saved ? JSON.parse(saved) : { ...this.defaultCompany };
  }

  saveCompanyDetails(details: CompanyDetails): void {
    localStorage.setItem(this.COMPANY_KEY, JSON.stringify(details));
  }

  getBankDetails(): BankDetails {
    const saved = localStorage.getItem(this.BANK_KEY);
    return saved ? JSON.parse(saved) : { ...this.defaultBank };
  }

  saveBankDetails(details: BankDetails): void {
    localStorage.setItem(this.BANK_KEY, JSON.stringify(details));
  }

  calculateTotals(items: QuotationItem[], cgstRate: number, sgstRate: number) {
    let totalAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    items.forEach(item => {
      const lineBase = item.qty * item.rate;
      if (item.isGst) {
        // Inclusive of GST: GST is back-calculated and NOT added to total
        const taxable = lineBase / (1 + (cgstRate + sgstRate) / 100);
        const cgst = taxable * (cgstRate / 100);
        const sgst = taxable * (sgstRate / 100);
        
        item.amount = lineBase; // Row amount shows entered inclusive amount
        
        totalAmount += lineBase;
        totalCgst += cgst;
        totalSgst += sgst;
      } else {
        // Exclusive of GST: GST is calculated on top and added to total
        const cgst = lineBase * (cgstRate / 100);
        const sgst = lineBase * (sgstRate / 100);
        const lineTotalWithTax = lineBase + cgst + sgst;
        
        item.amount = lineBase; // Row amount shows base amount
        
        totalAmount += lineTotalWithTax;
        totalCgst += cgst;
        totalSgst += sgst;
      }
    });

    return {
      totalAmount: Math.round(totalAmount),
      cgstAmount: Number(totalCgst.toFixed(2)),
      sgstAmount: Number(totalSgst.toFixed(2)),
      amountInWords: this.convertToWords(Math.round(totalAmount))
    };
  }

  // Convert numbers to Indian Rupees words
  convertToWords(num: number): string {
    if (num === 0) return 'Rupees Zero Only';

    const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const doubleDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tensDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const formatHundreds = (n: number): string => {
      let str = '';
      if (n >= 100) {
        str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 10 && n < 20) {
        str += doubleDigits[n - 10] + ' ';
      } else if (n >= 20) {
        str += tensDigits[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) {
          str += singleDigits[n % 10] + ' ';
        }
      } else if (n > 0) {
        str += singleDigits[n] + ' ';
      }
      return str.trim();
    };

    let word = '';
    let rem = Math.floor(num);

    const crore = Math.floor(rem / 10000000);
    rem %= 10000000;
    if (crore > 0) {
      word += formatHundreds(crore) + ' Crore ';
    }

    const lakh = Math.floor(rem / 100000);
    rem %= 100000;
    if (lakh > 0) {
      word += formatHundreds(lakh) + ' Lakh ';
    }

    const thousand = Math.floor(rem / 1000);
    rem %= 1000;
    if (thousand > 0) {
      word += formatHundreds(thousand) + ' Thousand ';
    }

    if (rem > 0) {
      word += formatHundreds(rem) + ' ';
    }

    word = word.trim();
    return `Rupees ${word} Only`;
  }
}

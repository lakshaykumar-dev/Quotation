export interface QuotationItem {
  srNo: number;
  particular: string;
  qty: number;
  qtyUnit: string; // e.g. "pair", "pcs", "kg", "m"
  rate: number; // Rate including GST
  amount: number; // Amount including GST (Qty * Rate)
  isGst: boolean; // True if GST applies, False if exempted
}

export interface BankDetails {
  bankName: string;
  branch: string;
  accountNumber: string;
  ifscCode: string;
}

export interface CompanyDetails {
  name: string;
  address: string;
  gstin: string;
}

export interface Quotation {
  date: string;
  companyDetails: CompanyDetails;
  bankDetails: BankDetails;
  items: QuotationItem[];
  cgstRate: number; // e.g. 2.5 for 2.5%
  sgstRate: number; // e.g. 2.5 for 2.5%
  cgstAmount: number; // Calculated
  sgstAmount: number; // Calculated
  totalAmount: number; // Calculated
  amountInWords: string;
}

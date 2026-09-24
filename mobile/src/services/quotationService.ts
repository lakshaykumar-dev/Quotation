import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompanyDetails, BankDetails, QuotationItem } from '../types/quotation';

export const COMPANY_KEY = 'quotation_company_details_v2';
export const BANK_KEY = 'quotation_bank_details_v2';

export const defaultCompany: CompanyDetails = {
  name: 'VITTHAL HARDWARE',
  address: 'OPP JAIN DAIRY, MAHAL ROAD, BHANDARA - 441904',
  gstin: '27BXIPT8519D1Z2',
};

export const defaultBank: BankDetails = {
  bankName: 'RTGS/NEFT ICICI BANK',
  branch: 'BHANDARA',
  accountNumber: '049505005700',
  ifscCode: 'ICIC0000495',
};

export const getStoredCompanyDetails = async (): Promise<CompanyDetails> => {
  try {
    const saved = await AsyncStorage.getItem(COMPANY_KEY);
    return saved ? JSON.parse(saved) : { ...defaultCompany };
  } catch (error) {
    console.warn('Failed to load company details from storage', error);
    return { ...defaultCompany };
  }
};

export const saveStoredCompanyDetails = async (details: CompanyDetails): Promise<void> => {
  try {
    await AsyncStorage.setItem(COMPANY_KEY, JSON.stringify(details));
  } catch (error) {
    console.error('Failed to save company details to storage', error);
    throw error;
  }
};

export const getStoredBankDetails = async (): Promise<BankDetails> => {
  try {
    const saved = await AsyncStorage.getItem(BANK_KEY);
    return saved ? JSON.parse(saved) : { ...defaultBank };
  } catch (error) {
    console.warn('Failed to load bank details from storage', error);
    return { ...defaultBank };
  }
};

export const saveStoredBankDetails = async (details: BankDetails): Promise<void> => {
  try {
    await AsyncStorage.setItem(BANK_KEY, JSON.stringify(details));
  } catch (error) {
    console.error('Failed to save bank details to storage', error);
    throw error;
  }
};

export const calculateTotals = (
  items: QuotationItem[],
  cgstRate: number,
  sgstRate: number
) => {
  let totalAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;

  const processedItems = items.map((item, index) => {
    const lineBase = (item.qty || 0) * (item.rate || 0);
    if (item.isGst) {
      // Inclusive of GST: GST is back-calculated and NOT added to total
      const taxable = lineBase / (1 + (cgstRate + sgstRate) / 100);
      const cgst = taxable * (cgstRate / 100);
      const sgst = taxable * (sgstRate / 100);

      totalAmount += lineBase;
      totalCgst += cgst;
      totalSgst += sgst;

      return {
        ...item,
        srNo: index + 1,
        amount: lineBase,
      };
    } else {
      // Exclusive of GST: GST is calculated on top and added to total
      const cgst = lineBase * (cgstRate / 100);
      const sgst = lineBase * (sgstRate / 100);
      const lineTotalWithTax = lineBase + cgst + sgst;

      totalAmount += lineTotalWithTax;
      totalCgst += cgst;
      totalSgst += sgst;

      return {
        ...item,
        srNo: index + 1,
        amount: lineBase,
      };
    }
  });

  const roundedTotal = Math.round(totalAmount);

  return {
    items: processedItems,
    totalAmount: roundedTotal,
    cgstAmount: Number(totalCgst.toFixed(2)),
    sgstAmount: Number(totalSgst.toFixed(2)),
    amountInWords: convertToWords(roundedTotal),
  };
};

export const convertToWords = (num: number): string => {
  if (num === 0) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const doubleDigits = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
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
};

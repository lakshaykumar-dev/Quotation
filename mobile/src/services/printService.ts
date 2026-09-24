import { NativeModules, Share, Platform } from 'react-native';
import { Quotation } from '../types/quotation';
import { generateQuotationHtml } from '../utils/quotationHtml';

const { QuotationPdfModule } = NativeModules;

export const printQuotation = async (quotation: Quotation): Promise<boolean> => {
  const html = generateQuotationHtml(quotation);
  const jobName = `Quotation_${quotation.date.replace(/[\/\\]/g, '-')}`;

  if (Platform.OS === 'android' && QuotationPdfModule?.printHtml) {
    try {
      await QuotationPdfModule.printHtml(html, jobName);
      return true;
    } catch (error) {
      console.error('Failed to print quotation via native module:', error);
      throw error;
    }
  } else {
    console.warn('Native PrintModule is only available on Android native builds');
    return false;
  }
};

export const showNativeDatePicker = async (currentDate: string): Promise<string | null> => {
  if (Platform.OS === 'android' && QuotationPdfModule?.openDatePicker) {
    try {
      const selected = await QuotationPdfModule.openDatePicker(currentDate);
      return selected || null;
    } catch (error) {
      console.warn('Native DatePicker error:', error);
      return null;
    }
  }
  return null;
};

export const shareQuotationText = async (quotation: Quotation) => {
  const itemsText = quotation.items
    .map(
      (item) =>
        `${item.srNo}. ${item.particular} - ${item.qty} ${item.qtyUnit} @ ₹${item.rate} = ₹${item.amount}`
    )
    .join('\n');

  const message = `
*QUOTATION - ${quotation.companyDetails.name}*
Date: ${quotation.date}
GSTIN: ${quotation.companyDetails.gstin}

*Items:*
${itemsText}

*CGST (${quotation.cgstRate}%):* ₹${quotation.cgstAmount}
*SGST (${quotation.sgstRate}%):* ₹${quotation.sgstAmount}
*Total Amount:* ₹${quotation.totalAmount}/-
_${quotation.amountInWords}_

*Bank Details:*
Bank: ${quotation.bankDetails.bankName}
Branch: ${quotation.bankDetails.branch}
A/C: ${quotation.bankDetails.accountNumber}
IFSC: ${quotation.bankDetails.ifscCode}
  `.trim();

  await Share.share({
    title: `Quotation from ${quotation.companyDetails.name}`,
    message,
  });
};

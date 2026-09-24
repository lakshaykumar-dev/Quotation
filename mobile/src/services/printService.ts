import { NativeModules, Platform } from 'react-native';
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

export const shareQuotationPdf = async (quotation: Quotation): Promise<boolean> => {
  const html = generateQuotationHtml(quotation);
  const jobName = `Quotation_${quotation.date.replace(/[\/\\]/g, '-')}`;

  if (Platform.OS === 'android' && QuotationPdfModule?.generateAndSharePdf) {
    try {
      await QuotationPdfModule.generateAndSharePdf(html, jobName);
      return true;
    } catch (error) {
      console.error('Failed to generate and share PDF:', error);
      throw error;
    }
  } else {
    console.warn('Native PDF share is only available on Android native builds');
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

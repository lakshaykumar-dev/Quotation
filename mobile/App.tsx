import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Quotation, QuotationItem, CompanyDetails, BankDetails } from './src/types/quotation';
import {
  defaultCompany,
  defaultBank,
  getStoredCompanyDetails,
  saveStoredCompanyDetails,
  getStoredBankDetails,
  saveStoredBankDetails,
  calculateTotals,
} from './src/services/quotationService';
import {
  printQuotation,
  shareQuotationPdf,
  downloadQuotationPdf,
  showNativeDatePicker,
} from './src/services/printService';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <MainContent />
    </SafeAreaProvider>
  );
}

const shopIcon = require('./src/assets/app_icon.png');

function MainContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Math.max(insets.top, StatusBar.currentHeight || 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });

  const [company, setCompany] = useState<CompanyDetails>(defaultCompany);
  const [bank, setBank] = useState<BankDetails>(defaultBank);
  const [cgstRate, setCgstRate] = useState<string>('2.5');
  const [sgstRate, setSgstRate] = useState<string>('2.5');

  const [items, setItems] = useState<QuotationItem[]>([
    {
      srNo: 1,
      particular: 'Safety Shoes',
      qty: 4,
      qtyUnit: 'pair',
      rate: 590,
      amount: 2360,
      isGst: true,
    },
  ]);

  // Load defaults from storage on mount
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      (StatusBar as any).setTranslucent?.(true);
      (StatusBar as any).setBackgroundColor?.('transparent');
    }
    const loadDefaults = async () => {
      try {
        const storedComp = await getStoredCompanyDetails();
        const storedBank = await getStoredBankDetails();
        setCompany(storedComp);
        setBank(storedBank);
      } catch (err) {
        console.warn('Error loading defaults', err);
      } finally {
        setLoading(false);
      }
    };
    loadDefaults();
  }, []);

  // Compute calculated amounts dynamically
  const computedTotals = useMemo(() => {
    const numCgst = parseFloat(cgstRate) || 0;
    const numSgst = parseFloat(sgstRate) || 0;
    return calculateTotals(items, numCgst, numSgst);
  }, [items, cgstRate, sgstRate]);

  // Quotation object snapshot
  const currentQuotation: Quotation = useMemo(
    () => ({
      date,
      companyDetails: company,
      bankDetails: bank,
      items: computedTotals.items,
      cgstRate: parseFloat(cgstRate) || 0,
      sgstRate: parseFloat(sgstRate) || 0,
      cgstAmount: computedTotals.cgstAmount,
      sgstAmount: computedTotals.sgstAmount,
      totalAmount: computedTotals.totalAmount,
      amountInWords: computedTotals.amountInWords,
    }),
    [date, company, bank, computedTotals, cgstRate, sgstRate]
  );

  const handleSaveCompany = async () => {
    try {
      await saveStoredCompanyDetails(company);
      Alert.alert('Success', 'Company details saved as default.');
    } catch {
      Alert.alert('Error', 'Failed to save company details.');
    }
  };

  const handleSaveBank = async () => {
    try {
      await saveStoredBankDetails(bank);
      Alert.alert('Success', 'Bank details saved as default.');
    } catch {
      Alert.alert('Error', 'Failed to save bank details.');
    }
  };

  const handleAddItem = () => {
    const newItem: QuotationItem = {
      srNo: items.length + 1,
      particular: '',
      qty: 1,
      qtyUnit: 'pcs',
      rate: 0,
      amount: 0,
      isGst: true,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      Alert.alert('Notice', 'At least one item is required in the quotation.');
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleDownloadPdf = async () => {
    try {
      const savedPath = await downloadQuotationPdf(currentQuotation);
      Alert.alert(
        'Download Complete',
        `Quotation PDF has been saved to your Downloads folder!\n\nLocation: ${savedPath}`
      );
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Could not download PDF to Downloads folder.');
    }
  };

  const handleSharePdf = async () => {
    try {
      await shareQuotationPdf(currentQuotation);
    } catch (err: any) {
      Alert.alert('Share Error', err?.message || 'Could not generate or share PDF.');
    }
  };

  const handleOpenDatePicker = async () => {
    try {
      const pickedDate = await showNativeDatePicker(date);
      if (pickedDate) {
        setDate(pickedDate);
      }
    } catch (err) {
      console.warn('Date picker error:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f2c59" />
        <Text style={styles.loadingText}>Loading Vitthal Hardware Portal...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFCC00" translucent />
      {/* Dedicated Status Bar Spacer to permanently protect status bar icons from scroll overlap */}
      <View style={{ height: statusBarHeight, backgroundColor: '#FFCC00', width: '100%' }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* Top Header Matching Shopfront Signboard - Scrollable with page */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Image source={shopIcon} style={styles.headerLogo} resizeMode="cover" />
            <View style={styles.headerTitleContainer}>
              <View style={styles.marathiTitleRow}>
                <Text style={styles.marathiTitle}>विठ्ठल हार्डवेअर</Text>
                <Text style={styles.tradeMark}>™</Text>
              </View>
              <Text style={styles.brandTitle}>VITTHAL HARDWARE</Text>
              <Text style={styles.brandSubtitle}>📍 Opp. Jain Dairy, Mahal Road, Bhandara</Text>
            </View>
          </View>

          {/* Storefront Featured Brands Bar */}
          <View style={styles.brandPillsRow}>
            <View style={styles.brandPill}><Text style={styles.brandPillText}>🔧 COPPER Tools</Text></View>
            <View style={styles.brandPill}><Text style={styles.brandPillText}>🏗️ SUPER STEEL</Text></View>
            <View style={styles.brandPill}><Text style={styles.brandPillText}>✨ VERTIGO GOLD</Text></View>
            <View style={styles.brandPill}><Text style={styles.brandPillText}>⚙️ FALL-GO</Text></View>
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* Section 1: Company Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏢</Text>
            <Text style={styles.cardTitle}>Company Profile</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={company.name}
              onChangeText={(text) => setCompany({ ...company, name: text })}
              placeholder="e.g. VITTHAL HARDWARE"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={company.address}
              onChangeText={(text) => setCompany({ ...company, address: text })}
              placeholder="e.g. OPP JAIN DAIRY, MAHAL ROAD..."
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>GST Number (GSTIN)</Text>
            <View style={styles.inputWithAction}>
              <TextInput
                style={[styles.input, styles.flex1]}
                value={company.gstin}
                onChangeText={(text) => setCompany({ ...company, gstin: text })}
                placeholder="e.g. 27BXIPT8519D1Z2"
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.btnSecondary} onPress={handleSaveCompany}>
                <Text style={styles.btnSecondaryText}>Save Default</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 2: General & Tax Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📅</Text>
            <Text style={styles.cardTitle}>Date & Tax Structure</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Quotation Date</Text>
              <TouchableOpacity
                style={[styles.input, styles.datePickerButton]}
                onPress={handleOpenDatePicker}
                activeOpacity={0.7}
              >
                <Text style={styles.dateTextValue}>{date || 'Select Date'}</Text>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.field, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>CGST %</Text>
              <TextInput
                style={styles.input}
                value={cgstRate}
                onChangeText={setCgstRate}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, styles.flex1]}>
              <Text style={styles.label}>SGST %</Text>
              <TextInput
                style={styles.input}
                value={sgstRate}
                onChangeText={setSgstRate}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Section 3: Bank Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏦</Text>
            <Text style={styles.cardTitle}>Bank Account Details</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={bank.bankName}
                onChangeText={(text) => setBank({ ...bank, bankName: text })}
                placeholder="e.g. RTGS/NEFT ICICI BANK"
              />
            </View>
            <View style={[styles.field, styles.flex1]}>
              <Text style={styles.label}>Branch</Text>
              <TextInput
                style={styles.input}
                value={bank.branch}
                onChangeText={(text) => setBank({ ...bank, branch: text })}
                placeholder="e.g. BHANDARA"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1, { marginRight: 8 }]}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={bank.accountNumber}
                onChangeText={(text) => setBank({ ...bank, accountNumber: text })}
                placeholder="e.g. 049505005700"
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.field, styles.flex1]}>
              <Text style={styles.label}>IFSC Code</Text>
              <TextInput
                style={styles.input}
                value={bank.ifscCode}
                onChangeText={(text) => setBank({ ...bank, ifscCode: text })}
                placeholder="e.g. ICIC0000495"
                autoCapitalize="characters"
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.btnSecondary, { marginTop: 6 }]} onPress={handleSaveBank}>
            <Text style={styles.btnSecondaryText}>Save Bank as Default</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Items & Services */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, styles.spaceBetween]}>
            <View style={styles.row}>
              <Text style={styles.cardIcon}>📦</Text>
              <Text style={styles.cardTitle}>Items & Services ({items.length})</Text>
            </View>
            <TouchableOpacity style={styles.btnAddItem} onPress={handleAddItem}>
              <Text style={styles.btnAddItemText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={[styles.row, styles.spaceBetween, { marginBottom: 6 }]}>
                <Text style={styles.itemBadge}>Item #{index + 1}</Text>
                <View style={styles.row}>
                  <Text style={styles.switchLabel}>Inc. GST</Text>
                  <Switch
                    value={item.isGst}
                    onValueChange={(val) => handleItemChange(index, 'isGst', val)}
                    trackColor={{ false: '#d0d7de', true: '#0f2c59' }}
                    thumbColor="#ffffff"
                  />
                  <TouchableOpacity
                    style={styles.btnDelete}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <Text style={styles.btnDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Particular / Description</Text>
                <TextInput
                  style={styles.input}
                  value={item.particular}
                  onChangeText={(text) => handleItemChange(index, 'particular', text)}
                  placeholder="e.g. Safety Shoes, Helmet, etc."
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { width: 80, marginRight: 8 }]}>
                  <Text style={styles.label}>Qty</Text>
                  <TextInput
                    style={styles.input}
                    value={String(item.qty || '')}
                    onChangeText={(text) =>
                      handleItemChange(index, 'qty', parseInt(text, 10) || 0)
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.field, { width: 80, marginRight: 8 }]}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={item.qtyUnit}
                    onChangeText={(text) => handleItemChange(index, 'qtyUnit', text)}
                    placeholder="pair"
                  />
                </View>
                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>Rate (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(item.rate || '')}
                    onChangeText={(text) =>
                      handleItemChange(index, 'rate', parseFloat(text) || 0)
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.rowAmount}>
                <Text style={styles.amountLabel}>Line Total:</Text>
                <Text style={styles.amountValue}>
                  ₹{(item.qty * item.rate).toFixed(2)}/-
                  {item.isGst ? ' (Incl. GST)' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Section 5: Calculation Summary */}
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.summaryTitle}>Quotation Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>CGST @ {cgstRate}%</Text>
            <Text style={styles.summaryValue}>₹{computedTotals.cgstAmount.toFixed(2)}/-</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SGST @ {sgstRate}%</Text>
            <Text style={styles.summaryValue}>₹{computedTotals.sgstAmount.toFixed(2)}/-</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalValue}>₹{computedTotals.totalAmount}/-</Text>
          </View>

          <Text style={styles.wordsText}>
            <Text style={{ fontWeight: 'bold' }}>In Words: </Text>
            {computedTotals.amountInWords}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.btnSharePdf} onPress={handleSharePdf}>
            <Text style={styles.btnActionText}>📤 Share PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDownloadPdf} onPress={handleDownloadPdf}>
            <Text style={styles.btnActionText}>📥 Download PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#0f2c59',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFCC00',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#E0A800',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#8B0000',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  headerTitleContainer: {
    flex: 1,
  },
  marathiTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  marathiTitle: {
    color: '#8B0000',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tradeMark: {
    color: '#8B0000',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 2,
  },
  brandTitle: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: -2,
  },
  brandSubtitle: {
    color: '#334155',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  brandPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 0, 0, 0.15)',
  },
  brandPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.2)',
  },
  brandPillText: {
    color: '#8B0000',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  cardIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f2c59',
  },
  field: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0f172a',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateTextValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  dateIcon: {
    fontSize: 14,
  },
  inputWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  btnSecondary: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
    marginLeft: 8,
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  btnAddItem: {
    backgroundColor: '#0f2c59',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnAddItemText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  itemContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f2c59',
  },
  switchLabel: {
    fontSize: 11,
    color: '#475569',
    marginRight: 4,
  },
  btnDelete: {
    backgroundColor: '#fee2e2',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  btnDeleteText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  rowAmount: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 6,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f2c59',
  },
  summaryCard: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B0000',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE047',
    paddingBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#451A03',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: '#B45309',
    marginTop: 6,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#8B0000',
  },
  wordsText: {
    marginTop: 8,
    fontSize: 11,
    color: '#1e293b',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  btnSharePdf: {
    flex: 1,
    backgroundColor: '#0F2C59',
    paddingVertical: 14,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  btnDownloadPdf: {
    flex: 1,
    backgroundColor: '#8B0000',
    paddingVertical: 14,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});

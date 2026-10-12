import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INITIAL_FOLDERS, CATEGORIES, INITIAL_RECEIPTS, INBOX_PENDING_RECEIPTS } from './src/data/initialData';
import { COLORS } from './src/theme/colors';

const { width } = Dimensions.get('window');

export default function App() {
  // Navigation: 'home' | 'scanner' | 'detail' | 'folders' | 'analytics' | 'inbox' | 'settings'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [taxYear, setTaxYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [receipts, setReceipts] = useState(INITIAL_RECEIPTS);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [inboxReceipts, setInboxReceipts] = useState(INBOX_PENDING_RECEIPTS);
  const [activeReceipt, setActiveReceipt] = useState(INITIAL_RECEIPTS[0]);
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Scanner State
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);

  // Calculated Metrics
  const totalSpend = receipts.reduce((sum, r) => sum + r.total, 0);
  const totalTaxWriteOff = receipts.reduce(
    (sum, r) => sum + (r.isTaxDeductible ? r.writeOffAmount : 0),
    0
  );
  const pendingInboxCount = inboxReceipts.length;

  const filteredReceipts = receipts.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.merchant.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  });

  // Simulated AI OCR Scan Trigger
  const handleScanSample = (merchant = 'The Home Depot', total = 129.60, category = 'Office & Tech') => {
    setIsScanningAnimation(true);
    setTimeout(() => {
      setIsScanningAnimation(false);
      const newRec = {
        id: `rec_${Date.now()}`,
        merchant,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subtotal: total * 0.9,
        tax: total * 0.1,
        tip: 0,
        total,
        currency: 'USD',
        paymentMethod: 'Amex •••• 1004',
        category,
        categoryId: 'cat_office',
        folderId: 'folder_business_2026',
        isTaxDeductible: true,
        deductionPercentage: 100,
        writeOffAmount: total,
        returnPolicyDays: 30,
        returnDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        isReturnActive: true,
        notes: `AI Scanned receipt from ${merchant}`,
        tags: ['#mobile-scan'],
        ocrConfidence: 99,
        status: 'draft',
        lineItems: [{ description: 'Scanned Purchase Item', amount: total * 0.9 }]
      };
      setActiveReceipt(newRec);
      setCurrentScreen('detail');
    }, 1500);
  };

  const handleSaveReceipt = () => {
    const exists = receipts.some((r) => r.id === activeReceipt.id);
    if (exists) {
      setReceipts((prev) => prev.map((r) => (r.id === activeReceipt.id ? activeReceipt : r)));
    } else {
      setReceipts((prev) => [activeReceipt, ...prev]);
    }
    Alert.alert('Saved to Folder', 'Receipt categorized and added to your tax records.');
    setCurrentScreen('home');
  };

  const handleDeleteReceipt = (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    setCurrentScreen('home');
  };

  const handleApproveInbox = (item) => {
    const newRec = {
      id: `rec_${Date.now()}`,
      merchant: item.merchant,
      date: item.date,
      time: '12:00',
      subtotal: item.total * 0.9,
      tax: item.total * 0.1,
      tip: 0,
      total: item.total,
      currency: 'USD',
      paymentMethod: 'Auto-Imported Account',
      category: item.categorySuggestion,
      categoryId: 'cat_office',
      folderId: item.folderSuggestion,
      isTaxDeductible: true,
      deductionPercentage: 100,
      writeOffAmount: item.total,
      returnPolicyDays: 30,
      returnDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      isReturnActive: true,
      notes: `Imported via ${item.source}: ${item.itemsSnippet}`,
      ocrConfidence: 99,
      status: 'filed',
      lineItems: [{ description: item.itemsSnippet, amount: item.total }]
    };
    setReceipts((prev) => [newRec, ...prev]);
    setInboxReceipts((prev) => prev.filter((i) => i.id !== item.id));
    Alert.alert('Approved & Filed', `${item.merchant} moved to ${item.categorySuggestion}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDeep} />

      <View style={styles.container}>
        {/* Screen Routing */}
        {currentScreen === 'home' && (
          <HomeScreenView
            taxYear={taxYear}
            totalSpend={totalSpend}
            totalTaxWriteOff={totalTaxWriteOff}
            pendingInboxCount={pendingInboxCount}
            folders={folders}
            receipts={filteredReceipts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSelectReceipt={(r) => {
              setActiveReceipt(r);
              setCurrentScreen('detail');
            }}
            onSelectFolder={(f) => {
              setSelectedFolder(f);
              setCurrentScreen('folders');
            }}
            onOpenInbox={() => setCurrentScreen('inbox')}
            onOpenSettings={() => setCurrentScreen('settings')}
          />
        )}

        {currentScreen === 'scanner' && (
          <ScannerScreenView
            isScanning={isScanningAnimation}
            onTriggerScan={handleScanSample}
            onClose={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'detail' && (
          <ReceiptDetailView
            receipt={activeReceipt}
            folders={folders}
            categories={CATEGORIES}
            onChangeReceipt={setActiveReceipt}
            onSave={handleSaveReceipt}
            onDelete={handleDeleteReceipt}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'folders' && (
          <FoldersView
            folders={folders}
            receipts={receipts}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            onSelectReceipt={(r) => {
              setActiveReceipt(r);
              setCurrentScreen('detail');
            }}
            onBack={() => {
              setSelectedFolder(null);
              setCurrentScreen('home');
            }}
          />
        )}

        {currentScreen === 'analytics' && (
          <AnalyticsView
            receipts={receipts}
            totalSpend={totalSpend}
            totalTaxWriteOff={totalTaxWriteOff}
          />
        )}

        {currentScreen === 'inbox' && (
          <InboxView
            inboxReceipts={inboxReceipts}
            onApprove={handleApproveInbox}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsView
            receiptCount={receipts.length}
            onResetSeed={() => {
              setReceipts(INITIAL_RECEIPTS);
              setInboxReceipts(INBOX_PENDING_RECEIPTS);
              Alert.alert('Reset', 'Sample receipts restored.');
            }}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {/* Floating Bottom Navigation (hidden on camera screen) */}
        {currentScreen !== 'scanner' && (
          <View style={styles.bottomNavContainer}>
            <TouchableOpacity
              style={styles.navTab}
              onPress={() => setCurrentScreen('home')}
            >
              <Ionicons
                name="home"
                size={20}
                color={currentScreen === 'home' ? COLORS.emeraldBright : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.navTabText,
                  currentScreen === 'home' && styles.navTabTextActive
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navTab}
              onPress={() => {
                setSelectedFolder(null);
                setCurrentScreen('folders');
              }}
            >
              <Ionicons
                name="folder"
                size={20}
                color={currentScreen === 'folders' ? COLORS.emeraldBright : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.navTabText,
                  currentScreen === 'folders' && styles.navTabTextActive
                ]}
              >
                Folders
              </Text>
            </TouchableOpacity>

            {/* Glowing Shutter Camera Button */}
            <TouchableOpacity
              style={styles.centerShutterBtn}
              onPress={() => setCurrentScreen('scanner')}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={28} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navTab}
              onPress={() => setCurrentScreen('analytics')}
            >
              <Ionicons
                name="bar-chart"
                size={20}
                color={currentScreen === 'analytics' ? COLORS.emeraldBright : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.navTabText,
                  currentScreen === 'analytics' && styles.navTabTextActive
                ]}
              >
                Analytics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navTab}
              onPress={() => setCurrentScreen('inbox')}
            >
              <Ionicons
                name="mail-unread"
                size={20}
                color={currentScreen === 'inbox' ? COLORS.emeraldBright : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.navTabText,
                  currentScreen === 'inbox' && styles.navTabTextActive
                ]}
              >
                Inbox {pendingInboxCount > 0 ? `(${pendingInboxCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ==========================================================
   SCREEN: HOME DASHBOARD
   ========================================================== */
function HomeScreenView({
  taxYear,
  totalSpend,
  totalTaxWriteOff,
  pendingInboxCount,
  folders,
  receipts,
  searchQuery,
  setSearchQuery,
  onSelectReceipt,
  onSelectFolder,
  onOpenInbox,
  onOpenSettings
}) {
  return (
    <ScrollView style={styles.scrollScreen} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brandTitle}>
            <Text style={{ color: COLORS.emeraldBright }}>Simply</Text>Wise
          </Text>
          <Text style={styles.headerSubtitle}>Receipts & Expense Tracker</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.taxYearBadge}>
            <Text style={styles.taxYearBadgeText}>Tax Year: {taxYear}</Text>
          </View>
          <TouchableOpacity onPress={onOpenSettings} style={styles.iconCircleBtn}>
            <Ionicons name="settings-outline" size={18} color={COLORS.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Global Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={COLORS.textSubtle} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendor, date, note, or tag..."
          placeholderTextColor={COLORS.textSubtle}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Financial Metrics Strip */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL SPEND</Text>
          <Text style={styles.metricValue}>${totalSpend.toFixed(2)}</Text>
          <Text style={styles.metricFootnote}>{receipts.length} receipts filed</Text>
        </View>

        <View style={[styles.metricCard, styles.metricCardHighlight]}>
          <Text style={[styles.metricLabel, { color: 'rgba(255,255,255,0.85)' }]}>TAX WRITE-OFFS</Text>
          <Text style={[styles.metricValue, { color: '#FFF' }]}>${totalTaxWriteOff.toFixed(2)}</Text>
          <Text style={[styles.metricFootnote, { color: '#FFF' }]}>IRS Deductible</Text>
        </View>

        <TouchableOpacity style={styles.metricCard} onPress={onOpenInbox}>
          <Text style={styles.metricLabel}>INBOX</Text>
          <Text style={[styles.metricValue, pendingInboxCount > 0 && { color: COLORS.amberWarning }]}>
            {pendingInboxCount}
          </Text>
          <Text style={styles.metricFootnote}>To be saved</Text>
        </TouchableOpacity>
      </View>

      {/* Smart Folders Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Smart Folders</Text>
        <TouchableOpacity onPress={() => onSelectFolder(null)}>
          <Text style={styles.sectionLink}>View All ({folders.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foldersScroll}>
        {folders.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={styles.folderCard}
            onPress={() => onSelectFolder(f)}
          >
            <View style={[styles.folderIconBox, { backgroundColor: `${f.color}25` }]}>
              <Ionicons name="folder" size={18} color={f.color} />
            </View>
            <Text style={styles.folderName} numberOfLines={1}>{f.name}</Text>
            <Text style={styles.folderMeta}>{f.receiptCount} documents</Text>
            <Text style={styles.folderAmount}>${f.totalAmount.toFixed(0)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recent Receipts Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {searchQuery ? `Search Results (${receipts.length})` : 'Recent Scanned Receipts'}
        </Text>
      </View>

      <View style={styles.receiptsList}>
        {receipts.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.receiptItem}
            onPress={() => onSelectReceipt(r)}
          >
            <View style={styles.receiptItemLeft}>
              <View style={styles.receiptAvatar}>
                <Ionicons
                  name={r.category.includes('Dining') ? 'restaurant' : r.category.includes('Tech') ? 'laptop' : 'cart'}
                  size={18}
                  color={COLORS.emeraldBright}
                />
              </View>
              <View>
                <Text style={styles.receiptMerchant}>{r.merchant}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={styles.receiptDate}>{r.date}</Text>
                  {r.isTaxDeductible && (
                    <View style={styles.taxBadge}>
                      <Text style={styles.taxBadgeText}>Deductible</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.receiptAmount}>${r.total.toFixed(2)}</Text>
              <Text style={styles.receiptCategory}>{r.category}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

/* ==========================================================
   SCREEN: AI SCANNER VIEW
   ========================================================== */
function ScannerScreenView({ isScanning, onTriggerScan, onClose }) {
  return (
    <View style={styles.scannerContainer}>
      <View style={styles.scannerTopBar}>
        <TouchableOpacity onPress={onClose} style={styles.scannerBackBtn}>
          <Ionicons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.scannerTitle}>AI Receipt Scanner</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Viewfinder Canvas */}
      <View style={styles.viewfinderCenter}>
        {/* Receipt Simulation Card */}
        <View style={styles.simulatedReceiptPaper}>
          <Text style={styles.receiptPaperHeader}>*** HOME DEPOT ***</Text>
          <Text style={styles.receiptPaperMeta}>Store #1204 • Austin, TX</Text>
          <View style={styles.dashedDivider} />
          <View style={styles.paperRow}>
            <Text style={styles.paperText}>Acoustic Sound Panels</Text>
            <Text style={styles.paperText}>$85.00</Text>
          </View>
          <View style={styles.paperRow}>
            <Text style={styles.paperText}>Wall Mounting Hardware</Text>
            <Text style={styles.paperText}>$35.00</Text>
          </View>
          <View style={styles.dashedDivider} />
          <View style={styles.paperRow}>
            <Text style={[styles.paperText, { fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.paperText, { fontWeight: 'bold' }]}>$129.60</Text>
          </View>
        </View>

        {/* OCR Cyan Boundary Box */}
        <View style={styles.ocrTargetBox}>
          <View style={[styles.cornerMarker, styles.cornerTL]} />
          <View style={[styles.cornerMarker, styles.cornerTR]} />
          <View style={[styles.cornerMarker, styles.cornerBL]} />
          <View style={[styles.cornerMarker, styles.cornerBR]} />

          {/* Laser Scan Line */}
          <View style={styles.laserBeam} />

          <View style={styles.hudPillTop}>
            <Text style={styles.hudPillText}>DETECTED: Home Depot</Text>
          </View>
          <View style={styles.hudPillBottom}>
            <Text style={styles.hudPillText}>TOTAL: $129.60</Text>
          </View>
        </View>

        {/* Processing Spinner Overlay */}
        {isScanning && (
          <View style={styles.processingModalOverlay}>
            <Ionicons name="sparkles" size={36} color={COLORS.emeraldBright} />
            <Text style={styles.processingText}>Extracting OCR Metadata...</Text>
            <Text style={styles.processingSubtext}>Detecting date, totals & tax write-offs</Text>
          </View>
        )}
      </View>

      {/* Preset Receipt Buttons */}
      <View style={styles.presetToolbar}>
        <TouchableOpacity
          style={styles.presetChip}
          onPress={() => onTriggerScan('Home Depot', 129.60, 'Office & Tech')}
        >
          <Text style={styles.presetChipText}>Home Depot ($129.60)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.presetChip}
          onPress={() => onTriggerScan('Starbucks Coffee', 18.65, 'Meals & Dining')}
        >
          <Text style={styles.presetChipText}>Starbucks ($18.65)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.presetChip}
          onPress={() => onTriggerScan('Apple Store', 1294.92, 'Office & Tech')}
        >
          <Text style={styles.presetChipText}>Apple ($1,294.92)</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Shutter Action */}
      <View style={styles.scannerBottomBar}>
        <TouchableOpacity style={styles.scannerSecondaryBtn}>
          <Ionicons name="images" size={22} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.largeShutterBtn}
          onPress={() => onTriggerScan('Target Store', 142.75, 'General Supplies')}
        >
          <Ionicons name="camera" size={32} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.scannerSecondaryBtn}>
          <Ionicons name="flash" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ==========================================================
   SCREEN: RECEIPT DETAIL & TAX WRITE-OFF INSPECTOR
   ========================================================== */
function ReceiptDetailView({ receipt, folders, categories, onChangeReceipt, onSave, onDelete, onBack }) {
  return (
    <ScrollView style={styles.scrollScreen} contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
      {/* Top Header */}
      <View style={styles.detailHeaderRow}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textMain} />
          <Text style={{ color: COLORS.textMain, fontWeight: '600' }}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>Receipt Detail</Text>
        <TouchableOpacity onPress={() => onDelete(receipt.id)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.coralAlert} />
        </TouchableOpacity>
      </View>

      {/* Confidence Banner */}
      <View style={styles.detailCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textMain }}>{receipt.merchant}</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Scanned {receipt.date} at {receipt.time}</Text>
          </View>
          <View style={styles.confidenceTag}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.emeraldPrimary} />
            <Text style={styles.confidenceTagText}>{receipt.ocrConfidence}% Verified</Text>
          </View>
        </View>
      </View>

      {/* Merchant & Amount Fields */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>MERCHANT NAME</Text>
        <TextInput
          style={styles.formInput}
          value={receipt.merchant}
          onChangeText={(val) => onChangeReceipt({ ...receipt, merchant: val })}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>DATE</Text>
          <TextInput
            style={styles.formInput}
            value={receipt.date}
            onChangeText={(val) => onChangeReceipt({ ...receipt, date: val })}
          />
        </View>

        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.formLabel}>TOTAL AMOUNT ($)</Text>
          <TextInput
            style={[styles.formInput, { color: COLORS.emeraldBright, fontWeight: 'bold' }]}
            keyboardType="decimal-pad"
            value={receipt.total.toString()}
            onChangeText={(val) => {
              const num = parseFloat(val) || 0;
              onChangeReceipt({
                ...receipt,
                total: num,
                writeOffAmount: num * (receipt.deductionPercentage / 100)
              });
            }}
          />
        </View>
      </View>

      {/* Tax Write-Off Deductible Switch */}
      <View style={styles.taxWriteOffCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.emeraldBright }}>
              Tax Deductible Write-Off
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>IRS Qualified Expense</Text>
          </View>
          <TouchableOpacity
            style={[styles.togglePill, receipt.isTaxDeductible && styles.togglePillActive]}
            onPress={() => {
              const active = !receipt.isTaxDeductible;
              onChangeReceipt({
                ...receipt,
                isTaxDeductible: active,
                writeOffAmount: active ? receipt.total * (receipt.deductionPercentage / 100) : 0
              });
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: receipt.isTaxDeductible ? '#000' : '#FFF' }}>
              {receipt.isTaxDeductible ? 'ACTIVE (100%)' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {receipt.isTaxDeductible && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: COLORS.textMain }}>
              Estimated Tax Savings: <Text style={{ fontWeight: 'bold', color: COLORS.emeraldBright }}>${receipt.writeOffAmount.toFixed(2)}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Return Policy Reminder */}
      {receipt.returnPolicyDays > 0 && (
        <View style={styles.returnAlertCard}>
          <Ionicons name="time-outline" size={18} color={COLORS.amberWarning} />
          <View style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.amberWarning }}>
              Return Policy: {receipt.returnPolicyDays} Days
            </Text>
            <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
              Return deadline: {receipt.returnDeadline || 'Valid with receipt'}
            </Text>
          </View>
        </View>
      )}

      {/* Save Action Button */}
      <TouchableOpacity style={styles.saveActionBtn} onPress={onSave}>
        <Ionicons name="save" size={18} color="#000" style={{ marginRight: 6 }} />
        <Text style={styles.saveActionBtnText}>Save to Smart Folder</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ==========================================================
   SCREEN: FOLDERS & FILING CABINET
   ========================================================== */
function FoldersView({ folders, receipts, selectedFolder, onSelectFolder, onSelectReceipt, onBack }) {
  const currentReceipts = selectedFolder
    ? receipts.filter((r) => r.folderId === selectedFolder.id)
    : receipts;

  return (
    <ScrollView style={styles.scrollScreen} contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
      <View style={styles.detailHeaderRow}>
        {selectedFolder ? (
          <TouchableOpacity onPress={() => onSelectFolder(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textMain} />
            <Text style={{ color: COLORS.textMain, fontWeight: '600' }}>All Folders</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.brandTitle}>Filing Cabinet</Text>
        )}
      </View>

      {!selectedFolder ? (
        <View style={{ gap: 12 }}>
          {folders.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={styles.folderRowCard}
              onPress={() => onSelectFolder(f)}
            >
              <View style={[styles.folderIconBox, { backgroundColor: `${f.color}25` }]}>
                <Ionicons name="folder" size={20} color={f.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.folderRowTitle}>{f.name}</Text>
                <Text style={styles.folderRowMeta}>{f.description}</Text>
              </View>
              <Text style={styles.folderRowTotal}>${f.totalAmount.toFixed(0)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.receiptsList}>
          {currentReceipts.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.receiptItem}
              onPress={() => onSelectReceipt(r)}
            >
              <View style={styles.receiptItemLeft}>
                <View style={styles.receiptAvatar}>
                  <Ionicons name="receipt-outline" size={18} color={COLORS.emeraldBright} />
                </View>
                <View>
                  <Text style={styles.receiptMerchant}>{r.merchant}</Text>
                  <Text style={styles.receiptDate}>{r.date}</Text>
                </View>
              </View>
              <Text style={styles.receiptAmount}>${r.total.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* ==========================================================
   SCREEN: ANALYTICS & INSIGHTS
   ========================================================== */
function AnalyticsView({ receipts, totalSpend, totalTaxWriteOff }) {
  return (
    <ScrollView style={styles.scrollScreen} contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
      <Text style={[styles.brandTitle, { marginBottom: 14 }]}>Expense Analytics</Text>

      {/* Tax Write-Off Savings Hero Card */}
      <View style={styles.taxSavingsHeroCard}>
        <Ionicons name="shield-checkmark" size={24} color={COLORS.emeraldBright} />
        <Text style={styles.heroSavingsLabel}>TOTAL ESTIMATED TAX WRITE-OFFS</Text>
        <Text style={styles.heroSavingsAmount}>${totalTaxWriteOff.toFixed(2)}</Text>
        <Text style={styles.heroSavingsFootnote}>
          Calculated across {receipts.filter((r) => r.isTaxDeductible).length} deductible expenses
        </Text>
      </View>

      {/* Spending Breakdown */}
      <View style={[styles.detailCard, { marginTop: 14 }]}>
        <Text style={[styles.formLabel, { marginBottom: 10 }]}>SPENDING BY CATEGORY</Text>
        {CATEGORIES.slice(0, 5).map((cat) => {
          const sum = receipts.filter((r) => r.category === cat.name).reduce((s, r) => s + r.total, 0);
          const pct = Math.round((sum / (totalSpend || 1)) * 100);
          return (
            <View key={cat.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: COLORS.textMain }}>{cat.name}</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.textMain }}>
                  ${sum.toFixed(2)} ({pct}%)
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: COLORS.borderSubtle, borderRadius: 3 }}>
                <View style={{ height: 6, width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color, borderRadius: 3 }} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* ==========================================================
   SCREEN: INBOX (TO BE SAVED)
   ========================================================== */
function InboxView({ inboxReceipts, onApprove, onBack }) {
  return (
    <ScrollView style={styles.scrollScreen} contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
      <Text style={[styles.brandTitle, { marginBottom: 14 }]}>Digital Inbox</Text>

      <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14 }}>
        Auto-imported e-receipts from Gmail, Outlook & Amazon awaiting approval.
      </Text>

      {inboxReceipts.map((item) => (
        <View key={item.id} style={styles.inboxCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.textMain }}>{item.merchant}</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.emeraldBright }}>${item.total.toFixed(2)}</Text>
          </View>
          <Text style={{ fontSize: 12, color: COLORS.cyanAI, marginVertical: 4 }}>{item.source} • {item.date}</Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{item.itemsSnippet}</Text>

          <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(item)}>
            <Ionicons name="checkmark-circle" size={16} color="#000" style={{ marginRight: 6 }} />
            <Text style={{ fontWeight: '700', fontSize: 13, color: '#000' }}>Approve & File</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

/* ==========================================================
   SCREEN: SETTINGS
   ========================================================== */
function SettingsView({ receiptCount, onResetSeed, onBack }) {
  return (
    <ScrollView style={styles.scrollScreen} contentContainerStyle={{ padding: 18, paddingBottom: 100 }}>
      <Text style={[styles.brandTitle, { marginBottom: 14 }]}>Settings & Security</Text>

      <View style={styles.detailCard}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.textMain }}>SimplyWise Profile</Text>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
          Base Currency: USD ($){'\n'}
          Stored Documents: {receiptCount} receipts{'\n'}
          Encryption: 256-Bit Bank Grade Active
        </Text>
      </View>

      <TouchableOpacity style={[styles.saveActionBtn, { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderSubtle, marginTop: 14 }]} onPress={onResetSeed}>
        <Ionicons name="refresh" size={18} color={COLORS.textMain} style={{ marginRight: 6 }} />
        <Text style={[styles.saveActionBtnText, { color: COLORS.textMain }]}>Reset Sample Seed Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ==========================================================
   STYLESHEET
   ========================================================== */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  scrollScreen: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  taxYearBadge: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  taxYearBadgeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    marginHorizontal: 18,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 13,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 8,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  metricCardHighlight: {
    backgroundColor: '#064E3B',
    borderColor: COLORS.emeraldPrimary,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  metricFootnote: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  sectionLink: {
    fontSize: 12,
    color: COLORS.emeraldBright,
    fontWeight: '600',
  },
  foldersScroll: {
    paddingLeft: 18,
    marginBottom: 10,
  },
  folderCard: {
    width: 120,
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
  },
  folderIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  folderName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  folderMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  folderAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldBright,
    marginTop: 4,
  },
  receiptsList: {
    paddingHorizontal: 18,
    gap: 8,
  },
  receiptItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  receiptItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptMerchant: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  receiptDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  taxBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  taxBadgeText: {
    fontSize: 9,
    color: COLORS.emeraldPrimary,
    fontWeight: '700',
  },
  receiptAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  receiptCategory: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    height: 64,
    backgroundColor: 'rgba(14, 21, 36, 0.95)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  navTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  navTabTextActive: {
    color: COLORS.emeraldBright,
  },
  centerShutterBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.emeraldBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: COLORS.emeraldPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  // Scanner Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  scannerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  viewfinderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  simulatedReceiptPaper: {
    width: 240,
    backgroundColor: '#FFF',
    borderRadius: 4,
    padding: 16,
  },
  receiptPaperHeader: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },
  receiptPaperMeta: {
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#999',
    marginVertical: 6,
  },
  paperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paperText: {
    fontSize: 11,
    color: '#000',
  },
  ocrTargetBox: {
    position: 'absolute',
    width: 270,
    height: 340,
    borderColor: COLORS.cyanAI,
    borderWidth: 2,
    borderRadius: 16,
  },
  cornerMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: COLORS.emeraldBright,
  },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  laserBeam: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.emeraldBright,
    top: '40%',
  },
  hudPillTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hudPillBottom: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hudPillText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
  processingModalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  processingSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  presetToolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B0F19',
  },
  presetChip: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  presetChipText: {
    fontSize: 11,
    color: COLORS.textMain,
    fontWeight: '600',
  },
  scannerBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#000',
  },
  scannerSecondaryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeShutterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.emeraldBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Detail Styles
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  detailCard: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  confidenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.emeraldPrimary,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceTagText: {
    fontSize: 11,
    color: COLORS.emeraldPrimary,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textMain,
    fontSize: 14,
  },
  taxWriteOffCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
  },
  togglePill: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  togglePillActive: {
    backgroundColor: COLORS.emeraldBright,
  },
  returnAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  saveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.emeraldBright,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 6,
  },
  saveActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  // Folder Styles
  folderRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  folderRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  folderRowMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  folderRowTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.emeraldBright,
  },
  // Analytics Styles
  taxSavingsHeroCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.emeraldPrimary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  heroSavingsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.emeraldBright,
    marginTop: 8,
  },
  heroSavingsAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginVertical: 4,
  },
  heroSavingsFootnote: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  // Inbox Styles
  inboxCard: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.borderSubtle,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.emeraldBright,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
  },
});

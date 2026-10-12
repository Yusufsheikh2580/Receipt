import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Home,
  Camera,
  Folder,
  BarChart3,
  FileText,
  Inbox,
  Settings,
  Search,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Sliders,
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  Sparkles,
  Zap,
  Eye,
  Trash2,
  Save,
  Clock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  Maximize2
} from 'lucide-react';

import {
  INITIAL_FOLDERS,
  CATEGORIES,
  INITIAL_RECEIPTS,
  SAMPLE_RECEIPT_TEMPLATES,
  INBOX_PENDING_RECEIPTS
} from './data/initialData';
import { exportReceiptsToCSV, exportReceiptsToPDF } from './utils/pdfExport';

export default function App() {
  // Navigation & Shell State
  const [currentScreen, setCurrentScreen] = useState('home'); // home | scanner | detail | folders | analytics | reports | inbox | settings
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [taxYear, setTaxYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');

  // Domain Data State
  const [receipts, setReceipts] = useState(INITIAL_RECEIPTS);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [inboxReceipts, setInboxReceipts] = useState(INBOX_PENDING_RECEIPTS);
  const [activeReceipt, setActiveReceipt] = useState(INITIAL_RECEIPTS[0]);
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);
  const [scanBatchCount, setScanBatchCount] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);

  // Filter state for receipts
  const filteredReceipts = receipts.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.merchant.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q)) ||
      r.total.toString().includes(q)
    );
  });

  // Financial Metrics
  const totalSpend = receipts.reduce((sum, r) => sum + r.total, 0);
  const totalTaxWriteOff = receipts.reduce(
    (sum, r) => sum + (r.isTaxDeductible ? r.writeOffAmount : 0),
    0
  );
  const pendingInboxCount = inboxReceipts.length;

  // Camera stream handler
  useEffect(() => {
    let stream = null;
    if (currentScreen === 'scanner' && isCameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.log('Camera access notice:', err);
          setCameraError('Live webcam permission not granted or unavailable on this device. You can test with high-res sample receipts below!');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [currentScreen, isCameraActive]);

  // Execute Simulated OCR Scan
  const handleTriggerScan = (template = null) => {
    setIsScanningAnimation(true);
    setTimeout(() => {
      setIsScanningAnimation(false);
      const chosen = template || SAMPLE_RECEIPT_TEMPLATES[Math.floor(Math.random() * SAMPLE_RECEIPT_TEMPLATES.length)];
      const newRec = {
        id: `rec_${Date.now()}`,
        merchant: chosen.merchant,
        logo: 'store-icon',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        subtotal: chosen.subtotal,
        tax: chosen.tax,
        tip: chosen.tip || 0,
        total: chosen.total,
        currency: 'USD',
        paymentMethod: chosen.paymentMethod || 'Visa •••• 4242',
        category: chosen.category,
        categoryId: chosen.categoryId,
        folderId: chosen.folderId,
        isTaxDeductible: chosen.isTaxDeductible,
        deductionPercentage: chosen.deductionPercentage,
        writeOffAmount: (chosen.total * (chosen.deductionPercentage / 100)),
        returnPolicyDays: chosen.returnPolicyDays,
        returnDeadline: chosen.returnPolicyDays ? new Date(Date.now() + chosen.returnPolicyDays * 86400000).toISOString().split('T')[0] : null,
        isReturnActive: Boolean(chosen.returnPolicyDays),
        notes: `AI auto-scanned document from ${chosen.merchant}`,
        tags: ['#auto-scanned', '#tax-writeoff'],
        ocrConfidence: chosen.ocrConfidence || 99,
        status: 'draft',
        matchedWithBank: true,
        lineItems: chosen.lineItems || [{ description: 'Scanned Purchase Total', amount: chosen.subtotal }],
      };

      setActiveReceipt(newRec);
      setScanBatchCount((prev) => prev + 1);
      setCurrentScreen('detail');
    }, 1800);
  };

  // Save / Update Receipt
  const handleSaveReceipt = () => {
    const exists = receipts.some((r) => r.id === activeReceipt.id);
    if (exists) {
      setReceipts((prev) => prev.map((r) => (r.id === activeReceipt.id ? activeReceipt : r)));
    } else {
      setReceipts((prev) => [activeReceipt, ...prev]);
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#06B6D4', '#F59E0B']
    });

    setCurrentScreen('home');
  };

  // Delete Receipt
  const handleDeleteReceipt = (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    setCurrentScreen('home');
  };

  // Approve Inbox receipt
  const handleApproveInbox = (item) => {
    const newRec = {
      id: `rec_${Date.now()}`,
      merchant: item.merchant,
      date: item.date,
      time: '12:00',
      subtotal: item.subtotal || item.total * 0.9,
      tax: item.tax || item.total * 0.1,
      tip: item.tip || 0,
      total: item.total,
      currency: 'USD',
      paymentMethod: 'Auto-Imported Account',
      category: item.categorySuggestion,
      categoryId: item.categoryId || 'cat_office',
      folderId: item.folderSuggestion,
      isTaxDeductible: true,
      deductionPercentage: 100,
      writeOffAmount: item.total,
      returnPolicyDays: 30,
      returnDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      isReturnActive: true,
      notes: `Imported via ${item.source}: ${item.itemsSnippet}`,
      tags: ['#auto-sync'],
      ocrConfidence: 99,
      status: 'filed',
      matchedWithBank: true,
      lineItems: [{ description: item.itemsSnippet, amount: item.total }],
    };

    setReceipts((prev) => [newRec, ...prev]);
    setInboxReceipts((prev) => prev.filter((i) => i.id !== item.id));

    confetti({
      particleCount: 40,
      spread: 50,
      colors: ['#10B981', '#00E599']
    });
  };

  return (
    <div className="app-viewport-container">
      {/* Companion Control Header */}
      <header className="companion-header">
        <div className="brand-badge">
          <div className="brand-icon-box">W</div>
          <div>
            <div>SimplyWise Companion</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              AI Receipt Scanner & Tax Expense Manager
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="device-toggle-group">
            <button
              className={`device-toggle-btn ${isPhoneFrame ? 'active' : ''}`}
              onClick={() => setIsPhoneFrame(true)}
              title="View in Mobile Phone Frame"
            >
              <Smartphone size={14} /> Phone View
            </button>
            <button
              className={`device-toggle-btn ${!isPhoneFrame ? 'active' : ''}`}
              onClick={() => setIsPhoneFrame(false)}
              title="Expand to Fullscreen View"
            >
              <Maximize2 size={14} /> Fullscreen
            </button>
          </div>

          <button
            onClick={() => exportReceiptsToPDF(receipts, { taxYear })}
            className="btn-primary-action"
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            <Download size={14} /> 1-Tap PDF
          </button>
        </div>
      </header>

      {/* Main Shell Container (Device Frame or Full Width) */}
      <div className={`mobile-device-shell ${!isPhoneFrame ? 'fullscreen-mode' : ''}`}>
        {/* Dynamic Island and Status Bar */}
        <div className="phone-status-bar">
          <span>9:41 AM</span>
          <div className="dynamic-island">
            <div className="sensor-lens" />
            <span style={{ fontSize: '0.65rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Sparkles size={10} /> OCR Active
            </span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            5G 100%
          </span>
        </div>

        {/* Scrollable Screen Content Area */}
        <main className="screen-content-area">
          {currentScreen === 'home' && (
            <HomeScreen
              taxYear={taxYear}
              setTaxYear={setTaxYear}
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
              onGoToInbox={() => setCurrentScreen('inbox')}
              onGoToReports={() => setCurrentScreen('reports')}
            />
          )}

          {currentScreen === 'scanner' && (
            <ScannerScreen
              videoRef={videoRef}
              isCameraActive={isCameraActive}
              setIsCameraActive={setIsCameraActive}
              cameraError={cameraError}
              isScanningAnimation={isScanningAnimation}
              scanBatchCount={scanBatchCount}
              onTriggerScan={handleTriggerScan}
              onClose={() => setCurrentScreen('home')}
            />
          )}

          {currentScreen === 'detail' && (
            <ReceiptDetailScreen
              receipt={activeReceipt}
              folders={folders}
              categories={CATEGORIES}
              onChangeReceipt={setActiveReceipt}
              onSave={handleSaveReceipt}
              onDelete={handleDeleteReceipt}
              onBack={() => setCurrentScreen('home')}
              onExportSingle={() => exportReceiptsToPDF([activeReceipt], { title: `RECEIPT: ${activeReceipt.merchant}` })}
            />
          )}

          {currentScreen === 'folders' && (
            <FoldersScreen
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
              onExportFolder={(f) => {
                const folderRecs = receipts.filter((r) => r.folderId === f.id);
                exportReceiptsToPDF(folderRecs, { title: `FOLDER REPORT: ${f.name}` });
              }}
            />
          )}

          {currentScreen === 'analytics' && (
            <AnalyticsScreen
              receipts={receipts}
              totalSpend={totalSpend}
              totalTaxWriteOff={totalTaxWriteOff}
              taxYear={taxYear}
              onExportPDF={() => exportReceiptsToPDF(receipts, { taxYear })}
              onExportCSV={() => exportReceiptsToCSV(receipts)}
            />
          )}

          {currentScreen === 'reports' && (
            <ReportsScreen
              receipts={receipts}
              taxYear={taxYear}
              onExportPDF={() => exportReceiptsToPDF(receipts, { taxYear })}
              onExportCSV={() => exportReceiptsToCSV(receipts)}
            />
          )}

          {currentScreen === 'inbox' && (
            <InboxScreen
              inboxReceipts={inboxReceipts}
              onApprove={handleApproveInbox}
              onBack={() => setCurrentScreen('home')}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen
              taxYear={taxYear}
              setTaxYear={setTaxYear}
              receiptCount={receipts.length}
              onSeedReset={() => {
                setReceipts(INITIAL_RECEIPTS);
                setInboxReceipts(INBOX_PENDING_RECEIPTS);
                alert('Sample test data successfully reloaded!');
              }}
            />
          )}
        </main>

        {/* Floating Bottom Navigation Bar (Hidden when camera scanner is active) */}
        {currentScreen !== 'scanner' && (
          <nav className="floating-bottom-nav">
            <button
              className={`nav-tab-btn ${currentScreen === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('home')}
            >
              <Home size={18} />
              <span>Home</span>
            </button>

            <button
              className={`nav-tab-btn ${currentScreen === 'folders' ? 'active' : ''}`}
              onClick={() => {
                setSelectedFolder(null);
                setCurrentScreen('folders');
              }}
            >
              <Folder size={18} />
              <span>Folders</span>
            </button>

            {/* Glowing Center Shutter Trigger */}
            <button
              className="shutter-glow-btn"
              onClick={() => {
                setIsCameraActive(true);
                setCurrentScreen('scanner');
              }}
              title="Scan Receipt with AI OCR"
            >
              <Camera size={26} strokeWidth={2.5} />
            </button>

            <button
              className={`nav-tab-btn ${currentScreen === 'analytics' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('analytics')}
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </button>

            <button
              className={`nav-tab-btn ${currentScreen === 'inbox' ? 'active' : ''}`}
              onClick={() => setCurrentScreen('inbox')}
            >
              <Inbox size={18} />
              <span>Inbox {pendingInboxCount > 0 && `(${pendingInboxCount})`}</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

/* ==========================================
   SCREEN 1: HOME DASHBOARD
   ========================================== */
function HomeScreen({
  taxYear,
  setTaxYear,
  totalSpend,
  totalTaxWriteOff,
  pendingInboxCount,
  folders,
  receipts,
  searchQuery,
  setSearchQuery,
  onSelectReceipt,
  onSelectFolder,
  onGoToInbox,
  onGoToReports
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div className="home-header">
        <div className="header-top-row">
          <div className="user-greeting">
            <span style={{ color: 'var(--emerald-bright)' }}>Simply</span>Wise
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={taxYear}
              onChange={(e) => setTaxYear(e.target.value)}
              className="tax-year-pill"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            >
              <option value="2026">Tax Year 2026</option>
              <option value="2025">Tax Year 2025</option>
              <option value="2024">Tax Year 2024</option>
            </select>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="search-bar-container">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            className="search-input"
            placeholder="Search vendor, date, note, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="metrics-strip">
        <div className="metric-card">
          <div className="metric-title">Total Spend</div>
          <div className="metric-amount">${totalSpend.toFixed(2)}</div>
          <div className="metric-badge-sub" style={{ color: 'var(--text-muted)' }}>
            <span>{receipts.length} total receipts</span>
          </div>
        </div>

        <div className="metric-card highlight-emerald">
          <div className="metric-title">Tax Write-Offs</div>
          <div className="metric-amount" style={{ color: '#FFF' }}>
            ${totalTaxWriteOff.toFixed(2)}
          </div>
          <div className="metric-badge-sub" style={{ color: 'rgba(255,255,255,0.9)' }}>
            <CheckCircle2 size={11} /> IRS Deductible
          </div>
        </div>

        <div
          className="metric-card"
          style={{ cursor: 'pointer', border: pendingInboxCount > 0 ? '1px solid var(--amber-warning)' : '' }}
          onClick={onGoToInbox}
        >
          <div className="metric-title">Inbox</div>
          <div className="metric-amount" style={{ color: pendingInboxCount > 0 ? 'var(--amber-warning)' : '' }}>
            {pendingInboxCount}
          </div>
          <div className="metric-badge-sub" style={{ color: 'var(--text-muted)' }}>
            <span>To be saved</span>
          </div>
        </div>
      </div>

      {/* Smart Folders Carousel */}
      <div className="section-header-row">
        <span className="section-title">Smart Folders</span>
        <button className="section-link-btn" onClick={() => onSelectFolder(null)}>
          View All ({folders.length})
        </button>
      </div>

      <div className="folders-scroll-row">
        {folders.map((f) => (
          <div key={f.id} className="folder-box" onClick={() => onSelectFolder(f)}>
            <div className="folder-icon-circle" style={{ background: `${f.color}25`, color: f.color }}>
              <Folder size={16} />
            </div>
            <div className="folder-name">{f.name}</div>
            <div className="folder-meta">{f.receiptCount} receipts</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              ${f.totalAmount.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Scanned Receipts */}
      <div className="section-header-row">
        <span className="section-title">
          {searchQuery ? `Search Results (${receipts.length})` : 'Recent Scanned Receipts'}
        </span>
        <button className="section-link-btn" onClick={onGoToReports}>
          Reports & Export
        </button>
      </div>

      <div className="receipts-list">
        {receipts.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No receipts matching your search.
          </div>
        ) : (
          receipts.map((r) => (
            <div key={r.id} className="receipt-item-card" onClick={() => onSelectReceipt(r)}>
              <div className="receipt-item-left">
                <div className="merchant-logo-avatar">
                  {r.category.includes('Dining') ? '🍽️' : r.category.includes('Tech') ? '💻' : r.category.includes('Travel') ? '✈️' : r.category.includes('Medical') ? '💊' : '🛒'}
                </div>
                <div className="receipt-info-text">
                  <div className="merchant-name-text">{r.merchant}</div>
                  <div className="receipt-date-sub">
                    <span>{r.date}</span>
                    {r.isTaxDeductible && (
                      <span className="pill-deductible">Tax Write-off</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="receipt-item-right">
                <div className="receipt-amount-text">${r.total.toFixed(2)}</div>
                <div className="receipt-category-tag">{r.category}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ==========================================
   SCREEN 2: AI RECEIPT SCANNER VIEW
   ========================================== */
function ScannerScreen({
  videoRef,
  isCameraActive,
  setIsCameraActive,
  cameraError,
  isScanningAnimation,
  scanBatchCount,
  onTriggerScan,
  onClose
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(SAMPLE_RECEIPT_TEMPLATES[0]);

  return (
    <div className="scanner-screen-container">
      {/* Top Overlay Bar */}
      <div className="scanner-top-bar">
        <button className="scanner-pill-action" onClick={onClose}>
          <ArrowLeft size={14} /> Back
        </button>

        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF' }}>
          AI Receipt Scanner
        </span>

        <button
          className={`scanner-pill-action ${isCameraActive ? 'active' : ''}`}
          onClick={() => setIsCameraActive(!isCameraActive)}
        >
          <Camera size={14} /> {isCameraActive ? 'Webcam On' : 'Sample Mode'}
        </button>
      </div>

      {/* Viewfinder Center */}
      <div className="camera-viewfinder-zone">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="live-video-stream"
          />
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Visual Receipt Canvas Mockup */}
            <div style={{
              width: '260px',
              padding: '24px 18px',
              background: '#FFF',
              color: '#000',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              borderRadius: '4px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              transform: 'rotate(-1deg)'
            }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1rem', marginBottom: '8px' }}>
                *** {selectedTemplate.merchant.toUpperCase()} ***
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#666', marginBottom: '12px' }}>
                Store #4810 • Austin, TX<br />
                {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </div>
              <div style={{ borderBottom: '1px dashed #999', margin: '8px 0' }} />
              {selectedTemplate.lineItems?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{item.description}</span>
                  <span>${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderBottom: '1px dashed #999', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>${selectedTemplate.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax:</span>
                <span>${selectedTemplate.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.92rem', marginTop: '4px' }}>
                <span>TOTAL:</span>
                <span>${selectedTemplate.total.toFixed(2)}</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.65rem', marginTop: '14px', color: '#555' }}>
                {selectedTemplate.returnPolicyDays ? `${selectedTemplate.returnPolicyDays}-Day Return Policy with receipt.` : 'Final Sale.'}
              </div>
            </div>
          </div>
        )}

        {/* OCR Edge Bounding Box HUD */}
        <div className="ocr-bounding-target">
          <div className="target-corner top-left" />
          <div className="target-corner top-right" />
          <div className="target-corner bottom-left" />
          <div className="target-corner bottom-right" />

          {/* Animated Laser Scanning Beam */}
          <div className="laser-scan-line" />

          {/* Real-time Field Detection Pills */}
          <div className="detected-hud-pill" style={{ top: '15px', left: '15px' }}>
            <Sparkles size={11} color="#00E599" />
            <span>VENDOR: {selectedTemplate.merchant}</span>
          </div>

          <div className="detected-hud-pill" style={{ bottom: '15px', right: '15px' }}>
            <DollarSign size={11} color="#10B981" />
            <span>TOTAL: ${selectedTemplate.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Scanning In Progress Modal */}
        {isScanningAnimation && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(7, 10, 17, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 30
          }}>
            <RefreshCw size={36} color="#00E599" className="spin-animation" style={{ animation: 'spin 1.2s linear infinite' }} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#FFF' }}>
              Extracting Receipt Metadata...
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Detecting vendor, taxes, line items & deduction rules
            </div>
          </div>
        )}
      </div>

      {/* Preset Receipt Picker Strip */}
      <div style={{ background: '#090D16', padding: '8px 16px', borderTop: '1px solid var(--border-subtle)', overflowX: 'auto', display: 'flex', gap: '8px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          Presets:
        </span>
        {SAMPLE_RECEIPT_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => setSelectedTemplate(tmpl)}
            style={{
              background: selectedTemplate.id === tmpl.id ? 'var(--emerald-primary)' : 'var(--bg-card)',
              color: selectedTemplate.id === tmpl.id ? '#000' : 'var(--text-main)',
              border: 'none',
              borderRadius: '14px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tmpl.merchant} (${tmpl.total.toFixed(0)})
          </button>
        ))}
      </div>

      {/* Bottom Shutter & Controls */}
      <div className="scanner-bottom-controls">
        <label
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#FFF',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Upload receipt image from disk"
        >
          <FileText size={20} />
          <input
            type="file"
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleTriggerScan();
              }
            }}
          />
        </label>

        {/* Master Shutter Button */}
        <button
          onClick={() => onTriggerScan(selectedTemplate)}
          className="shutter-glow-btn"
          style={{ width: '64px', height: '64px', margin: 0 }}
        >
          <Camera size={30} />
        </button>

        <div style={{ textAlign: 'center', color: '#FFF', fontSize: '0.75rem', fontWeight: 600 }}>
          Batch {scanBatchCount}
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   SCREEN 3: RECEIPT DETAIL & TAX REVIEW
   ========================================== */
function ReceiptDetailScreen({
  receipt,
  folders,
  categories,
  onChangeReceipt,
  onSave,
  onDelete,
  onBack,
  onExportSingle
}) {
  const [showFullReceiptImage, setShowFullReceiptImage] = useState(false);

  return (
    <div className="detail-screen-layout">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
          Receipt Detail
        </span>

        <button
          onClick={() => onDelete(receipt.id)}
          style={{ background: 'none', border: 'none', color: 'var(--coral-alert)', cursor: 'pointer' }}
          title="Delete receipt"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Verified Banner & Preview */}
      <div className="receipt-preview-banner">
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{receipt.merchant}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Scanned {receipt.date} at {receipt.time}
          </div>
        </div>

        <div className="verified-confidence-tag">
          <ShieldCheck size={14} /> {receipt.ocrConfidence}% Verified
        </div>
      </div>

      {/* Core Editable Form */}
      <div className="form-field-group">
        <label className="field-label">Merchant Name</label>
        <input
          type="text"
          className="form-input"
          value={receipt.merchant}
          onChange={(e) => onChangeReceipt({ ...receipt, merchant: e.target.value })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="form-field-group">
          <label className="field-label">Purchase Date</label>
          <input
            type="date"
            className="form-input"
            value={receipt.date}
            onChange={(e) => onChangeReceipt({ ...receipt, date: e.target.value })}
          />
        </div>

        <div className="form-field-group">
          <label className="field-label">Grand Total ($)</label>
          <input
            type="number"
            step="0.01"
            className="form-input"
            style={{ fontWeight: 700, color: 'var(--emerald-bright)' }}
            value={receipt.total}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onChangeReceipt({
                ...receipt,
                total: val,
                writeOffAmount: val * (receipt.deductionPercentage / 100)
              });
            }}
          />
        </div>
      </div>

      {/* Tax Deductible Slider Card */}
      <div className="tax-deductible-card">
        <div className="toggle-row">
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--emerald-bright)' }}>
              Tax Deductible Write-Off
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              IRS deduction qualification
            </div>
          </div>

          <input
            type="checkbox"
            checked={receipt.isTaxDeductible}
            onChange={(e) => {
              const checked = e.target.checked;
              onChangeReceipt({
                ...receipt,
                isTaxDeductible: checked,
                writeOffAmount: checked ? receipt.total * (receipt.deductionPercentage / 100) : 0
              });
            }}
            style={{ width: '20px', height: '20px', accentColor: 'var(--emerald-primary)' }}
          />
        </div>

        {receipt.isTaxDeductible && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span>Deduction Rate: <strong>{receipt.deductionPercentage}%</strong></span>
              <span style={{ color: 'var(--emerald-bright)', fontWeight: 700 }}>
                Estimated Write-off: ${receipt.writeOffAmount.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              className="slider-range-control"
              value={receipt.deductionPercentage}
              onChange={(e) => {
                const pct = parseInt(e.target.value);
                onChangeReceipt({
                  ...receipt,
                  deductionPercentage: pct,
                  writeOffAmount: receipt.total * (pct / 100)
                });
              }}
            />
          </div>
        )}
      </div>

      {/* Category & Folder Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="form-field-group">
          <label className="field-label">Category</label>
          <select
            className="form-input"
            value={receipt.category}
            onChange={(e) => onChangeReceipt({ ...receipt, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-field-group">
          <label className="field-label">Filing Folder</label>
          <select
            className="form-input"
            value={receipt.folderId}
            onChange={(e) => onChangeReceipt({ ...receipt, folderId: e.target.value })}
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Return Policy Alert */}
      {receipt.returnPolicyDays > 0 && (
        <div className="return-policy-alert">
          <Clock size={16} />
          <div>
            <strong>Store Return Policy: {receipt.returnPolicyDays} Days</strong>
            <div>Return deadline: {receipt.returnDeadline || 'Within period'}</div>
          </div>
        </div>
      )}

      {/* Itemized Lines */}
      {receipt.lineItems?.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            ITEMIZED BREAKDOWN
          </div>
          <table className="line-items-table">
            <tbody>
              {receipt.lineItems.map((li, idx) => (
                <tr key={idx}>
                  <td>{li.description}</td>
                  <td>${li.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes Field */}
      <div className="form-field-group">
        <label className="field-label">Audit Notes & Tags</label>
        <textarea
          className="form-input"
          rows={2}
          value={receipt.notes || ''}
          onChange={(e) => onChangeReceipt({ ...receipt, notes: e.target.value })}
          placeholder="Client meeting purpose, project code, or tax notes..."
        />
      </div>

      {/* Bottom Save / Export Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px', marginTop: '10px' }}>
        <button onClick={onSave} className="btn-primary-action">
          <Save size={16} /> Save to Folder
        </button>

        <button onClick={onExportSingle} className="btn-secondary-action">
          <Download size={16} /> PDF
        </button>
      </div>
    </div>
  );
}

/* ==========================================
   SCREEN 4: FOLDERS & FILING CABINET
   ========================================== */
function FoldersScreen({ folders, receipts, selectedFolder, onSelectFolder, onSelectReceipt, onBack, onExportFolder }) {
  const currentReceipts = selectedFolder
    ? receipts.filter((r) => r.folderId === selectedFolder.id)
    : receipts;

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {selectedFolder ? (
          <button
            onClick={() => onSelectFolder(null)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> All Folders
          </button>
        ) : (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
            Digital Filing Cabinet
          </span>
        )}

        {selectedFolder && (
          <button
            onClick={() => onExportFolder(selectedFolder)}
            className="btn-primary-action"
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <Download size={14} /> Export Folder
          </button>
        )}
      </div>

      {/* Folder Header if one is selected */}
      {selectedFolder && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${selectedFolder.color}25`, color: selectedFolder.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Folder size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedFolder.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedFolder.description}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.82rem' }}>
            <span>Total Stored: <strong>{currentReceipts.length} receipts</strong></span>
            <span>Cumulative: <strong style={{ color: 'var(--emerald-bright)' }}>${currentReceipts.reduce((s, r) => s + r.total, 0).toFixed(2)}</strong></span>
          </div>
        </div>
      )}

      {/* Folder Grid (when viewing all folders) */}
      {!selectedFolder && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {folders.map((f) => {
            const count = receipts.filter((r) => r.folderId === f.id).length;
            const sum = receipts.filter((r) => r.folderId === f.id).reduce((s, r) => s + r.total, 0);

            return (
              <div
                key={f.id}
                onClick={() => onSelectFolder(f)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '14px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${f.color}25`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Folder size={18} />
                  </div>
                  <ChevronRight size={16} color="var(--text-subtle)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>{f.name}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{count} documents</div>
                <div style={{ fontWeight: 800, color: 'var(--emerald-bright)', marginTop: '6px', fontSize: '0.95rem' }}>
                  ${sum.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipts in current folder */}
      {selectedFolder && (
        <div className="receipts-list" style={{ padding: 0 }}>
          {currentReceipts.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No receipts filed in this folder yet.
            </div>
          ) : (
            currentReceipts.map((r) => (
              <div key={r.id} className="receipt-item-card" onClick={() => onSelectReceipt(r)}>
                <div className="receipt-item-left">
                  <div className="merchant-logo-avatar">
                    {r.category.includes('Dining') ? '🍽️' : r.category.includes('Tech') ? '💻' : '🛒'}
                  </div>
                  <div>
                    <div className="merchant-name-text">{r.merchant}</div>
                    <div className="receipt-date-sub">{r.date}</div>
                  </div>
                </div>
                <div className="receipt-item-right">
                  <div className="receipt-amount-text">${r.total.toFixed(2)}</div>
                  {r.isTaxDeductible && <span className="pill-deductible">Deductible</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================
   SCREEN 5: ANALYTICS & INSIGHTS
   ========================================== */
function AnalyticsScreen({ receipts, totalSpend, totalTaxWriteOff, taxYear, onExportPDF, onExportCSV }) {
  const [timeFilter, setTimeFilter] = useState('YTD'); // Month | Q3 | YTD

  // Group receipts by category
  const categoryTotals = receipts.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.total;
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
          Expense Analytics
        </span>
        <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: '8px', padding: '2px' }}>
          {['Month', 'Q3', 'YTD'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              style={{
                background: timeFilter === t ? 'var(--emerald-primary)' : 'none',
                color: timeFilter === t ? '#000' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Visual SVG Donut Chart Card */}
      <div className="chart-card-box">
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Category Spending Breakdown
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '170px' }}>
          <svg width="170" height="170" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#162136" strokeWidth="12" />
            {/* Animated segmented representation */}
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="95 145" strokeDashoffset="0" />
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="55 185" strokeDashoffset="-95" />
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="50 190" strokeDashoffset="-150" />
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="40 200" strokeDashoffset="-200" />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Spent</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem' }}>
              ${totalSpend.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categoryEntries.slice(0, 4).map(([cat, amount], idx) => {
            const colors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];
            const pct = Math.round((amount / totalSpend) * 100) || 0;
            return (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[idx % colors.length] }} />
                  <span>{cat}</span>
                </div>
                <div>
                  <strong>${amount.toFixed(2)}</strong> <span style={{ color: 'var(--text-muted)' }}>({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tax Write-Off Highlight Card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.1))', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '16px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#10B981' }}>
            Estimated Tax Write-Off Savings
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, color: '#FFF' }}>
          ${totalTaxWriteOff.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Calculated across {receipts.filter((r) => r.isTaxDeductible).length} qualified business deductible expenses.
        </div>
      </div>

      {/* Quick Export Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button onClick={onExportPDF} className="btn-primary-action" style={{ fontSize: '0.82rem', padding: '10px' }}>
          <Download size={14} /> Download PDF
        </button>
        <button onClick={onExportCSV} className="btn-secondary-action" style={{ fontSize: '0.82rem', padding: '10px' }}>
          <FileText size={14} /> Export CSV
        </button>
      </div>
    </div>
  );
}

/* ==========================================
   SCREEN 6: REPORTS & EXPORT HUB
   ========================================== */
function ReportsScreen({ receipts, taxYear, onExportPDF, onExportCSV }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
        Reports & Export Hub
      </span>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>IRS-Ready Audit PDF</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Complete itemized ledger with write-off deductions
            </div>
          </div>
        </div>

        <button onClick={onExportPDF} className="btn-primary-action">
          <Download size={16} /> Generate & Download PDF
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Excel / CSV Spreadsheet</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Import into QuickBooks, Xero, or send to bookkeeper
            </div>
          </div>
        </div>

        <button onClick={onExportCSV} className="btn-secondary-action">
          <Download size={16} /> Download .CSV Spreadsheet
        </button>
      </div>

      {/* Share to Accountant Notice */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
          Email Directly to Accountant
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Send current tax year ({taxYear}) ledger with 1 tap via your default mail client.
        </div>
        <button
          onClick={() => {
            window.location.href = `mailto:accountant@example.com?subject=SimplyWise%20Tax%20Report%20${taxYear}&body=Please%20find%20attached%20my%20audited%20expense%20summary.`;
          }}
          className="btn-secondary-action"
        >
          <Share2 size={16} /> Share via Email
        </button>
      </div>
    </div>
  );
}

/* ==========================================
   SCREEN 7: DIGITAL INBOX (SIMPLYWISE PARITY)
   ========================================== */
function InboxScreen({ inboxReceipts, onApprove, onBack }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
          Digital Receipt Inbox
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--amber-warning)', fontWeight: 600 }}>
          {inboxReceipts.length} To Be Saved
        </span>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        E-receipts auto-synced from connected accounts (Gmail, Outlook, Amazon, PayPal). Approve with 1 tap to file into your smart folders.
      </div>

      {inboxReceipts.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>All Caught Up!</div>
          <div>No pending digital receipts waiting in your inbox.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {inboxReceipts.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.merchant}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--emerald-bright)' }}>
                  ${item.total.toFixed(2)}
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Source: <span style={{ color: 'var(--cyan-ai)' }}>{item.source}</span> • {item.date}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                {item.itemsSnippet}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Suggested: <strong>{item.categorySuggestion}</strong>
                </span>
                <button
                  onClick={() => onApprove(item)}
                  className="btn-primary-action"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  <CheckCircle2 size={13} /> Approve & File
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connected Accounts Hub */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '16px', marginTop: '10px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
          Connected Auto-Import Accounts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { name: 'Google Gmail (Invoices)', status: 'Connected • Syncing daily' },
            { name: 'Microsoft Outlook', status: 'Connected • Syncing daily' },
            { name: 'Amazon Business', status: 'Connected' },
            { name: 'PayPal Account', status: 'Connected' },
          ].map((acc) => (
            <div key={acc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>{acc.name}</span>
              <span style={{ color: 'var(--emerald-bright)' }}>{acc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   SCREEN 8: SETTINGS & PREFERENCES
   ========================================== */
function SettingsScreen({ taxYear, setTaxYear, receiptCount, onSeedReset }) {
  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
        Settings & Security
      </span>

      <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Business Profile</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Company: <strong>SimplyWise Demo LLC</strong><br />
          Base Currency: <strong>USD ($)</strong><br />
          Stored Documents: <strong>{receiptCount} receipts</strong>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Cloud & Encryption</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color="#10B981" /> 256-Bit Bank-Grade Cloud Encryption Active
        </div>
      </div>

      <button onClick={onSeedReset} className="btn-secondary-action" style={{ marginTop: '10px' }}>
        <RefreshCw size={14} /> Reload Sample Seed Data
      </button>
    </div>
  );
}

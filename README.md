# SimplyWise: AI Receipts & Expense Management Mobile & Web App

An all-in-one expense management, AI receipt scanning, and tax write-off optimization suite inspired by [SimplyWise: Receipts & Expenses](https://apps.apple.com/us/app/simplywise-receipts-expenses/id1538521095).

Built with **React Native & Expo Go** for iOS/Android mobile deployment, along with a high-fidelity **React + Vite** web companion featuring an authentic mobile phone preview frame and full-screen mode.

---

## 📱 Features Included

1. **AI Receipt Scanner & OCR Viewfinder**:
   - Camera viewfinder with real-time neon bounding box edge detection guides.
   - Laser sweep scanning animation.
   - Preset quick-scans (Home Depot, Starbucks, Apple, Target, Whole Foods).
   - Real-time field HUD (`Vendor`, `Date`, `Total`).
   - File & photo upload support.
2. **Receipt Review & Tax Write-Off Inspector**:
   - `99% AI Verified` confidence badge.
   - Editable store name, date, subtotal, tax, and total.
   - Interactive **Tax Deductible Slider** (0% to 100% deduction rate with live write-off calculation).
   - Store return deadline reminder pill (e.g. *30-day return policy alert*).
   - Itemized line items breakdown.
3. **Smart Folders & Digital Filing Cabinet**:
   - Multi-folder categorization (*Business 2026*, *Meals & Travel*, *Office & Tech*, *Medical*, *Personal*).
   - Document counts and cumulative spend per folder.
4. **Expense Analytics & Tax Reports Hub**:
   - Category spending distribution donut chart.
   - Month-over-month spending trend analysis.
   - Estimated tax write-off savings highlight card.
5. **1-Tap Export Hub**:
   - IRS audit-ready multi-page **PDF generation** with summary metrics and transaction table.
   - **Excel / CSV spreadsheet export**.
   - Direct Email to CPA / Bookkeeper.
6. **Digital Inbox & Connected Accounts**:
   - "To Be Saved" queue for auto-imported electronic receipts.
   - Simulated integration with Gmail, Outlook, Amazon, and PayPal.
7. **Security & Offline Storage**:
   - 256-bit bank-grade encryption indicators.
   - Multi-currency support and pre-seeded sample receipts for instant testing.

---

## 🚀 How to Run

### 1. Running the React + Vite Web Companion (Currently Running Live!)

The web companion is already running live in your workspace!

```bash
cd web
npm install
npm run dev
```

Open your browser to:  
👉 **`http://localhost:5173/`**

- **Phone View / Fullscreen Toggle**: Click the device switcher in the top bar to toggle between the iPhone 16 Pro device shell and full-screen web mode.
- **Test Scanning**: Click the glowing camera icon in the bottom bar, select any sample preset or your own camera, and click the camera shutter button.
- **Export PDF / CSV**: Click **1-Tap PDF** or navigate to the **Reports** tab to download your reports.

---

### 2. Running the Mobile App with Expo Go

To run the mobile app on your physical iPhone or Android device via **Expo Go**:

```bash
cd mobile
npm install
npx expo start
```

1. Install **Expo Go** from the iOS App Store or Google Play Store.
2. Scan the terminal's QR code with your phone camera (iOS) or the Expo Go app (Android).
3. The SimplyWise mobile app will launch natively on your device!

---

## 📂 Project Architecture

```
Business website/
├── mobile/                      # React Native + Expo Go Mobile Application
│   ├── App.js                   # Master mobile application entry & screen routing
│   ├── app.json                 # Expo project configuration & permissions
│   ├── package.json             # Mobile dependencies
│   └── src/
│       ├── data/initialData.js  # Pre-seeded receipts & folders
│       └── theme/colors.js      # Fintech dark/emerald color tokens
│
├── web/                         # React + Vite Web Companion (Interactive Prototype)
│   ├── index.html               # Web entry with Google Fonts (Inter, Outfit)
│   ├── vite.config.js           # Vite dev server configuration
│   ├── package.json             # Web dependencies (jspdf, canvas-confetti, lucide-react)
│   └── src/
│       ├── App.jsx              # Complete 8-screen suite & device shell switcher
│       ├── index.css            # Dark obsidian styling, laser animation, and phone frame
│       ├── main.jsx             # React DOM root
│       ├── data/initialData.js  # Rich realistic seed data
│       └── utils/pdfExport.js   # Client-side PDF & CSV export generators
│
└── README.md                    # Project documentation
```

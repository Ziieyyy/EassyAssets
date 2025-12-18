import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";
type Language = "ms" | "en";

interface SettingsContextType {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.view": "View",
    "common.add": "Add",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.back": "Back",
    "common.close": "Close",
    
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.assets": "Assets",
    "nav.settings": "Settings",
    "nav.logout": "Logout",
    
    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.welcome": "Welcome back",
    "dashboard.totalAssets": "Total Assets",
    "dashboard.totalValue": "Total Value",
    "dashboard.depreciation": "depreciation",
    "dashboard.depreciatedValue": "Depreciated Value",
    "dashboard.thisFiscalYear": "This fiscal year",
    "dashboard.thisMonth": "this month",
    "dashboard.maintenanceDue": "Maintenance Due",
    "dashboard.highPriority": "high priority",
    "dashboard.noHighPriority": "No high priority tasks",
    "dashboard.recentAssets": "Recent Assets",
    "dashboard.latestAdditions": "Latest additions to inventory",
    "dashboard.viewAll": "View All",
    "dashboard.addAsset": "Add Asset",
    "dashboard.assetValueTrend": "Asset Value Trend",
    "dashboard.assetValueDesc": "Total asset value over the past 12 months",
    "dashboard.assetsByCategory": "Assets by Category",
    "dashboard.categoryDistribution": "Distribution of asset value across categories",
    "dashboard.loading": "Loading...",
    
    // Assets
    "assets.title": "Assets",
    "assets.allAssets": "All Assets",
    "assets.addNew": "Add New Asset",
    "assets.name": "Asset Name",
    "assets.category": "Category",
    "assets.location": "Location",
    "assets.status": "Status",
    "assets.purchasePrice": "Purchase Price",
    "assets.currentValue": "Current Value",
    "assets.remainingValue": "Remaining Value",
    "assets.assignedTo": "Assigned To",
    "assets.actions": "Actions",
    "assets.viewDetails": "View Details",
    "assets.editAsset": "Edit Asset",
    "assets.deleteAsset": "Delete Asset",
    "assets.manageTrack": "Manage and track all company assets",
    "assets.export": "Export",
    "assets.showing": "Showing",
    "assets.of": "of",
    "assets.assetsLabel": "assets",
    "assets.previous": "Previous",
    "assets.next": "Next",
    "assets.allCategories": "All Categories",
    "assets.allStatus": "All Status",
    
    // Asset Status
    "status.active": "Active",
    "status.maintenance": "Maintenance",
    "status.inactive": "Inactive",
    "status.disposed": "Disposed",
    
    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your application preferences and display options",
    "settings.appearance": "Appearance",
    "settings.appearanceDesc": "Customize how the application looks and feels",
    "settings.themeMode": "Theme Mode",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.themeDesc": "Choose your preferred theme mode",
    "settings.language": "Language / Bahasa",
    "settings.languageDesc": "Select your preferred display language",
    "settings.displayLanguage": "Display Language",
    "settings.currentLanguage": "Current Language",
    "settings.autoSave": "Settings are automatically saved and will be applied on your next visit",
    
    // Notifications
    "notify.themeChanged": "Theme changed to",
    "notify.assetCreated": "Asset created successfully",
    "notify.assetUpdated": "Asset updated successfully",
    "notify.assetDeleted": "Asset deleted successfully",
    "notify.error": "An error occurred",
    
    // Edit Asset
    "editAsset.title": "Edit Asset",
    "editAsset.lastUpdated": "Last updated",
    "editAsset.basicInfo": "Basic Information",
    "editAsset.basicInfoDesc": "Update the essential details about the asset",
    "editAsset.assetId": "Asset ID",
    "editAsset.assetName": "Asset Name",
    "editAsset.assetImage": "Asset Image",
    "editAsset.dropImage": "Drop image or click",
    "editAsset.assignedInvoice": "Assigned Invoice",
    "editAsset.invoiceOptional": "Optional: Reference invoice number for this asset",
    "editAsset.category": "Category",
    "editAsset.status": "Status",
    "editAsset.location": "Location",
    "editAsset.assignedTo": "Assigned To",
    "editAsset.financialInfo": "Financial Information",
    "editAsset.financialInfoDesc": "Update purchase and valuation details",
    "editAsset.purchaseDate": "Purchase Date",
    "editAsset.purchasePrice": "Purchase Price",
    "editAsset.remainingValue": "Remaining Value (Auto-calculated)",
    "editAsset.basedOn": "Based on",
    "editAsset.depreciationMethod": "depreciation method",
    "editAsset.depreciationCalc": "Depreciation Calculator",
    "editAsset.depreciationCalcDesc": "Automatic depreciation based on purchase details",
    "editAsset.depreciationMethodLabel": "Depreciation Method",
    "editAsset.straightLine": "Straight-Line",
    "editAsset.straightLineDesc": "Reduces an asset's value by the same amount each period.\n\n( Purchase Price − Residual Value ) ÷ Useful Life",
    "editAsset.usefulLife": "Useful Life (Years)",
    "editAsset.usefulLifeAuto": "(Auto-calculated based on category)",
    "editAsset.usefulLifeDesc": "Auto-set based on asset category. You can adjust this if needed.",
    "editAsset.futurePurchaseDate": "Future Purchase Date",
    "editAsset.futurePurchaseDateDesc": "The purchase date is set to a future date. Depreciation will be calculated once the purchase date has passed.",
    "editAsset.monthlyDepreciation": "Monthly Depreciation",
    "editAsset.yearlyDepreciation": "Yearly Depreciation",
    "editAsset.accumulatedDepreciation": "Accumulated Depreciation",
    "editAsset.over": "Over",
    "editAsset.years": "years",
    "editAsset.months": "months",
    "editAsset.annualRate": "annual rate",
    "editAsset.howCalculated": "How is this calculated?",
    "editAsset.calculationFullDesc": "Depreciation is calculated from the purchase date to today using the Straight-Line method, based on the asset's purchase price and useful life.",
    "editAsset.additionalDetails": "Additional Details",
    "editAsset.additionalDetailsDesc": "Optional information about the asset",
    "editAsset.serialNumber": "Serial Number",
    "editAsset.description": "Description",
    "editAsset.enterAdditionalDetails": "Enter additional details...",
    "editAsset.dangerZone": "Danger Zone",
    "editAsset.dangerZoneDesc": "Irreversible actions. Please proceed with caution.",
    "editAsset.deleteAsset": "Delete this asset",
    "editAsset.deleteAssetDesc": "Once deleted, this asset cannot be recovered.",
    "editAsset.deleteAssetBtn": "Delete Asset",
    "editAsset.confirmDelete": "Are you absolutely sure?",
    "editAsset.confirmDeleteDesc": "This action cannot be undone. This will permanently delete the asset",
    "editAsset.confirmDeleteDesc2": "and remove all associated data from the database.",
    "editAsset.deletePermanently": "Delete Permanently",
    "editAsset.fixErrors": "Please fix the errors above before saving.",
    "editAsset.requiredFields": "Required fields",
    "editAsset.markedWith": "are marked with",
    "editAsset.cancel": "Cancel",
    "editAsset.saveChanges": "Save Changes",
    "editAsset.saving": "Saving...",
    "editAsset.assetNotFound": "Asset Not Found",
    "editAsset.backToAssets": "Back to Assets",
    "editAsset.required": "*",
    "editAsset.idRequired": "Asset ID is required",
    "editAsset.nameRequired": "Asset name is required",
    "editAsset.categoryRequired": "Category is required",
    "editAsset.locationRequired": "Location is required",
    "editAsset.purchaseDateRequired": "Purchase date is required",
    "editAsset.purchasePriceRequired": "Purchase price must be greater than 0",
    "editAsset.assignedToRequired": "Assigned to is required",
    
    // Categories
    "category.itEquipment": "IT Equipment",
    "category.furniture": "Furniture",
    "category.vehicles": "Vehicles",
    "category.officeEquipment": "Office Equipment",
    "category.machinery": "Machinery",
    "category.other": "Other",
    "category.customCategory": "Enter custom category...",
  },
  ms: {
    // Common
    "common.save": "Simpan",
    "common.cancel": "Batal",
    "common.delete": "Padam",
    "common.edit": "Edit",
    "common.view": "Lihat",
    "common.add": "Tambah",
    "common.search": "Cari",
    "common.filter": "Tapis",
    "common.back": "Kembali",
    "common.close": "Tutup",
    
    // Navigation
    "nav.dashboard": "Papan Pemuka",
    "nav.assets": "Aset",
    "nav.settings": "Tetapan",
    "nav.logout": "Log Keluar",
    
    // Dashboard
    "dashboard.title": "Papan Pemuka",
    "dashboard.welcome": "Selamat kembali",
    "dashboard.totalAssets": "Jumlah Aset",
    "dashboard.totalValue": "Jumlah Nilai",
    "dashboard.depreciation": "susut nilai",
    "dashboard.depreciatedValue": "Nilai Susut Nilai",
    "dashboard.thisFiscalYear": "Tahun fiskal ini",
    "dashboard.thisMonth": "bulan ini",
    "dashboard.maintenanceDue": "Penyelenggaraan Dijadual",
    "dashboard.highPriority": "keutamaan tinggi",
    "dashboard.noHighPriority": "Tiada tugasan keutamaan tinggi",
    "dashboard.recentAssets": "Aset Terkini",
    "dashboard.latestAdditions": "Penambahan terkini ke inventori",
    "dashboard.viewAll": "Lihat Semua",
    "dashboard.addAsset": "Tambah Aset",
    "dashboard.assetValueTrend": "Trend Nilai Aset",
    "dashboard.assetValueDesc": "Jumlah nilai aset sepanjang 12 bulan yang lalu",
    "dashboard.assetsByCategory": "Aset Mengikut Kategori",
    "dashboard.categoryDistribution": "Pembahagian nilai aset merentas kategori",
    "dashboard.loading": "Memuatkan...",
    
    // Assets
    "assets.title": "Aset",
    "assets.allAssets": "Semua Aset",
    "assets.addNew": "Tambah Aset Baru",
    "assets.name": "Nama Aset",
    "assets.category": "Kategori",
    "assets.location": "Lokasi",
    "assets.status": "Status",
    "assets.purchasePrice": "Harga Belian",
    "assets.currentValue": "Nilai Semasa",
    "assets.remainingValue": "Nilai Berbaki",
    "assets.assignedTo": "Diberikan Kepada",
    "assets.actions": "Tindakan",
    "assets.viewDetails": "Lihat Butiran",
    "assets.editAsset": "Edit Aset",
    "assets.deleteAsset": "Padam Aset",
    "assets.manageTrack": "Urus dan jejaki semua aset syarikat",
    "assets.export": "Eksport",
    "assets.showing": "Menunjukkan",
    "assets.of": "daripada",
    "assets.assetsLabel": "aset",
    "assets.previous": "Sebelum",
    "assets.next": "Seterusnya",
    "assets.allCategories": "Semua Kategori",
    "assets.allStatus": "Semua Status",
    
    // Asset Status
    "status.active": "Aktif",
    "status.maintenance": "Penyelenggaraan",
    "status.inactive": "Tidak Aktif",
    "status.disposed": "Dilupuskan",
    
    // Settings
    "settings.title": "Tetapan",
    "settings.subtitle": "Urus keutamaan aplikasi dan pilihan paparan anda",
    "settings.appearance": "Penampilan",
    "settings.appearanceDesc": "Sesuaikan rupa dan rasa aplikasi",
    "settings.themeMode": "Mod Tema",
    "settings.light": "Cerah",
    "settings.dark": "Gelap",
    "settings.themeDesc": "Pilih mod tema pilihan anda",
    "settings.language": "Bahasa / Language",
    "settings.languageDesc": "Pilih bahasa paparan pilihan anda",
    "settings.displayLanguage": "Bahasa Paparan",
    "settings.currentLanguage": "Bahasa Semasa",
    "settings.autoSave": "Tetapan akan disimpan secara automatik dan digunakan pada lawatan seterusnya",
    
    // Notifications
    "notify.themeChanged": "Tema ditukar kepada",
    "notify.assetCreated": "Aset berjaya dicipta",
    "notify.assetUpdated": "Aset berjaya dikemaskini",
    "notify.assetDeleted": "Aset berjaya dipadam",
    "notify.error": "Ralat berlaku",
    
    // Edit Asset
    "editAsset.title": "Edit Aset",
    "editAsset.lastUpdated": "Dikemaskini terakhir",
    "editAsset.basicInfo": "Maklumat Asas",
    "editAsset.basicInfoDesc": "Kemaskini butiran penting tentang aset",
    "editAsset.assetId": "ID Aset",
    "editAsset.assetName": "Nama Aset",
    "editAsset.assetImage": "Gambar Aset",
    "editAsset.dropImage": "Lepaskan gambar atau klik",
    "editAsset.assignedInvoice": "Invois Ditetapkan",
    "editAsset.invoiceOptional": "Pilihan: Nombor rujukan invois untuk aset ini",
    "editAsset.category": "Kategori",
    "editAsset.status": "Status",
    "editAsset.location": "Lokasi",
    "editAsset.assignedTo": "Diberikan Kepada",
    "editAsset.financialInfo": "Maklumat Kewangan",
    "editAsset.financialInfoDesc": "Kemaskini butiran pembelian dan penilaian",
    "editAsset.purchaseDate": "Tarikh Pembelian",
    "editAsset.purchasePrice": "Harga Belian",
    "editAsset.remainingValue": "Nilai Berbaki (Auto-dikira)",
    "editAsset.basedOn": "Berdasarkan",
    "editAsset.depreciationMethod": "kaedah susut nilai",
    "editAsset.depreciationCalc": "Kalkulator Susut Nilai",
    "editAsset.depreciationCalcDesc": "Susut nilai automatik berdasarkan butiran pembelian",
    "editAsset.depreciationMethodLabel": "Kaedah Susut Nilai",
    "editAsset.straightLine": "Garis Lurus",
    "editAsset.straightLineDesc": "Mengurangkan nilai aset dengan jumlah yang sama bagi setiap tempoh.\n\n( Harga Belian − Nilai Baki ) ÷ Tempoh Penggunaan",
    "editAsset.usefulLife": "Hayat Berguna (Tahun)",
    "editAsset.usefulLifeAuto": "(Auto-dikira berdasarkan kategori)",
    "editAsset.usefulLifeDesc": "Ditetapkan automatik berdasarkan kategori aset. Anda boleh laraskan jika diperlukan.",
    "editAsset.futurePurchaseDate": "Tarikh Pembelian Masa Hadapan",
    "editAsset.futurePurchaseDateDesc": "Tarikh pembelian ditetapkan pada masa hadapan. Susut nilai akan dikira setelah tarikh pembelian berlalu.",
    "editAsset.monthlyDepreciation": "Susut Nilai Bulanan",
    "editAsset.yearlyDepreciation": "Susut Nilai Tahunan",
    "editAsset.accumulatedDepreciation": "Susut Nilai Terkumpul",
    "editAsset.over": "Lebih",
    "editAsset.years": "tahun",
    "editAsset.months": "bulan",
    "editAsset.annualRate": "kadar tahunan",
    "editAsset.howCalculated": "Bagaimana ini dikira?",
    "editAsset.calculationFullDesc": "Susut nilai dikira dari tarikh pembelian hingga hari ini menggunakan kaedah Garis Lurus, berdasarkan harga belian dan hayat berguna aset.",
    "editAsset.additionalDetails": "Butiran Tambahan",
    "editAsset.additionalDetailsDesc": "Maklumat pilihan tentang aset",
    "editAsset.serialNumber": "Nombor Siri",
    "editAsset.description": "Penerangan",
    "editAsset.enterAdditionalDetails": "Masukkan butiran tambahan...",
    "editAsset.dangerZone": "Zon Bahaya",
    "editAsset.dangerZoneDesc": "Tindakan tidak boleh diterbalikkan. Sila teruskan dengan berhati-hati.",
    "editAsset.deleteAsset": "Padam aset ini",
    "editAsset.deleteAssetDesc": "Setelah dipadam, aset ini tidak boleh dipulihkan.",
    "editAsset.deleteAssetBtn": "Padam Aset",
    "editAsset.confirmDelete": "Adakah anda benar-benar pasti?",
    "editAsset.confirmDeleteDesc": "Tindakan ini tidak boleh dibatalkan. Ini akan memadam aset secara kekal",
    "editAsset.confirmDeleteDesc2": "dan membuang semua data yang berkaitan dari pangkalan data.",
    "editAsset.deletePermanently": "Padam Secara Kekal",
    "editAsset.fixErrors": "Sila betulkan ralat di atas sebelum menyimpan.",
    "editAsset.requiredFields": "Medan wajib",
    "editAsset.markedWith": "ditandakan dengan",
    "editAsset.cancel": "Batal",
    "editAsset.saveChanges": "Simpan Perubahan",
    "editAsset.saving": "Menyimpan...",
    "editAsset.assetNotFound": "Aset Tidak Dijumpai",
    "editAsset.backToAssets": "Kembali ke Aset",
    "editAsset.required": "*",
    "editAsset.idRequired": "ID Aset diperlukan",
    "editAsset.nameRequired": "Nama aset diperlukan",
    "editAsset.categoryRequired": "Kategori diperlukan",
    "editAsset.locationRequired": "Lokasi diperlukan",
    "editAsset.purchaseDateRequired": "Tarikh pembelian diperlukan",
    "editAsset.purchasePriceRequired": "Harga belian mesti lebih besar daripada 0",
    "editAsset.assignedToRequired": "Diberikan kepada diperlukan",
    
    // Categories
    "category.itEquipment": "Peralatan IT",
    "category.furniture": "Perabot",
    "category.vehicles": "Kenderaan",
    "category.officeEquipment": "Peralatan Pejabat",
    "category.machinery": "Jentera",
    "category.other": "Lain-lain",
    "category.customCategory": "Masukkan kategori tersuai...",
  },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    return savedTheme || "dark";
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    return savedLanguage || "ms";
  });

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

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

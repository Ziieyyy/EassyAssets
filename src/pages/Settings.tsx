import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Moon, Sun, Languages } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

export default function Settings() {
  const { theme, language, setTheme, setLanguage, t } = useSettings();

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    toast.success(`${t("notify.themeChanged")} ${newTheme}`);
  };

  const handleLanguageChange = (newLanguage: "ms" | "en") => {
    setLanguage(newLanguage);
    toast.success(
      newLanguage === "ms" 
        ? "Bahasa ditukar kepada Bahasa Malaysia" 
        : "Language changed to English"
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("settings.subtitle")}
          </p>
        </div>

        {/* Appearance Settings */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" />
              {t("settings.appearance")}
            </CardTitle>
            <CardDescription>
              {t("settings.appearanceDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selector */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">{t("settings.themeMode")}</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun className="w-6 h-6" />
                  <span>{t("settings.light")}</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon className="w-6 h-6" />
                  <span>{t("settings.dark")}</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("settings.themeDesc")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5 text-primary" />
              {t("settings.language")}
            </CardTitle>
            <CardDescription>
              {t("settings.languageDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="language" className="text-base font-semibold">
                {t("settings.displayLanguage")}
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language" className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ms">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇲🇾</span>
                      <span>Bahasa Malaysia</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇬🇧</span>
                      <span>English</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {language === "ms" 
                  ? "Pilih bahasa paparan pilihan anda" 
                  : "Choose your preferred display language"}
              </p>
            </div>

            {/* Current Language Display */}
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("settings.currentLanguage")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "ms" ? "Bahasa Malaysia 🇲🇾" : "English 🇬🇧"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="glass border-border bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              {t("settings.autoSave")}
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

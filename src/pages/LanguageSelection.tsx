import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n, translateLanguageId } from "@/lib/i18n";

const LanguageSelection = () => {
  const navigate = useNavigate();
  const { t, setLang, lang } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const languages = [
    { id: "english", label: "English" },
    { id: "malay", label: "Bahasa Melayu" },
    { id: "tamil", label: "தமிழ்" },
    { id: "chinese", label: "中文" },
    { id: "thai", label: "ภาษาไทย" },
    { id: "indonesian", label: "Bahasa Indonesia" },
    { id: "filipino", label: "Filipino" },
    { id: "khmer", label: "Khmer" },
    { id: "lao", label: "Lao" },
    { id: "burmese", label: "Burmese" },
    { id: "vietnamese", label: "Tiếng Việt" }
  ];

  const handleConfirm = () => {
    if (selectedLanguage) {
      const mapped = translateLanguageId(selectedLanguage);
      if (mapped) setLang(mapped);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-primary/80 text-primary-foreground">
        <CardContent className="p-8">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-8">{t('language.choose')}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {languages.map((language) => (
                <button
                  key={language.id}
                  onClick={() => setSelectedLanguage(language.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedLanguage === language.id
                      ? 'bg-background text-foreground border-background'
                      : 'bg-background/20 text-primary-foreground border-background/30 hover:bg-background/30'
                  }`}
                >
                  {language.label}
                </button>
              ))}
            </div>
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleConfirm}
                disabled={!selectedLanguage}
                className="px-12 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                variant="secondary"
              >
                {t('language.confirm')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelection;

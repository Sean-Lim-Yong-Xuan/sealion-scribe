import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const AccountPurpose = () => {
  const navigate = useNavigate();
  const [selectedPurpose, setSelectedPurpose] = useState<string>("");

  const purposes = [
    { id: "grammar", label: "Grammar Checking" },
    { id: "teaching", label: "Teaching & Grading" },
    { id: "other", label: "Other" }
  ];

  const handleConfirm = () => {
    if (selectedPurpose) {
      navigate('/language-selection');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-primary/80 text-primary-foreground">
        <CardContent className="p-8">
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-8">What do you plan to use your account for?</h2>
            </div>
            
            <div className="space-y-4">
              {purposes.map((purpose) => (
                <button
                  key={purpose.id}
                  onClick={() => setSelectedPurpose(purpose.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedPurpose === purpose.id
                      ? 'bg-background text-foreground border-background'
                      : 'bg-background/20 text-primary-foreground border-background/30 hover:bg-background/30'
                  }`}
                >
                  {purpose.label}
                </button>
              ))}
            </div>
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleConfirm}
                disabled={!selectedPurpose}
                className="px-12 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                variant="secondary"
              >
                Confirm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPurpose;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Globe, Settings, User, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// AWS Bedrock integration using AWS SDK directly
async function analyzeEssayWithBedrock(essayText: string, awsCredentials: { accessKeyId: string; secretAccessKey: string; region: string }) {
  try {
    const client = new BedrockRuntimeClient({
      region: awsCredentials.region,
      credentials: {
        accessKeyId: awsCredentials.accessKeyId,
        secretAccessKey: awsCredentials.secretAccessKey,
      },
    });

    const analysisPrompt = `Please analyze the following essay and provide detailed feedback. Return your response in the following JSON format:

{
  "positiveFeedback": [
    "List specific positive aspects of the essay",
    "Such as strong arguments, good structure, clear writing",
    "Each item should be a complete sentence describing what was done well"
  ],
  "negativeFeedback": [
    "List specific areas for improvement",
    "Such as unclear arguments, weak evidence, grammatical issues",
    "Each item should be a complete sentence describing what needs work"
  ]
}

Essay to analyze:
"""
${essayText}
"""

Focus on:
- Argument strength and logical flow
- Evidence and supporting details
- Writing clarity and organization
- Grammar and style
- Thesis development and conclusion

Provide constructive, specific feedback that helps the student improve their writing.`;

    const requestBody = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ]
    });

    const command = new InvokeModelCommand({
      modelId: "arn:aws:bedrock:us-east-1:116163866269:imported-model/d48xlm95eq5l",
      body: requestBody,
      contentType: "application/json",
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    const content = responseBody.content[0].text;
    
    // Try to parse the JSON response from the model
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysisResult = JSON.parse(jsonMatch[0]);
      return {
        positiveFeedback: analysisResult.positiveFeedback || [],
        negativeFeedback: analysisResult.negativeFeedback || [],
        success: true
      };
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.error('Error analyzing essay with Bedrock:', error);
    throw error;
  }
}

interface FeedbackItem {
  id: string;
  type: 'positive' | 'negative';
  text?: string; // For dynamic feedback from AI analysis
}

const EssayChecker = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [essay, setEssay] = useState(`The history of our nation is fraught with battles over people's rights, and the right to vote is foremost among them. The right to vote is linked to many other significant rights and principles, such of that of equality and justice. It should not be denied to eligible citizens, including those who have infringed on the rights of others.

Prisoners should be allowed the right to vote, as this right is crucial to our classification as a democracy. The primary argument denying prisoners this right is based on a gross generalization, and denies their standing as citizens of the state.

The right to vote defines our nation as a democracy and should be afforded to all citizens. The denial of this right for prisoners in general, denies their citizenship, even to those felons who are incarcerated because of minor crimes or crimes that have inviolable wrong action by society as a whole to society themselves but not because it is a punishment against the right to vote that may concern on the might to equal justice. We should deny only the rights that in our objective justice system is necessary to ensure a just and functional democracy. If we restrict a citizen the right to vote he or her voice heard should be them to any other, what other infringements can we justify?

The primary argument against allowing prisoners the right to vote, which often infringes on the right of another, his or her own rights, is based on a gross generalization. This argument fails to take into account the significant number of prisoners who are incarcerated because of minor crimes or crimes that stem civil moral prohibitions, wrong action to feed but not because it is a punishment against the tenets of moral and just government. You would argue that a mansions insolently achieve the violence toward social patterns.`);

  const [feedback, setFeedback] = useState<FeedbackItem[]>([
    { id: 'feedback.item1', type: 'positive' },
    { id: 'feedback.item2', type: 'positive' },
    { id: 'feedback.item3', type: 'positive' },
    { id: 'feedback.item4', type: 'positive' },
    { id: 'feedback.item5', type: 'positive' },
    { id: 'feedback.item6', type: 'positive' },
    { id: 'feedback.item7', type: 'negative' },
    { id: 'feedback.item8', type: 'negative' },
    { id: 'feedback.item9', type: 'negative' },
    { id: 'feedback.item10', type: 'negative' },
    { id: 'feedback.item11', type: 'negative' },
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [awsCredentials, setAwsCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1'
  });

  // Load uploaded essay if available
  useEffect(() => {
    const stored = sessionStorage.getItem('uploadedEssay');
    if (stored) {
      setEssay(stored);
      // Optionally clear so it doesn't override subsequent manual edits when navigating back
      sessionStorage.removeItem('uploadedEssay');
    }
  }, []);

  const handleAnalyze = async () => {
    if (!essay.trim()) {
      toast.error('Please enter an essay to analyze');
      return;
    }

    if (!awsCredentials.accessKeyId || !awsCredentials.secretAccessKey) {
      toast.error('Please enter your AWS credentials');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Call the Bedrock AI model directly via AWS SDK
      const analysisResult = await analyzeEssayWithBedrock(essay, awsCredentials);
      
      if (analysisResult.positiveFeedback && analysisResult.negativeFeedback) {
        // Convert analysis results to feedback format
        const newFeedback: FeedbackItem[] = [
          ...analysisResult.positiveFeedback.map((feedback: string, index: number) => ({
            id: `positive_${index}`,
            type: 'positive' as const,
            text: feedback
          })),
          ...analysisResult.negativeFeedback.map((feedback: string, index: number) => ({
            id: `negative_${index}`,
            type: 'negative' as const,
            text: feedback
          }))
        ];
        
        // Update feedback state with real analysis results
        setFeedback(newFeedback);
      }
      
      toast.success('Essay analysis completed!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please check your AWS credentials and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Back button uses stored assignment id for correct route
  const handleBackToAssignment = () => {
    const assignmentId = sessionStorage.getItem('currentAssignmentId');
    if (assignmentId) {
      navigate(`/assignment/${assignmentId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const positiveFeedback = feedback.filter(item => item.type === 'positive');
  const negativeFeedback = feedback.filter(item => item.type === 'negative');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Home className="w-6 h-6 cursor-pointer" onClick={() => navigate('/dashboard')} aria-label="Go to Dashboard" />
            <h1 className="text-xl font-semibold">Checkit ✓</h1>
          </div>
          <div className="flex items-center gap-4">
            <Globe className="w-5 h-5" />
            <Settings className="w-5 h-5" />
            <span className="text-sm">dinoTeacher</span>
            <User className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Essay Input Section */}
  <div className="flex-1 p-6 border-r border-border flex flex-col">
          {/* FIXED: Back button - Now properly navigates to Assignment page with improved styling */}
          <button 
            onClick={handleBackToAssignment}
            className="mb-4 flex items-center gap-2 bg-transparent border-none p-2 -ml-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">{t('checker.back')}</span>
          </button>
          
          <div className="mb-4">
            <Textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              className="min-h-[400px] resize-none text-sm leading-relaxed"
              placeholder="Paste your essay here for analysis..."
            />
          </div>
          
          <div className="flex justify-center mt-auto pt-4">
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !essay.trim() || !awsCredentials.accessKeyId || !awsCredentials.secretAccessKey}
              className="px-8"
            >
              {isAnalyzing ? t('checker.analyze') + '...' : t('checker.analyze')}
            </Button>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="w-96 p-6 overflow-y-auto">
          {/* Positive Feedback */}
          <Card className="p-4 mb-6">
            <h2 className="text-lg font-semibold text-success mb-4 flex items-center gap-2">
              {t('checker.feedback.positive')}
            </h2>
            <div className="space-y-3">
              {positiveFeedback.map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {item.text || t(item.id)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Negative Feedback */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
              {t('checker.feedback.negative')}
            </h2>
            <div className="space-y-3">
              {negativeFeedback.map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {item.text || t(item.id)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-border p-4 bg-card">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{t('checker.student.placeholder')}</span>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EssayChecker;

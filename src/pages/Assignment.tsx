import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Globe, Settings, User, Upload, Check, X, Plus } from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";

interface Student {
  id: string;
  name: string;
  submitted: boolean;
}

const Assignment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedEssay, setUploadedEssay] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  
  const [students] = useState<Student[]>([
    { id: "1", name: "Student", submitted: true },
    { id: "2", name: "Student", submitted: true },
    { id: "3", name: "Student", submitted: true },
    { id: "4", name: "Student", submitted: true },
    { id: "5", name: "Student", submitted: true },
    { id: "6", name: "Student", submitted: true },
    { id: "7", name: "Student", submitted: true },
    { id: "8", name: "Student", submitted: true },
    { id: "9", name: "Student", submitted: true },
    { id: "10", name: "Student", submitted: true },
    { id: "11", name: "Student", submitted: false },
    { id: "12", name: "Student", submitted: false }
  ]);

  const submittedCount = students.filter(s => s.submitted).length;
  const totalCount = students.length;
  const submissionPercentage = (submittedCount / totalCount) * 100;

  const handleStudentClick = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student?.submitted) {
      navigate('/essay-checker');
    }
  };

  const handleUploadDocument = () => {
    setShowUploadModal(true);
  };

  // Persist uploaded essay so EssayChecker can pick it up (simple sessionStorage bridge)
  if (uploadedEssay) {
    sessionStorage.setItem('uploadedEssay', uploadedEssay);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Home className="w-6 h-6 cursor-pointer" onClick={() => navigate('/dashboard')} />
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
      <main className="p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-8">Essay Assignment</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <Card className="bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Student List</h3>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div 
                    key={student.id}
                    onClick={() => handleStudentClick(student.id)}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                      student.submitted ? 'hover:bg-muted/50' : 'opacity-50'
                    }`}
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      A
                    </div>
                    <span className="text-sm flex-1">{student.name}</span>
                    {student.submitted ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <X className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </CardContent>
          </Card>

          {/* Question */}
          <Card className="bg-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Question</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Do you believe that individuals who are currently serving prison sentences should have 
                the right to vote in political elections? In your response, consider the purpose of 
                incarceration, the principles of democracy and citizenship, and whether the loss of 
                voting rights serves justice or hinders rehabilitation. Support your opinion with clear 
                reasoning and, if possible, real-world examples or legal perspectives.
              </p>
              
              {/* Submission Progress */}
              <div className="mt-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-muted stroke-current"
                        strokeWidth="3"
                        fill="transparent"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-success stroke-current"
                        strokeWidth="3"
                        strokeDasharray={`${submissionPercentage}, 100`}
                        strokeLinecap="round"
                        fill="transparent"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold">{`${submittedCount}/${totalCount}`}</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">Students Submitted</p>
                
                <div className="flex items-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <span>Submitted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                    <span>Not Submitted</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grading */}
          <Card className="bg-card">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-6">Grading</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">107 Mistakes Made</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">37 Corrections</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleUploadDocument}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Document
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => navigate('/essay-checker')}
                >
                  Open Grammar Checker
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="bg-primary/90 text-primary-foreground border-primary">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-medium">Upload</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Upload Area */}
            <DocumentUpload
              onParsed={(text) => {
                setUploadedEssay(text);
              }}
            />
            
            {/* Student Name Selection */}
            <div className="space-y-2">
              <Label htmlFor="student" className="text-sm font-medium">Student Name</Label>
              <select 
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full p-2 rounded bg-background/20 border border-primary-foreground/30 text-primary-foreground"
              >
                <option value="">One Student Name Here</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id} className="text-foreground bg-background">
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            
            <Button 
              className="w-full bg-background text-foreground hover:bg-background/80 disabled:opacity-50"
              disabled={!uploadedEssay}
              onClick={() => {
                setShowUploadModal(false);
                navigate('/essay-checker');
              }}
            >
              {uploadedEssay ? 'Open In Checker' : 'Waiting for File'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assignment;
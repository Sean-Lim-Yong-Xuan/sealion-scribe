import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Globe, Settings, User, Plus, FileText } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  language: string;
  icon: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [assignments] = useState<Assignment[]>([
    {
      id: "1",
      title: "Essay Assignment",
      description: "Write your opinion on if should prisoners have the right to vote?",
      language: "English",
      icon: "📝"
    },
    {
      id: "2", 
      title: "Penulisan",
      description: "Apakah peranan ibu bapa dan keluarga dalam mengatasi dan menangani masalah sosial?",
      language: "Bahasa Melayu",
      icon: "📝"
    }
  ]);

  const handleAssignmentClick = (assignmentId: string) => {
    navigate(`/assignment/${assignmentId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Home className="w-6 h-6" />
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
        <h2 className="text-2xl font-semibold text-foreground mb-8">Assignments</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <Card 
              key={assignment.id}
              className="bg-primary/80 text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
              onClick={() => handleAssignmentClick(assignment.id)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-background/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <div className="text-sm bg-background/20 px-2 py-1 rounded">
                      {assignment.language}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{assignment.title}</h3>
                    <p className="text-sm text-primary-foreground/80 leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add Assignment Card */}
          <Card className="border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <Plus className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground font-medium">Add Assignment</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
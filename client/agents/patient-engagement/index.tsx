import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, MessageSquare, TrendingUp, CheckCircle } from "lucide-react";

export default function PatientEngagementAgent() {
  const [patientSegment, setPatientSegment] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const analyzeEngagement = async () => {
    if (!patientSegment.trim()) {
      setError("Please enter a patient segment");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setEngagementData(null);
    setAnalysisProgress(0);

    const steps = [
      "Analyzing patient demographics...",
      "Processing engagement patterns...",
      "Generating personalized strategies...",
      "Optimizing communication channels...",
      "Engagement analysis complete!"
    ];

    try {
      // Simulate progress
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setAnalysisProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate mock engagement data
      const mockData = {
        segment: patientSegment,
        engagementScore: Math.floor(Math.random() * 40) + 60, // 60-100
        recommendations: [
          "Implement personalized email campaigns with health tips",
          "Create targeted social media content for this demographic",
          "Set up automated appointment reminders via SMS",
          "Develop educational content specific to their health needs",
          "Use patient portal messaging for follow-up care"
        ],
        channels: [
          { name: "Email", effectiveness: 85, priority: "High" },
          { name: "SMS", effectiveness: 78, priority: "High" },
          { name: "Phone", effectiveness: 92, priority: "Medium" },
          { name: "Patient Portal", effectiveness: 67, priority: "Medium" },
          { name: "Social Media", effectiveness: 54, priority: "Low" }
        ],
        metrics: {
          openRate: Math.floor(Math.random() * 20) + 25, // 25-45%
          clickRate: Math.floor(Math.random() * 10) + 5, // 5-15%
          responseRate: Math.floor(Math.random() * 15) + 10, // 10-25%
          satisfactionScore: Math.floor(Math.random() * 20) + 80 // 80-100
        }
      };

      setEngagementData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze patient engagement');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-scheme-1-bg"
      style={{
        backgroundImage: "linear-gradient(0deg, rgba(0, 0, 0, 0.50), rgba(0, 0, 0, 0.50)), url('/img/bg1.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-20 lg:py-28">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-scheme-5-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-alata font-normal text-white mb-4">
            Patient Engagement Agent
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Analyze patient behavior and optimize engagement strategies for better healthcare outcomes.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 bg-white/20 backdrop-blur-sm border-white/30">
          <CardHeader>
            <CardTitle className="text-white">Patient Engagement Analysis</CardTitle>
            <CardDescription className="text-white/80">
              Enter a patient segment to analyze engagement patterns and get personalized strategies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Segment Input */}
              <div className="flex gap-4">
                <Input
                  value={patientSegment}
                  onChange={(e) => setPatientSegment(e.target.value)}
                  placeholder="Enter patient segment (e.g., 'senior patients', 'diabetes patients')"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && analyzeEngagement()}
                />
                <Button 
                  onClick={analyzeEngagement} 
                  disabled={isAnalyzing || !patientSegment.trim()}
                  className="px-8"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
              
              {/* Progress Section */}
              {isAnalyzing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{currentStep}</span>
                    <span className="text-white/60">{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}

              {error && (
                <div className="text-red-200 text-sm bg-red-900/20 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Analysis Results */}
        {engagementData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-alata text-white">Engagement Analysis Results</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Engagement Score</h3>
                    <p className="text-white/80 text-2xl font-bold">{engagementData.engagementScore}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Open Rate</h3>
                    <p className="text-white/80 text-2xl font-bold">{engagementData.metrics.openRate}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Satisfaction</h3>
                    <p className="text-white/80 text-2xl font-bold">{engagementData.metrics.satisfactionScore}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Response Rate</h3>
                    <p className="text-white/80 text-2xl font-bold">{engagementData.metrics.responseRate}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Engagement Recommendations</CardTitle>
                <CardDescription className="text-white/80">
                  Personalized strategies for {engagementData.segment}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engagementData.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-white/90 text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Effectiveness */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Channel Effectiveness</CardTitle>
                <CardDescription className="text-white/80">
                  Best communication channels for this patient segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {engagementData.channels.map((channel: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium w-24">{channel.name}</span>
                        <div className="w-32 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${channel.effectiveness}%` }}
                          />
                        </div>
                        <span className="text-white/80 text-sm w-12">{channel.effectiveness}%</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        channel.priority === 'High' 
                          ? 'bg-green-500/20 text-green-400' 
                          : channel.priority === 'Medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {channel.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Message */}
        {currentStep === "Engagement analysis complete!" && (
          <Card className="mt-8 border-green-200/50 bg-green-50/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Analysis Complete!</h3>
                  <p className="text-sm text-green-700">Your patient engagement analysis is ready for implementation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
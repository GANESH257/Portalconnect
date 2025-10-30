import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Target, BarChart3, TrendingUp, CheckCircle, DollarSign } from "lucide-react";

export default function CampaignOptimizationAgent() {
  const [campaignName, setCampaignName] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const optimizeCampaign = async () => {
    if (!campaignName.trim()) {
      setError("Please enter a campaign name");
      return;
    }

    setIsOptimizing(true);
    setError(null);
    setOptimizationData(null);
    setOptimizationProgress(0);

    const steps = [
      "Analyzing campaign performance...",
      "Identifying optimization opportunities...",
      "Calculating ROI improvements...",
      "Generating optimization strategies...",
      "Campaign optimization complete!"
    ];

    try {
      // Simulate progress
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setOptimizationProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate mock optimization data
      const mockData = {
        campaign: campaignName,
        currentROI: Math.floor(Math.random() * 20) + 150, // 150-170%
        optimizedROI: Math.floor(Math.random() * 30) + 200, // 200-230%
        improvements: [
          "Optimize ad targeting for higher conversion rates",
          "A/B test different ad creatives and messaging",
          "Implement retargeting campaigns for better engagement",
          "Adjust bidding strategy for cost efficiency",
          "Enhance landing page experience for better conversions"
        ],
        metrics: {
          impressions: Math.floor(Math.random() * 50000) + 100000,
          clicks: Math.floor(Math.random() * 5000) + 5000,
          conversions: Math.floor(Math.random() * 200) + 300,
          cost: Math.floor(Math.random() * 5000) + 10000,
          ctr: (Math.random() * 5 + 2).toFixed(2), // 2-7%
          cpc: (Math.random() * 2 + 1).toFixed(2), // $1-3
          conversionRate: (Math.random() * 3 + 2).toFixed(2) // 2-5%
        },
        recommendations: [
          {
            category: "Targeting",
            priority: "High",
            impact: "Increase CTR by 25%",
            description: "Refine audience targeting based on demographic and behavioral data"
          },
          {
            category: "Creative",
            priority: "Medium", 
            impact: "Improve conversion by 15%",
            description: "Test new ad creatives with healthcare-focused messaging"
          },
          {
            category: "Bidding",
            priority: "High",
            impact: "Reduce CPC by 20%",
            description: "Implement automated bidding strategies for better cost control"
          },
          {
            category: "Landing Page",
            priority: "Medium",
            impact: "Boost conversions by 30%",
            description: "Optimize landing page for mobile and improve user experience"
          }
        ]
      };

      setOptimizationData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize campaign');
    } finally {
      setIsOptimizing(false);
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
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-alata font-normal text-white mb-4">
            Campaign Optimization Agent
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Optimize your healthcare marketing campaigns for maximum ROI and performance.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 bg-white/20 backdrop-blur-sm border-white/30">
          <CardHeader>
            <CardTitle className="text-white">Campaign Optimization</CardTitle>
            <CardDescription className="text-white/80">
              Enter your campaign name to analyze performance and get optimization recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Campaign Input */}
              <div className="flex gap-4">
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name (e.g., 'Spine Surgery Awareness')"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && !isOptimizing && optimizeCampaign()}
                />
                <Button 
                  onClick={optimizeCampaign} 
                  disabled={isOptimizing || !campaignName.trim()}
                  className="px-8"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Optimize
                    </>
                  )}
                </Button>
              </div>
              
              {/* Progress Section */}
              {isOptimizing && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{currentStep}</span>
                    <span className="text-white/60">{optimizationProgress}%</span>
                  </div>
                  <Progress value={optimizationProgress} className="h-2" />
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

        {/* Optimization Results */}
        {optimizationData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-alata text-white">Optimization Results</h2>
            
            {/* ROI Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Current ROI</h3>
                    <p className="text-white/80 text-3xl font-bold">{optimizationData.currentROI}%</p>
                    <p className="text-white/60 text-sm">Before optimization</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Optimized ROI</h3>
                    <p className="text-white/80 text-3xl font-bold">{optimizationData.optimizedROI}%</p>
                    <p className="text-white/60 text-sm">After optimization</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Campaign Performance</CardTitle>
                <CardDescription className="text-white/80">
                  Current metrics for {optimizationData.campaign}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-white/60 text-sm">Impressions</p>
                    <p className="text-white text-xl font-bold">{optimizationData.metrics.impressions.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">Clicks</p>
                    <p className="text-white text-xl font-bold">{optimizationData.metrics.clicks.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">Conversions</p>
                    <p className="text-white text-xl font-bold">{optimizationData.metrics.conversions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">Cost</p>
                    <p className="text-white text-xl font-bold">${optimizationData.metrics.cost.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">CTR</p>
                    <p className="text-white text-xl font-bold">{optimizationData.metrics.ctr}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">CPC</p>
                    <p className="text-white text-xl font-bold">${optimizationData.metrics.cpc}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">Conv. Rate</p>
                    <p className="text-white text-xl font-bold">{optimizationData.metrics.conversionRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-sm">ROI</p>
                    <p className="text-white text-xl font-bold">{optimizationData.currentROI}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Recommendations */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Optimization Recommendations</CardTitle>
                <CardDescription className="text-white/80">
                  Prioritized strategies to improve campaign performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizationData.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/10 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          rec.priority === 'High' 
                            ? 'bg-red-500/20' 
                            : rec.priority === 'Medium'
                            ? 'bg-yellow-500/20'
                            : 'bg-gray-500/20'
                        }`}>
                          <span className={`text-sm font-bold ${
                            rec.priority === 'High' 
                              ? 'text-red-400' 
                              : rec.priority === 'Medium'
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-semibold">{rec.category}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            rec.priority === 'High' 
                              ? 'bg-red-500/20 text-red-400' 
                              : rec.priority === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-green-400 text-sm font-medium">{rec.impact}</span>
                        </div>
                        <p className="text-white/80 text-sm">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Improvements */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Quick Improvements</CardTitle>
                <CardDescription className="text-white/80">
                  Immediate actions you can take to improve campaign performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizationData.improvements.map((improvement: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-white/90 text-sm">{improvement}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Message */}
        {currentStep === "Campaign optimization complete!" && (
          <Card className="mt-8 border-green-200/50 bg-green-50/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Optimization Complete!</h3>
                  <p className="text-sm text-green-700">Your campaign optimization recommendations are ready for implementation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
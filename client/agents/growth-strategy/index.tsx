import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, BarChart3, Target, CheckCircle, Lightbulb } from "lucide-react";

export default function GrowthStrategyAgent() {
  const [businessType, setBusinessType] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const analyzeGrowth = async () => {
    if (!businessType.trim()) {
      setError("Please enter a business type");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStrategyData(null);
    setAnalysisProgress(0);

    const steps = [
      "Analyzing market opportunities...",
      "Evaluating competitive landscape...",
      "Identifying growth potential...",
      "Generating strategic recommendations...",
      "Growth strategy analysis complete!"
    ];

    try {
      // Simulate progress
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setAnalysisProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate mock strategy data
      const mockData = {
        businessType: businessType,
        marketSize: Math.floor(Math.random() * 50) + 100, // 100-150 billion
        growthRate: (Math.random() * 5 + 3).toFixed(1), // 3-8%
        opportunities: [
          "Digital transformation and telemedicine integration",
          "Expansion into underserved geographic markets",
          "Partnership with local healthcare providers",
          "Specialized service offerings for niche markets",
          "Technology-driven patient engagement solutions"
        ],
        strategies: [
          {
            name: "Market Penetration",
            priority: "High",
            impact: "Increase market share by 25%",
            timeline: "6-12 months",
            description: "Focus on existing markets with enhanced marketing and service delivery"
          },
          {
            name: "Product Development",
            priority: "Medium",
            impact: "Generate 30% new revenue",
            timeline: "12-18 months", 
            description: "Develop new healthcare services and digital solutions"
          },
          {
            name: "Market Development",
            priority: "High",
            impact: "Expand to 3 new markets",
            timeline: "9-15 months",
            description: "Enter new geographic regions with proven service models"
          },
          {
            name: "Strategic Partnerships",
            priority: "Medium",
            impact: "Reduce costs by 20%",
            timeline: "3-6 months",
            description: "Form alliances with complementary healthcare providers"
          }
        ],
        metrics: {
          currentRevenue: Math.floor(Math.random() * 5000000) + 1000000, // 1-6M
          projectedRevenue: Math.floor(Math.random() * 10000000) + 5000000, // 5-15M
          marketShare: (Math.random() * 5 + 2).toFixed(1), // 2-7%
          customerAcquisitionCost: Math.floor(Math.random() * 500) + 200, // 200-700
          customerLifetimeValue: Math.floor(Math.random() * 2000) + 1000 // 1000-3000
        },
        risks: [
          "Regulatory changes affecting healthcare marketing",
          "Increased competition from digital health startups",
          "Economic downturn impacting healthcare spending",
          "Technology disruption in traditional healthcare models"
        ]
      };

      setStrategyData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze growth strategy');
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
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-alata font-normal text-white mb-4">
            Growth Strategy Agent
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Develop data-driven growth strategies for your healthcare business.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 bg-white/20 backdrop-blur-sm border-white/30">
          <CardHeader>
            <CardTitle className="text-white">Growth Strategy Analysis</CardTitle>
            <CardDescription className="text-white/80">
              Enter your business type to get personalized growth strategies and market insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Business Type Input */}
              <div className="flex gap-4">
                <Input
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="Enter business type (e.g., 'spine surgery practice', 'dental clinic')"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && !isAnalyzing && analyzeGrowth()}
                />
                <Button 
                  onClick={analyzeGrowth} 
                  disabled={isAnalyzing || !businessType.trim()}
                  className="px-8"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
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

        {/* Strategy Analysis Results */}
        {strategyData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-alata text-white">Growth Strategy Analysis</h2>
            
            {/* Market Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Market Size</h3>
                    <p className="text-white/80 text-2xl font-bold">${strategyData.marketSize}B</p>
                    <p className="text-white/60 text-sm">Total addressable market</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Growth Rate</h3>
                    <p className="text-white/80 text-2xl font-bold">{strategyData.growthRate}%</p>
                    <p className="text-white/60 text-sm">Annual growth</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/20 backdrop-blur-sm border-white/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Market Share</h3>
                    <p className="text-white/80 text-2xl font-bold">{strategyData.metrics.marketShare}%</p>
                    <p className="text-white/60 text-sm">Current share</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Projections */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Revenue Projections</CardTitle>
                <CardDescription className="text-white/80">
                  Current vs projected revenue for {strategyData.businessType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-white/60 text-sm mb-2">Current Revenue</p>
                    <p className="text-white text-3xl font-bold">${strategyData.metrics.currentRevenue.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/60 text-sm mb-2">Projected Revenue</p>
                    <p className="text-white text-3xl font-bold">${strategyData.metrics.projectedRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Strategies */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Growth Strategies</CardTitle>
                <CardDescription className="text-white/80">
                  Prioritized strategies for sustainable growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategyData.strategies.map((strategy: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white/10 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          strategy.priority === 'High' 
                            ? 'bg-red-500/20' 
                            : strategy.priority === 'Medium'
                            ? 'bg-yellow-500/20'
                            : 'bg-gray-500/20'
                        }`}>
                          <span className={`text-sm font-bold ${
                            strategy.priority === 'High' 
                              ? 'text-red-400' 
                              : strategy.priority === 'Medium'
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-semibold">{strategy.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            strategy.priority === 'High' 
                              ? 'bg-red-500/20 text-red-400' 
                              : strategy.priority === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {strategy.priority}
                          </span>
                          <span className="text-green-400 text-sm font-medium">{strategy.impact}</span>
                          <span className="text-blue-400 text-sm">{strategy.timeline}</span>
                        </div>
                        <p className="text-white/80 text-sm">{strategy.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Opportunities */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Growth Opportunities</CardTitle>
                <CardDescription className="text-white/80">
                  Key opportunities to accelerate growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strategyData.opportunities.map((opportunity: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lightbulb className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-white/90 text-sm">{opportunity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardHeader>
                <CardTitle className="text-white">Risk Assessment</CardTitle>
                <CardDescription className="text-white/80">
                  Potential risks to consider in your growth strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strategyData.risks.map((risk: string, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-400 text-sm font-bold">!</span>
                      </div>
                      <p className="text-white/90 text-sm">{risk}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Message */}
        {currentStep === "Growth strategy analysis complete!" && (
          <Card className="mt-8 border-green-200/50 bg-green-50/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Analysis Complete!</h3>
                  <p className="text-sm text-green-700">Your growth strategy analysis is ready for implementation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
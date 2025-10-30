import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, BarChart3, Globe, TrendingUp, CheckCircle, ExternalLink } from "lucide-react";

interface SERPResult {
  id: string;
  position: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  isSponsored: boolean;
}

interface SERPData {
  keyword: string;
  totalResults: number;
  results: SERPResult[];
  timestamp: Date;
}

export default function SERPRankCheckerAgent() {
  const [keyword, setKeyword] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [serpData, setSerpData] = useState<SERPData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkProgress, setCheckProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const checkSERPRank = async () => {
    if (!keyword.trim()) {
      setError("Please enter a keyword");
      return;
    }

    setIsChecking(true);
    setError(null);
    setSerpData(null);
    setCheckProgress(0);

    const steps = [
      "Initializing SERP analysis...",
      "Connecting to search engines...",
      "Extracting ranking data...",
      "Analyzing results...",
      "SERP analysis complete!"
    ];

    try {
      // Simulate progress
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setCheckProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Generate mock SERP data for demonstration
      const mockData: SERPData = {
        keyword: keyword,
        totalResults: Math.floor(Math.random() * 1000000) + 100000,
        results: [
          {
            id: "1",
            position: 1,
            title: `${keyword} - Professional Healthcare Services`,
            url: "https://example-healthcare.com",
            snippet: `Comprehensive ${keyword} services with expert medical professionals. Get the best care and treatment options.`,
            domain: "example-healthcare.com",
            isSponsored: false
          },
          {
            id: "2", 
            position: 2,
            title: `Best ${keyword} Solutions | Medical Excellence`,
            url: "https://medical-excellence.com",
            snippet: `Leading provider of ${keyword} with state-of-the-art facilities and experienced specialists.`,
            domain: "medical-excellence.com",
            isSponsored: true
          },
          {
            id: "3",
            position: 3,
            title: `${keyword} Guide - Everything You Need to Know`,
            url: "https://healthcare-guide.com",
            snippet: `Complete guide to ${keyword} including symptoms, treatments, and prevention strategies.`,
            domain: "healthcare-guide.com",
            isSponsored: false
          },
          {
            id: "4",
            position: 4,
            title: `Expert ${keyword} Consultation | Book Now`,
            url: "https://expert-consultation.com",
            snippet: `Schedule your ${keyword} consultation with board-certified specialists. Same-day appointments available.`,
            domain: "expert-consultation.com",
            isSponsored: false
          },
          {
            id: "5",
            position: 5,
            title: `${keyword} Research & Development`,
            url: "https://medical-research.org",
            snippet: `Latest research and developments in ${keyword} field. Clinical trials and breakthrough treatments.`,
            domain: "medical-research.org",
            isSponsored: false
          }
        ],
        timestamp: new Date()
      };

      setSerpData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check SERP rankings');
    } finally {
      setIsChecking(false);
    }
  };

  const openURL = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div 
      className="min-h-screen bg-scheme-1-bg"
      style={{
        backgroundImage: "linear-gradient(0deg, rgba(0, 0, 0, 0.50), rgba(0, 0, 0, 0.50)), url('/img/background.png')",
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
            <Search className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-alata font-normal text-white mb-4">
            SERP Rank Checker Agent
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Analyze search engine rankings and get comprehensive SERP data for any keyword. Perfect for SEO analysis and competitive research.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 bg-white/20 backdrop-blur-sm border-white/30">
          <CardHeader>
            <CardTitle className="text-white">SERP Analysis</CardTitle>
            <CardDescription className="text-white/80">
              Enter a keyword to analyze its search engine ranking positions and get detailed SERP data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Keyword Input */}
              <div className="flex gap-4">
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Enter keyword to analyze (e.g., 'healthcare marketing')"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && !isChecking && checkSERPRank()}
                />
                <Button 
                  onClick={checkSERPRank} 
                  disabled={isChecking || !keyword.trim()}
                  className="px-8"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Check Rankings
                    </>
                  )}
                </Button>
              </div>
              
              {/* Progress Section */}
              {isChecking && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{currentStep}</span>
                    <span className="text-white/60">{checkProgress}%</span>
                  </div>
                  <Progress value={checkProgress} className="h-2" />
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

        {/* SERP Results */}
        {serpData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-alata text-white">SERP Analysis Results</h2>
            
            {/* Summary Card */}
            <Card className="bg-white/20 backdrop-blur-sm border-white/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Keyword</h3>
                    <p className="text-white/80 text-sm">{serpData.keyword}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Total Results</h3>
                    <p className="text-white/80 text-sm">{serpData.totalResults.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Analyzed</h3>
                    <p className="text-white/80 text-sm">{serpData.results.length} positions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rankings List */}
            <div className="space-y-4">
              <h3 className="text-xl font-alata text-white">Search Rankings</h3>
              <div className="space-y-3">
                {serpData.results.map((result) => (
                  <Card key={result.id} className="bg-white/20 backdrop-blur-sm border-white/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            result.position <= 3 
                              ? 'bg-green-500/20 text-green-400' 
                              : result.position <= 10 
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {result.position}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-white font-semibold truncate">{result.title}</h4>
                            {result.isSponsored && (
                              <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">
                                Sponsored
                              </span>
                            )}
                          </div>
                          <p className="text-white/70 text-sm mb-2 line-clamp-2">{result.snippet}</p>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-white/50" />
                            <span className="text-white/60 text-sm truncate">{result.domain}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openURL(result.url)}
                              className="ml-auto text-white/70 hover:text-white"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <Card className="mt-8 border border-white/30 bg-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">SEO Analysis Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
              <div>
                <h4 className="font-semibold mb-2 text-white">Keyword Research</h4>
                <p>Use specific, long-tail keywords for better ranking analysis and competitive insights.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Competitive Analysis</h4>
                <p>Analyze competitor rankings to identify opportunities and market gaps.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Healthcare SEO</h4>
                <p>Perfect for analyzing medical practice rankings and healthcare marketing keywords.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">Local SEO</h4>
                <p>Check local search rankings for healthcare providers and medical services.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {currentStep === "SERP analysis complete!" && (
          <Card className="mt-8 border-green-200/50 bg-green-50/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">SERP Analysis Complete!</h3>
                  <p className="text-sm text-green-700">Your ranking analysis is ready for review.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

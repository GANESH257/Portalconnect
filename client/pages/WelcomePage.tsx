import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Settings, Star, Users, Zap, Target, Palette, Code, Search, Globe, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function WelcomePage() {
  const { user } = useAuth();

  const agents = [
    {
      id: "serp-intelligence",
      name: "SERP Intelligence",
      description: "Advanced SEO analytics and competitor tracking",
      icon: Search,
      link: "/agents/serp-intelligence",
      color: "bg-theme-blue-primary"
    },
    {
      id: "copywriter",
      name: "Copywriter",
      description: "Creative content generation for marketing campaigns",
      icon: Target,
      link: "/agents/copywriter",
      color: "bg-theme-yellow-primary"
    },
    {
      id: "email-marketing",
      name: "Email Marketing",
      description: "Automated email campaigns with personalization",
      icon: Zap,
      link: "/agents/email-marketing",
      color: "bg-theme-pink"
    },
    {
      id: "image-artist",
      name: "Image Artist",
      description: "AI-powered visual content creation",
      icon: Palette,
      link: "/agents/image-artist",
      color: "bg-theme-purple"
    },
    {
      id: "marketing-genius",
      name: "Marketing Genius",
      description: "Strategic marketing insights and optimization",
      icon: Star,
      link: "/agents/marketing-genius",
      color: "bg-theme-orange"
    },
    {
      id: "coding-helper",
      name: "Coding Helper",
      description: "Development assistance and problem solving",
      icon: Code,
      link: "/agents/coding-helper",
      color: "bg-theme-blue-secondary"
    },
    {
      id: "seo-specialist",
      name: "SEO Specialist",
      description: "Search engine optimization and visibility",
      icon: Search,
      link: "/agents/seo-specialist",
      color: "bg-theme-light-blue"
    },
    {
      id: "prospect-finder",
      name: "Prospect Finder",
      description: "AI-powered lead identification and management",
      icon: Target,
      link: "/agents/prospect-finder",
      color: "bg-theme-green"
    },
    {
      id: "website-intelligence",
      name: "Website Intelligence",
      description: "Comprehensive website analysis and competitive intelligence",
      icon: Globe,
      link: "/agents/website-intelligence",
      color: "bg-theme-indigo"
    }
  ];

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F1C40F 0%, #F39C12 50%, #3498DB 50%, #2980B9 100%)'
      }}
    >
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-white/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-white/15 rounded-full animate-pulse delay-3000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-20 lg:py-28 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-alata text-white mb-4 drop-shadow-lg">
              Welcome, {user?.companyName || 'User'}! 🎉
            </h1>
            <p className="text-lg text-white/90 drop-shadow-md">
              Your AI agent ecosystem is ready to help you succeed
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/watchlist">
              <Button 
                size="lg"
                className="bg-theme-blue-primary/80 border-theme-blue-primary/30 text-white hover:bg-theme-blue-primary backdrop-blur-sm"
              >
                <Heart className="w-5 h-5 mr-2" />
                Watchlist
              </Button>
            </Link>
            <Link to="/settings">
              <Button 
                size="lg"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/95 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-theme-blue-primary mb-2">7</div>
              <div className="text-theme-dark-blue/70">AI Agents Available</div>
            </CardContent>
          </Card>
          <Card className="bg-white/95 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-theme-yellow-primary mb-2">24/7</div>
              <div className="text-theme-dark-blue/70">Always Online</div>
            </CardContent>
          </Card>
          <Card className="bg-white/95 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-theme-pink mb-2">∞</div>
              <div className="text-theme-dark-blue/70">Possibilities</div>
            </CardContent>
          </Card>
        </div>

        {/* AI Agents Grid */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-alata text-white text-center mb-8 drop-shadow-lg">
            Your AI Agent Ecosystem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {agents.map((agent) => {
              const IconComponent = agent.icon;
              return (
                <Link key={agent.id} to={agent.link}>
                  <Card className="group bg-white/95 backdrop-blur-sm border-white/20 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${agent.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-lg font-alata text-theme-dark-blue group-hover:text-theme-blue-primary transition-colors">
                        {agent.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="text-theme-dark-blue/70 text-sm mb-4">
                        {agent.description}
                      </CardDescription>
                      <div className="flex items-center justify-center text-theme-blue-primary font-semibold group-hover:text-theme-blue-secondary transition-colors">
                        <span className="mr-2">Try Now</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Getting Started */}
        <Card className="bg-white/95 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-alata text-theme-dark-blue mb-4">
              Getting Started
            </CardTitle>
            <CardDescription className="text-theme-dark-blue/70">
              Here's how to make the most of your AI agent ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-theme-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold text-theme-dark-blue mb-2">Choose an Agent</h3>
                <p className="text-theme-dark-blue/70 text-sm">
                  Select any AI agent that matches your current needs
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-theme-yellow-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold text-theme-dark-blue mb-2">Interact & Create</h3>
                <p className="text-theme-dark-blue/70 text-sm">
                  Use the agent's interface to generate content and solutions
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-theme-pink rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold text-theme-dark-blue mb-2">Scale & Optimize</h3>
                <p className="text-theme-dark-blue/70 text-sm">
                  Use multiple agents together for comprehensive solutions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="px-8 py-4 bg-white text-theme-blue-primary hover:bg-theme-light-blue font-lato text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Exploring Agents
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

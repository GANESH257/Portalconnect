import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Clock, CheckCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function CustomerSupportAgent() {
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
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-16 md:py-20 lg:py-28 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <img
              src="/client/agents/Icons/Agent_CS.png"
              alt="Customer Support Agent"
              className="w-full h-full object-contain"
            />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-theme-yellow-primary rounded-full animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-theme-pink rounded-full animate-pulse delay-150"></div>
          </div>
          <h1 className="text-4xl md:text-6xl font-alata font-normal text-white mb-4 drop-shadow-lg">
            Customer Support Agent
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md">
            Your intelligent customer service companion, ready to help with instant responses and problem-solving capabilities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <MessageCircle className="w-12 h-12 text-theme-blue-primary mb-4" />
            <h3 className="text-xl font-alata text-theme-dark-blue mb-2">Instant Responses</h3>
            <p className="text-theme-dark-blue/80 font-lato text-sm">Get immediate answers to customer queries with AI-powered responses.</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <Clock className="w-12 h-12 text-theme-yellow-primary mb-4" />
            <h3 className="text-xl font-alata text-theme-dark-blue mb-2">24/7 Availability</h3>
            <p className="text-theme-dark-blue/80 font-lato text-sm">Round-the-clock customer support without any downtime.</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <CheckCircle className="w-12 h-12 text-theme-pink mb-4" />
            <h3 className="text-xl font-alata text-theme-dark-blue mb-2">Problem Solving</h3>
            <p className="text-theme-dark-blue/80 font-lato text-sm">Intelligent problem resolution with step-by-step guidance.</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="text-center bg-white/95 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
          <Star className="w-16 h-16 text-theme-yellow-primary mx-auto mb-6" />
          <h2 className="text-3xl font-alata text-theme-dark-blue mb-4">Coming Soon!</h2>
          <p className="text-theme-dark-blue/80 font-lato text-lg mb-8">
            We're working hard to bring you the most advanced customer support AI agent. 
            Stay tuned for updates!
          </p>
          <Button 
            size="lg"
            className="px-8 py-4 bg-theme-blue-primary text-white hover:bg-theme-blue-secondary font-lato text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Notified
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section
      className="w-full h-[600px] md:h-[750px] lg:h-[900px] flex items-center justify-center px-4 md:px-8 lg:px-16 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/BG.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-10 h-10 bg-white/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-40 w-4 h-4 bg-white/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-white/30 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-white/15 rounded-full animate-pulse delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-white/25 rounded-full animate-pulse delay-2500"></div>
      </div>

      {/* Agent_E1 Character - Top Center Far Left */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 lg:top-12 lg:left-12 z-10">
        <div className="relative">
          <img
            src="/client/agents/Icons/Agent_E2.png"
            alt="AI Welcome Character"
            className="w-80 h-80 lg:w-96 lg:h-96 object-contain"
          />
        </div>
      </div>

      {/* Content Box - Bottom Left */}
      <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 lg:bottom-12 lg:left-12 z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 md:p-6 lg:p-8 border border-white/50 shadow-xl max-w-sm md:max-w-md lg:max-w-lg">
          {/* Content */}
          <div className="flex flex-col gap-3 md:gap-4 w-full">
            <h1 className="text-theme-dark-blue font-alata text-xl md:text-2xl lg:text-3xl font-bold leading-[120%] tracking-[-0.02em] w-full">
              AI Agents for Modern Marketing
            </h1>
            <p className="text-theme-dark-blue font-lato text-sm md:text-base font-semibold leading-[150%] w-full">
              Meet our friendly AI agents, each specialized in different aspects of digital marketing and business growth. 
              Transform your marketing with intelligent automation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start gap-2 md:gap-3 w-full mt-4 md:mt-6">
            <Button
              size="sm"
              className="w-full sm:w-auto px-4 py-2 md:px-6 md:py-3 bg-theme-blue-primary text-white border border-theme-blue-primary hover:bg-theme-blue-secondary font-lato text-sm md:text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Explore Agents
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto px-4 py-2 md:px-6 md:py-3 border-theme-blue-primary text-theme-blue-primary bg-white/80 backdrop-blur-sm hover:bg-theme-blue-primary hover:text-white font-lato text-sm md:text-base font-semibold rounded-full"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

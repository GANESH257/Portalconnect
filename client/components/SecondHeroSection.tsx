import { Button } from "@/components/ui/button";

export default function SecondHeroSection() {
  return (
    <section 
      className="w-full px-16 py-28 relative overflow-hidden"
      style={{
        background: 'linear-gradient(45deg, #F1C40F 0%, #F39C12 25%, #3498DB 25%, #2980B9 50%, #F1C40F 50%, #F39C12 75%, #3498DB 75%, #2980B9 100%)'
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

      <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-20 relative z-10">
        {/* Character Image - Left Side */}
        <div className="flex-shrink-0 lg:w-1/3 flex justify-center lg:justify-start">
          <div className="relative">
            <img
              src="/client/agents/Icons/Agent_E1.png"
              alt="AI Innovation Character"
              className="w-80 h-80 lg:w-96 lg:h-96 object-contain"
            />
            {/* Floating Data Elements around the character */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-theme-yellow-primary/80 rounded-full flex items-center justify-center text-2xl animate-bounce">
              💡
            </div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-theme-blue-primary/80 rounded-full flex items-center justify-center text-2xl animate-bounce delay-1000">
              🚀
            </div>
            <div className="absolute top-1/2 -right-8 w-8 h-8 bg-theme-pink/80 rounded-full flex items-center justify-center text-2xl animate-bounce delay-2000">
              ⚡
            </div>
            <div className="absolute top-1/4 -left-8 w-8 h-8 bg-theme-purple/80 rounded-full flex items-center justify-center text-2xl animate-bounce delay-500">
              🎯
            </div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-theme-orange/80 rounded-full flex items-center justify-center text-2xl animate-bounce delay-1500">
              🔥
            </div>
          </div>
        </div>

        {/* Content - Right Side */}
        <div className="lg:w-2/3 flex flex-col items-center lg:items-start gap-8 w-full">
          {/* Section Title */}
          <div className="flex flex-col items-center lg:items-start gap-4 w-full">
            <div className="flex items-center w-full">
              <span className="text-white text-center lg:text-left font-lato text-lg font-bold leading-[150%] bg-white/30 px-6 py-3 rounded-full backdrop-blur-sm w-full shadow-lg">
                🚀 Innovative
              </span>
            </div>
            <div className="flex flex-col items-center lg:items-start gap-6 w-full">
              <h2 className="text-white text-center lg:text-left font-alata text-4xl md:text-5xl lg:text-6xl font-bold leading-[120%] tracking-[-0.02em] w-full drop-shadow-2xl">
                Digital marketing for healthcare brands
              </h2>
              <p className="text-white text-center lg:text-left font-lato text-xl font-semibold leading-[150%] w-full drop-shadow-lg bg-black/20 px-6 py-4 rounded-2xl backdrop-blur-sm">
                We leverage cutting-edge digital strategies to help healthcare brands connect with patients and grow their impact.
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <Button 
              size="lg"
              className="w-full sm:w-auto px-10 py-5 bg-white text-theme-blue-primary border-2 border-white hover:bg-theme-light-blue font-lato text-xl font-bold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              🎓 Learn
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-10 py-5 border-2 border-white/80 text-white bg-white/20 backdrop-blur-md hover:bg-white/40 font-lato text-xl font-bold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              🔍 Explore
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

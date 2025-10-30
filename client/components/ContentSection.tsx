export default function ContentSection() {
  const features = [
    { title: "Innovate", subtitle: "Transformative Solutions" },
    { title: "Engage", subtitle: "Patient Focus" },
    { title: "Optimize", subtitle: "Data Insights" },
    { title: "Accelerate", subtitle: "Growth Strategies" },
    { title: "Automate", subtitle: "AI-Powered Tools" },
    { title: "Connect", subtitle: "Digital Experiences" }
  ];

  const richTextContent = `At Ensemble Digital Labs, we believe in the power of innovation to drive healthcare marketing forward. Our transformative solutions are designed to engage patients effectively, ensuring that their needs are at the heart of every campaign.

By leveraging data insights, we create tailored strategies that not only resonate with your audience but also optimize your marketing efforts for maximum impact. Our focus on patient engagement ensures that your brand remains relevant in a rapidly evolving digital landscape.

We understand that growth is a continuous journey. That's why we employ advanced growth strategies that are both creative and data-driven, allowing your healthcare brand to thrive in a competitive market. Our team is dedicated to exploring new avenues and refining existing approaches to ensure sustained success.

With our commitment to innovation, we are not just keeping pace with the industry; we are setting the standard for what healthcare marketing can achieve. Join us as we redefine the possibilities and elevate your brand to new heights.

Together, let's accelerate your journey towards impactful healthcare marketing that truly makes a difference.`;

  return (
    <section 
      className="w-full px-16 py-28 relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 30% 70%, #F1C40F 0%, #F39C12 30%, #3498DB 60%, #2980B9 100%)'
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

      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-start gap-12 w-full">
          {/* Left Side - Feature Cards */}
          <div className="flex-1 w-full lg:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {features.map((feature, index) => (
                <div key={index} className="group relative">
                  {/* Data-Inspired Card Design */}
                  <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    {/* Data Dashboard Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 bg-theme-blue-primary rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-theme-yellow-primary rounded-full animate-pulse delay-300"></div>
                      <div className="w-2 h-2 bg-theme-blue-primary rounded-full animate-pulse delay-600"></div>
                      <span className="text-theme-dark-blue/60 font-lato text-xs font-semibold uppercase tracking-wider">
                        {feature.title}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-theme-dark-blue font-alata text-xl font-bold leading-tight mb-3 group-hover:text-theme-blue-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-theme-dark-blue/80 font-lato text-sm leading-relaxed">
                        {feature.subtitle}
                      </p>
                    </div>
                    
                    {/* Data Visualization Bar */}
                    <div className="mt-4 h-1 bg-gradient-to-r from-theme-yellow-primary to-theme-blue-primary rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-theme-yellow-primary/5 to-theme-blue-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Agent E Character */}
          <div className="flex-shrink-0 w-full lg:w-1/3 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Agent E Character - Bigger Size */}
              <div className="relative w-96 h-96 lg:w-[28rem] lg:h-[28rem]">
                <img
                  src="/client/agents/Icons/Agent_E.png"
                  alt="Agent E - Data Processing Character"
                  className="w-full h-full object-contain"
                />
                
                {/* Floating Data Icons around Agent E - Bigger */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-theme-yellow-primary/80 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-lg font-bold">💡</span>
                </div>
                <div className="absolute top-1/4 -right-12 w-10 h-10 bg-theme-blue-primary/80 rounded-full flex items-center justify-center animate-pulse delay-500">
                  <span className="text-white text-sm">📊</span>
                </div>
                <div className="absolute -bottom-6 -left-6 w-11 h-11 bg-theme-yellow-primary/80 rounded-full flex items-center justify-center animate-bounce delay-1000">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <div className="absolute bottom-1/4 -left-12 w-8 h-8 bg-theme-blue-primary/80 rounded-full flex items-center justify-center animate-pulse delay-1500">
                  <span className="text-white text-xs">🎯</span>
                </div>
                <div className="absolute top-1/2 -right-16 w-10 h-10 bg-theme-yellow-primary/80 rounded-full flex items-center justify-center animate-bounce delay-2000">
                  <span className="text-white text-sm">🚀</span>
                </div>
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-9 h-9 bg-theme-pink/80 rounded-full flex items-center justify-center animate-bounce delay-3000">
                  <span className="text-white text-sm">🔥</span>
                </div>
              </div>
              
              {/* Data Flow Lines - Updated for right side */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-20 h-0.5 bg-gradient-to-l from-theme-blue-primary to-transparent opacity-60"></div>
                <div className="absolute bottom-1/3 right-0 w-16 h-0.5 bg-gradient-to-r from-theme-yellow-primary to-transparent opacity-60"></div>
                <div className="absolute top-1/2 left-0 w-24 h-0.5 bg-gradient-to-l from-theme-blue-primary to-transparent opacity-40"></div>
                <div className="absolute top-1/3 left-0 w-12 h-0.5 bg-gradient-to-l from-theme-pink to-transparent opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Rich Text Content */}
        <div className="relative w-full">
          {/* Decorative Elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-theme-yellow-primary/30 rounded-full animate-pulse"></div>
          <div className="absolute -top-2 -right-6 w-6 h-6 bg-theme-blue-primary/30 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute -bottom-4 -left-2 w-4 h-4 bg-theme-yellow-primary/40 rounded-full animate-pulse delay-2000"></div>
          <div className="absolute -bottom-2 -right-4 w-5 h-5 bg-theme-blue-primary/40 rounded-full animate-pulse delay-500"></div>
          
          <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-theme-yellow-primary rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-theme-blue-primary rounded-full animate-pulse delay-300"></div>
              <div className="w-2 h-2 bg-theme-yellow-primary rounded-full animate-pulse delay-600"></div>
              <h2 className="text-theme-dark-blue font-alata text-2xl font-bold ml-2">Our Story</h2>
            </div>
            
            {richTextContent.split('\n\n').map((paragraph, index) => (
              <div key={index} className="flex flex-col items-start w-full pb-6 last:pb-0">
                <p className="text-theme-dark-blue font-lato text-base leading-relaxed w-full">
                  {paragraph}
                </p>
              </div>
            ))}
            
            {/* Call to Action */}
            <div className="mt-8 pt-6 border-t border-theme-blue-primary/20">
              <div className="flex items-center gap-2 text-theme-blue-primary font-lato text-sm font-semibold">
                <span>Ready to transform your healthcare marketing?</span>
                <div className="w-2 h-2 bg-theme-yellow-primary rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

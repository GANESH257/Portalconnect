import { Button } from "@/components/ui/button";
import { ChevronRight, Cpu, Database, Shield, Brain, Zap, Target, Users } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DemospaceAgent {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  status: string;
  buttonText: string;
}

export default function DemospaceSection() {
  const agents = [
    {
      icon: Cpu,
      title: "AI Data Processing Agent",
      description: "Advanced data analysis and processing capabilities for healthcare marketing insights and patient behavior patterns.",
      features: ["Real-time analytics", "Predictive modeling", "Data visualization"],
      status: "In Development",
      buttonText: "Try Now"
    },
    {
      icon: Database,
      title: "Patient Data Intelligence Agent", 
      description: "Secure and compliant patient data management with intelligent insights for personalized healthcare marketing.",
      features: ["HIPAA compliance", "Data encryption", "Privacy protection"],
      status: "Beta Testing",
      buttonText: "Try Now"
    },
    {
      icon: Shield,
      title: "Compliance Monitoring Agent",
      description: "Automated compliance checking and regulatory monitoring to ensure all marketing activities meet healthcare standards.",
      features: ["Regulatory updates", "Compliance alerts", "Audit trails"],
      status: "Live",
      buttonText: "Try Now"
    }
  ];

  return (
    <section 
      className="w-full px-16 py-28 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/BG2.png)',
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

      {/* Reduced Dark Overlay for Better Text Readability */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-20 relative z-10">
        {/* Header Section */}
        <div className="max-w-[768px] flex flex-col items-center gap-8 w-full">
          {/* Section Title */}
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center w-full">
              <span className="text-white text-center font-lato text-lg font-bold leading-[150%] bg-white/95 px-8 py-4 rounded-full backdrop-blur-sm w-full shadow-2xl">
                🚀 Demospace
              </span>
            </div>
            <div className="flex flex-col items-center gap-6 w-full">
              <h2 className="text-white text-center font-alata text-5xl md:text-6xl lg:text-[72px] font-bold leading-[120%] tracking-[-0.02em] w-full drop-shadow-2xl">
                AI Innovation Lab
              </h2>
              <p className="text-white text-center font-lato text-xl font-bold leading-[150%] w-full drop-shadow-lg bg-black/40 px-8 py-6 rounded-2xl backdrop-blur-sm">
                🤖 Advanced AI agents in development • 🧪 Cutting-edge technology testing • 💡 Next-gen solutions
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Button 
              size="lg"
              className="px-12 py-6 bg-white text-theme-blue-primary border-2 border-white hover:bg-theme-light-blue font-lato text-xl font-bold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              🚀 Launch Lab
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="px-12 py-6 border-2 border-white/90 text-white bg-white/30 backdrop-blur-md hover:bg-white/50 font-lato text-xl font-bold rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              🔬 Explore Tech
            </Button>
          </div>
        </div>

        {/* Agents Grid Section */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {agents.map((agent, index) => (
              <AgentCard key={`demospace-agent-${index}`} agent={agent} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const AgentCard = ({ agent }: { agent: DemospaceAgent }) => {
  const IconComponent = agent.icon;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Live":
        return "bg-green-500/30 text-green-300 border-green-500/50";
      case "Beta Testing":
        return "bg-yellow-500/30 text-yellow-300 border-yellow-500/50";
      case "In Development":
        return "bg-blue-500/30 text-blue-300 border-blue-500/50";
      default:
        return "bg-gray-500/30 text-gray-300 border-gray-500/50";
    }
  };
  
  return (
    <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="w-16 h-16 bg-theme-blue-primary/20 rounded-full flex items-center justify-center border-2 border-theme-blue-primary/30">
          <IconComponent className="w-8 h-8 text-theme-blue-primary" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-theme-dark-blue font-lato text-sm font-bold drop-shadow-lg">AI Agent</span>
          <span className={`text-xs px-4 py-2 rounded-full border font-semibold drop-shadow-md ${getStatusColor(agent.status)}`}>
            {agent.status}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex flex-col items-center gap-4 w-full">
          <h3 className="text-theme-dark-blue text-center font-alata text-2xl font-bold leading-[140%] tracking-[-0.02em] w-full drop-shadow-lg">
            {agent.title}
          </h3>
          <p className="text-theme-dark-blue text-center font-lato text-base font-semibold leading-[150%] w-full drop-shadow-md">
            {agent.description}
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {agent.features.map((feature: string, index: number) => (
              <span key={index} className="text-theme-blue-primary font-lato text-sm font-semibold bg-theme-blue-primary/10 px-4 py-2 rounded-full border border-theme-blue-primary/20">
                {feature}
              </span>
            ))}
          </div>
        </div>
        
        {/* Action Button */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button className="flex justify-center items-center gap-3 bg-theme-blue-primary text-white px-8 py-4 rounded-full font-lato text-lg font-bold shadow-lg hover:shadow-xl hover:bg-theme-blue-secondary transition-all duration-300 group-hover:scale-105">
            <span>{agent.buttonText}</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-theme-yellow-primary/5 to-theme-blue-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
    </div>
  );
};

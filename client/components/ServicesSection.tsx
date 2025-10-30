import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Agent {
  id: string;
  imagePath: string;
  name: string;
  description: string;
  link: string;
  category: string;
}

export default function ServicesSection() {
  const agents: Agent[] = [
    {
      id: "serp-intelligence",
      imagePath: "/client/agents/Icons/Agent_SE.png",
      name: "SERP Intelligence Agent",
      description: "Advanced SEO analytics and competitor tracking with comprehensive SERP data insights.",
      link: "/agents/serp-intelligence",
      category: "Analytics"
    },
    {
      id: "copywriter",
      imagePath: "/client/agents/Icons/Agent_CW.png",
      name: "Copywriter Agent",
      description: "Creative content generation for marketing campaigns and brand messaging.",
      link: "/agents/copywriter",
      category: "Content"
    },
    {
      id: "email-marketing",
      imagePath: "/client/agents/Icons/Agent_EM.png",
      name: "Email Marketing Agent",
      description: "Automated email campaigns with personalization and performance tracking.",
      link: "/agents/email-marketing",
      category: "Marketing"
    },
    {
      id: "image-artist",
      imagePath: "/client/agents/Icons/Agent_IA.png",
      name: "Image Artist Agent",
      description: "AI-powered visual content creation and artistic image generation.",
      link: "/agents/image-artist",
      category: "Creative"
    },
    {
      id: "marketing-genius",
      imagePath: "/client/agents/Icons/Agent_MG.png",
      name: "Marketing Genius Agent",
      description: "Strategic marketing insights and comprehensive campaign optimization.",
      link: "/agents/marketing-genius",
      category: "Strategy"
    },
    {
      id: "coding-helper",
      imagePath: "/client/agents/Icons/Agent_SE.png",
      name: "Coding Helper Agent",
      description: "Development assistance with code generation and technical problem solving.",
      link: "/agents/coding-helper",
      category: "Development"
    },
    {
      id: "seo-specialist",
      imagePath: "/client/agents/Icons/Agent_SS.png",
      name: "SEO Specialist Agent",
      description: "Search engine optimization and digital visibility enhancement.",
      link: "/agents/seo-specialist",
      category: "Optimization"
    },
        {
          id: "prospect-finder",
          imagePath: "/client/agents/Icons/Agent_PF.png",
          name: "Prospect Finder Agent",
          description: "AI-powered lead identification and prospect management with comprehensive business data.",
          link: "/agents/prospect-finder",
          category: "Lead Generation"
        },
        {
          id: "website-intelligence",
          imagePath: "/client/agents/Icons/Agent_WI.png",
          name: "Website Intelligence Agent",
          description: "Comprehensive website analysis with SEO scoring, competitive intelligence, and performance insights.",
          link: "/agents/website-intelligence",
          category: "Analytics"
        }
  ];

  return (
    <section 
      className="w-full px-4 md:px-8 lg:px-16 py-16 md:py-20 lg:py-28 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #F1C40F 0%, #F39C12 50%, #3498DB 50%, #2980B9 100%)'
      }}
    >
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-white/25 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-white/20 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse delay-1500"></div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-3000"></div>
      </div>

      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-12 md:gap-16 lg:gap-20 relative z-10">
        {/* Section Header */}
        <div className="max-w-[768px] flex flex-col items-center gap-4 w-full">
          <div className="flex items-center">
            <span className="text-white text-center font-lato text-base font-semibold leading-[150%] bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
              AI Agents
            </span>
          </div>
          <div className="flex flex-col items-center gap-6 w-full">
            <h2 className="text-white text-center font-alata text-3xl md:text-4xl lg:text-[52px] font-normal leading-[120%] tracking-[-0.02em] lg:tracking-[-0.52px] w-full drop-shadow-lg">
              Our AI Agent Ecosystem
            </h2>
            <p className="text-white text-center font-lato text-base md:text-lg font-normal leading-[150%] w-full px-4 md:px-0 drop-shadow-md">
              Meet our friendly AI agents, each specialized in different aspects of digital marketing and business growth.
            </p>
          </div>
        </div>
        
        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 w-full">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="text-center">
            <h3 className="text-white font-alata text-2xl md:text-3xl font-normal leading-[120%] mb-4 drop-shadow-lg">
              Ready to Get Started?
            </h3>
            <p className="text-white font-lato text-base md:text-lg font-normal leading-[150%] drop-shadow-md">
              Choose any agent above to begin your AI-powered journey
            </p>
          </div>
          <Button 
            size="lg"
            className="px-8 py-4 bg-white text-theme-blue-primary hover:bg-theme-light-blue font-lato text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Explore All Agents
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

const AgentCard = ({ agent }: { agent: Agent }) => {
  return (
    <Link 
      to={agent.link} 
      className="group flex flex-col items-center w-full h-[500px] transition-all duration-300 hover:scale-105"
    >
      {/* Character Image - Uniform Size */}
      <div className="relative mb-8 flex-shrink-0">
        <div className="relative w-48 h-48">
          <img
            src={agent.imagePath}
            alt={agent.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          {/* Floating sparkles effect - Enhanced */}
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-theme-yellow-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
          <div className="absolute -bottom-3 -left-3 w-5 h-5 bg-theme-pink rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse delay-150"></div>
          <div className="absolute top-1/2 -right-2 w-4 h-4 bg-theme-purple rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse delay-300"></div>
          <div className="absolute top-1/2 -left-2 w-4 h-4 bg-theme-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse delay-450"></div>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-theme-light-blue rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse delay-600"></div>
        </div>
      </div>

      {/* White Content Box - Uniform Height */}
      <div className="relative w-full h-[280px] bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 p-6 group-hover:bg-white flex flex-col">
        {/* Content */}
        <div className="flex flex-col items-center gap-4 w-full text-center h-full justify-between">
          {/* Top Content */}
          <div className="flex flex-col items-center gap-3">
            {/* Category Badge */}
            <span className="text-theme-blue-primary font-lato text-sm font-semibold bg-theme-light-blue/30 px-4 py-2 rounded-full">
              {agent.category}
            </span>

            {/* Agent Name */}
            <h3 className="text-theme-dark-blue font-alata text-xl font-semibold leading-tight group-hover:text-theme-blue-primary transition-colors duration-300">
              {agent.name}
            </h3>

            {/* Description */}
            <p className="text-theme-dark-blue/80 font-lato text-sm leading-relaxed line-clamp-3">
              {agent.description}
            </p>
          </div>

          {/* Bottom Button */}
          <div className="flex items-center gap-2 text-theme-blue-primary font-lato text-base font-semibold group-hover:text-theme-blue-secondary transition-colors duration-300">
            <span>Try Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-theme-yellow-primary/10 to-theme-blue-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
      </div>
    </Link>
  );
};
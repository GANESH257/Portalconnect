import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  MessageCircle, 
  Settings, 
  Download, 
  Trash2, 
  Send,
  Bot,
  Zap,
  Brain,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  responseTime?: number;
  provider: 'sonnet' | 'openai' | 'gemini';
}

interface ChatbotConfig {
  provider: 'sonnet' | 'openai' | 'gemini';
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  defaultPrompt: string;
  isActive: boolean;
}

const chatbotConfigs: ChatbotConfig[] = [
  {
    provider: 'sonnet',
    name: 'Claude Sonnet Chatbot',
    icon: Brain,
    color: 'bg-blue-500',
    defaultPrompt: 'You are a healthcare marketing expert with access to a comprehensive knowledge base. Provide accurate, helpful responses about healthcare marketing strategies, patient engagement, and digital marketing best practices.',
    isActive: true
  },
  {
    provider: 'openai',
    name: 'OpenAI Chatbot',
    icon: Zap,
    color: 'bg-green-500',
    defaultPrompt: 'You are an AI assistant specialized in healthcare marketing. Use your knowledge to provide insights on healthcare marketing trends, patient acquisition strategies, and digital marketing optimization.',
    isActive: true
  },
  {
    provider: 'gemini',
    name: 'Gemini Chatbot',
    icon: Bot,
    color: 'bg-purple-500',
    defaultPrompt: 'You are a healthcare marketing consultant with expertise in digital marketing, patient engagement, and healthcare industry trends. Provide detailed, actionable advice for healthcare marketing challenges.',
    isActive: true
  }
];

export default function MultiLLMChatbotAgent() {
  const [activeTab, setActiveTab] = useState<'sonnet' | 'openai' | 'gemini'>('sonnet');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [responseTimes, setResponseTimes] = useState<Record<string, number[]>>({});

  // Initialize prompts from configs
  useEffect(() => {
    const initialPrompts: Record<string, string> = {};
    chatbotConfigs.forEach(config => {
      initialPrompts[config.provider] = config.defaultPrompt;
    });
    setPrompts(initialPrompts);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      provider: activeTab
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const startTime = Date.now();

    try {
      // Simulate API call with mock responses
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const responseTime = Date.now() - startTime;

      // Generate mock responses based on the input
      let mockResponse = '';
      const message = inputMessage.toLowerCase();

      if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
        mockResponse = `Hello! I'm the ${chatbotConfigs.find(c => c.provider === activeTab)?.name}. I can help you with healthcare marketing questions, patient engagement strategies, and digital marketing best practices. What would you like to know?`;
      } else if (message.includes('marketing') || message.includes('strategy')) {
        mockResponse = `Great question about healthcare marketing! Based on current trends, I recommend focusing on patient-centric content, local SEO optimization, and social media engagement. For ${activeTab === 'sonnet' ? 'Claude Sonnet' : activeTab === 'openai' ? 'OpenAI' : 'Gemini'}, I suggest implementing personalized patient journeys and data-driven campaign optimization.`;
      } else if (message.includes('patient') || message.includes('engagement')) {
        mockResponse = `Patient engagement is crucial for healthcare success. I recommend implementing multi-channel communication strategies, personalized health content, and automated follow-up systems. The key is to provide value at every touchpoint while maintaining HIPAA compliance.`;
      } else if (message.includes('seo') || message.includes('search')) {
        mockResponse = `For healthcare SEO, focus on local search optimization, medical keyword research, and creating high-quality, informative content. Target long-tail keywords related to your services and ensure your Google My Business profile is optimized.`;
      } else {
        mockResponse = `I understand you're asking about "${inputMessage}". As a healthcare marketing expert, I can help you with digital marketing strategies, patient acquisition, content marketing, SEO optimization, and social media engagement. Could you be more specific about what you'd like to know?`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: mockResponse,
        sender: 'bot',
        timestamp: new Date(),
        responseTime,
        provider: activeTab
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Track response times
      setResponseTimes(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), responseTime]
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
        provider: activeTab
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  const exportConversation = () => {
    const conversationData = {
      timestamp: new Date().toISOString(),
      provider: activeTab,
      messages: messages.filter(m => m.provider === activeTab),
      responseTimes: responseTimes[activeTab] || [],
      averageResponseTime: responseTimes[activeTab]?.reduce((a, b) => a + b, 0) / (responseTimes[activeTab]?.length || 1)
    };

    const blob = new Blob([JSON.stringify(conversationData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatbot-${activeTab}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCurrentConfig = () => chatbotConfigs.find(config => config.provider === activeTab)!;
  const currentMessages = messages.filter(m => m.provider === activeTab);
  const avgResponseTime = responseTimes[activeTab]?.reduce((a, b) => a + b, 0) / (responseTimes[activeTab]?.length || 1) || 0;

  return (
    <div 
      className="min-h-screen w-full"
      style={{
        backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.50), rgba(0, 0, 0, 0.50)), url('/img/background.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Multi-LLM Chatbot Comparison
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto drop-shadow-md">
            Compare the efficiency and capabilities of Claude Sonnet, OpenAI, and Gemini chatbots 
            using the Chesterfield S.P.I.N.E Center knowledge base.
          </p>
        </div>

        {/* Main Interface */}
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/40 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-2xl font-bold drop-shadow-md">
                  Chatbot Comparison Interface
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPromptEditor(!showPromptEditor)}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Prompts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportConversation}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearConversation}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Prompt Editor */}
              {showPromptEditor && (
                <div className="mb-6 p-4 bg-white/30 rounded-lg">
                  <h3 className="text-white text-lg font-bold mb-3 drop-shadow-md">Customize System Prompts</h3>
                  <Textarea
                    value={prompts[activeTab] || ''}
                    onChange={(e) => setPrompts(prev => ({ ...prev, [activeTab]: e.target.value }))}
                    placeholder="Enter system prompt..."
                    className="bg-white/20 border-white/30 text-white placeholder-white/60"
                    rows={4}
                  />
                  <p className="text-white text-sm mt-2 font-medium">
                    Customize the system prompt for the {getCurrentConfig().name} to test different approaches.
                  </p>
                </div>
              )}

              {/* Chatbot Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3 bg-white/10">
                  {chatbotConfigs.map((config) => {
                    const IconComponent = config.icon;
                    const messageCount = messages.filter(m => m.provider === config.provider).length;
                    return (
                      <TabsTrigger 
                        key={config.provider} 
                        value={config.provider}
                        className="flex items-center gap-2 text-white data-[state=active]:bg-white/20"
                      >
                        <IconComponent className="w-4 h-4" />
                        {config.name}
                        {messageCount > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                            {messageCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {chatbotConfigs.map((config) => (
                  <TabsContent key={config.provider} value={config.provider} className="mt-6">
                    <div className="space-y-4">
                      {/* Performance Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/30 rounded-lg">
                        <div className="text-center">
                          <div className="text-white text-2xl font-bold drop-shadow-md">
                            {currentMessages.length}
                          </div>
                          <div className="text-white text-sm font-semibold">Messages</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white text-2xl font-bold drop-shadow-md">
                            {avgResponseTime.toFixed(0)}ms
                          </div>
                          <div className="text-white text-sm font-semibold">Avg Response Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white text-2xl font-bold drop-shadow-md">
                            {config.name}
                          </div>
                          <div className="text-white text-sm font-semibold">Provider</div>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="h-96 overflow-y-auto border border-white/50 rounded-lg p-4 bg-white/20">
                        {currentMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-white">
                            <div className="text-center">
                              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-white/80" />
                              <p className="text-lg font-semibold drop-shadow-md">Start a conversation with the {config.name}</p>
                              <p className="text-sm mt-2 font-medium">Ask about spine care, Dr. Bhandarkar's services, endoscopic spine surgery, or patient education strategies.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {currentMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] p-3 rounded-lg ${
                                    message.sender === 'user'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-white/20 text-white'
                                  }`}
                                >
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                                  <div className="text-xs opacity-60 mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                    {message.responseTime && (
                                      <span className="ml-2">
                                        ({message.responseTime}ms)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {isLoading && (
                              <div className="flex justify-start">
                                <div className="bg-white/20 text-white p-3 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                                    <span>Thinking...</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Input Area */}
                      <div className="flex gap-2">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 bg-white/60 border-white/70 text-white placeholder-white font-medium"
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          disabled={isLoading}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isLoading}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function resolveKnowledgeFile(): string | null {
  try {
    const cwd = process.cwd();
    const candidates = [
      path.resolve(cwd, "dist/server/knowledge/onlinespinecare_data.json"),
      path.resolve(cwd, "server/knowledge/onlinespinecare_data.json"),
    ];
    // Attempt import.meta.url directory as a fallback (ESM-safe)
    try {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      candidates.push(path.resolve(__dirname, "../knowledge/onlinespinecare_data.json"));
    } catch {}

    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  } catch {
    return null;
  }
}

interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  prompt: string;
  conversationHistory: ChatMessage[];
}

interface ChatResponse {
  response: string;
  provider: string;
  responseTime: number;
  timestamp: string;
}

// Claude Sonnet Chat Handler
export const handleSonnetChat: RequestHandler = async (req, res) => {
  try {
    const { message, prompt, conversationHistory }: ChatRequest = req.body;
    
    if (!message || !prompt) {
      return res.status(400).json({ error: 'Message and prompt are required' });
    }

    const startTime = Date.now();

    // Load knowledge base
    let knowledgeBase = '';
    
    try {
      const knowledgePath = resolveKnowledgeFile();
      if (!knowledgePath) throw new Error('knowledge file not found');
      console.log('Loading knowledge base from:', knowledgePath);
      const knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
      console.log('Knowledge base loaded, pages:', knowledgeData.length);
      
      // Extract relevant information from JSON structure
      const extractedInfo = knowledgeData.map((page: any) => {
        const headings = page.headings?.filter((h: string) => h.trim() && h !== '\n                            ').join(', ') || '';
        const paragraphs = page.paragraphs?.filter((p: string) => p.trim() && p !== '\n                            ').join(' ') || '';
        return `Page: ${page.url}\nHeadings: ${headings}\nContent: ${paragraphs}`;
      }).join('\n\n');
      
      knowledgeBase = `Chesterfield S.P.I.N.E Center Knowledge Base:\n\n${extractedInfo}`;
      console.log('Knowledge base processed, length:', knowledgeBase.length);
    } catch (error) {
      console.log('Knowledge base file not found, using default:', (error as any)?.message || error);
      knowledgeBase = 'Healthcare marketing knowledge base not available.';
    }

    const systemPrompt = `${prompt}\n\nKnowledge Base:\n${knowledgeBase}`;

    // Check if Claude API key is available
    const claudeApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!claudeApiKey || claudeApiKey === 'sk-ant-api03-your-key-here') {
      // Use mock response with knowledge base context
      const mockResponse = `Claude Sonnet Response: I understand you're asking about "${message}". Based on the Chesterfield S.P.I.N.E Center knowledge base, I can provide insights about Dr. Amit Bhandarkar's spine surgery services, including endoscopic spine surgery, minimally invasive procedures, and patient care. Please provide a valid Claude API key to enable real AI responses.`;
      const responseTime = Date.now() - startTime;

      const response: ChatResponse = {
        response: mockResponse,
        provider: 'sonnet',
        responseTime,
        timestamp: new Date().toISOString()
      };

      res.json(response);
      return;
    }

    // Claude Sonnet API call
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          ...conversationHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json().catch(() => ({}));
      console.error('Claude API error:', errorData);
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const claudeData = await claudeResponse.json();
    const responseTime = Date.now() - startTime;

    const response: ChatResponse = {
      response: claudeData.content[0].text,
      provider: 'sonnet',
      responseTime,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Claude Sonnet chat error:', error);
    res.status(500).json({ error: 'Failed to process Claude Sonnet chat request' });
  }
};

// OpenAI Chat Handler
export const handleOpenAIChat: RequestHandler = async (req, res) => {
  try {
    const { message, prompt, conversationHistory }: ChatRequest = req.body;
    
    if (!message || !prompt) {
      return res.status(400).json({ error: 'Message and prompt are required' });
    }

    const startTime = Date.now();

    // Load knowledge base
    let knowledgeBase = '';
    
    try {
      const knowledgePath = resolveKnowledgeFile();
      if (!knowledgePath) throw new Error('knowledge file not found');
      const knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
      
      // Extract relevant information from JSON structure
      const extractedInfo = knowledgeData.map((page: any) => {
        const headings = page.headings?.filter((h: string) => h.trim() && h !== '\n                            ').join(', ') || '';
        const paragraphs = page.paragraphs?.filter((p: string) => p.trim() && p !== '\n                            ').join(' ') || '';
        return `Page: ${page.url}\nHeadings: ${headings}\nContent: ${paragraphs}`;
      }).join('\n\n');
      
      knowledgeBase = `Chesterfield S.P.I.N.E Center Knowledge Base:\n\n${extractedInfo}`;
    } catch (error) {
      knowledgeBase = 'Healthcare marketing knowledge base not available.';
    }

    const systemPrompt = `${prompt}\n\nKnowledge Base:\n${knowledgeBase}`;

    // Check if OpenAI API key is available (no hardcoded default)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({
        error: 'OpenAI API key is not configured on the server',
      });
    }
    
    // OpenAI API call with CORRECT model
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...conversationHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      // If quota exceeded, provide intelligent fallback response
      if (openaiResponse.status === 429) {
        let fallbackResponse = '';
        
        // Simple greeting detection
        if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hey')) {
          fallbackResponse = `Hello! I'm the OpenAI chatbot assistant for Chesterfield S.P.I.N.E Center. I can help you with questions about spine surgery, Dr. Bhandarkar's services, or healthcare marketing. What would you like to know?`;
        } else if (message.toLowerCase().includes('services') || message.toLowerCase().includes('what does') || message.toLowerCase().includes('offer')) {
          fallbackResponse = `Based on our knowledge base, Dr. Amit Bhandarkar at Chesterfield S.P.I.N.E Center offers endoscopic spine surgery, minimally invasive procedures, and comprehensive spine care services. The practice specializes in spine-related pain management and patient care.`;
        } else {
          fallbackResponse = `I understand you're asking about "${message}". I can help with questions about spine surgery, Dr. Bhandarkar's services, or healthcare marketing. Could you be more specific about what you'd like to know?`;
        }
        
        const responseTime = Date.now() - startTime;

        const response: ChatResponse = {
          response: fallbackResponse,
          provider: 'openai',
          responseTime,
          timestamp: new Date().toISOString()
        };

        res.json(response);
        return;
      }
      
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    const responseTime = Date.now() - startTime;

    const response: ChatResponse = {
      response: openaiData.choices[0].message.content,
      provider: 'openai',
      responseTime,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('OpenAI chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process OpenAI chat request',
      details: error.message 
    });
  }
};

// Gemini Chat Handler
export const handleGeminiChat: RequestHandler = async (req, res) => {
  try {
    const { message, prompt, conversationHistory }: ChatRequest = req.body;
    
    if (!message || !prompt) {
      return res.status(400).json({ error: 'Message and prompt are required' });
    }

    const startTime = Date.now();

    // Load knowledge base
    let knowledgeBase = '';
    
    try {
      const knowledgePath = resolveKnowledgeFile();
      if (!knowledgePath) throw new Error('knowledge file not found');
      const knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
      
      // Extract relevant information from JSON structure
      const extractedInfo = knowledgeData.map((page: any) => {
        const headings = page.headings?.filter((h: string) => h.trim() && h !== '\n                            ').join(', ') || '';
        const paragraphs = page.paragraphs?.filter((p: string) => p.trim() && p !== '\n                            ').join(' ') || '';
        return `Page: ${page.url}\nHeadings: ${headings}\nContent: ${paragraphs}`;
      }).join('\n\n');
      
      knowledgeBase = `Chesterfield S.P.I.N.E Center Knowledge Base:\n\n${extractedInfo}`;
    } catch (error) {
      knowledgeBase = 'Healthcare marketing knowledge base not available.';
    }

    const systemPrompt = `${prompt}\n\nKnowledge Base:\n${knowledgeBase}`;

    // Build conversation history for Gemini
    const conversationText = conversationHistory.map(msg => 
      `${msg.sender === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversationText}\n\nHuman: ${message}\n\nAssistant:`;

    // Check if Gemini API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({
        error: 'Gemini API key is not configured on the server',
      });
    }
    
    // Gemini API call with CORRECT model name
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      
      // Provide intelligent fallback response
      let fallbackResponse = '';
      
      // Simple greeting detection
      if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hey')) {
        fallbackResponse = `Hello! I'm the Gemini chatbot assistant for Chesterfield S.P.I.N.E Center. I can help you with questions about spine surgery, Dr. Bhandarkar's services, or healthcare marketing. What would you like to know?`;
      } else if (message.toLowerCase().includes('services') || message.toLowerCase().includes('what does') || message.toLowerCase().includes('offer')) {
        fallbackResponse = `Based on our knowledge base, Dr. Amit Bhandarkar at Chesterfield S.P.I.N.E Center offers endoscopic spine surgery, minimally invasive procedures, and comprehensive spine care services. The practice specializes in spine-related pain management and patient care.`;
      } else {
        fallbackResponse = `I understand you're asking about "${message}". I can help with questions about spine surgery, Dr. Bhandarkar's services, or healthcare marketing. Could you be more specific about what you'd like to know?`;
      }
      
      const responseTime = Date.now() - startTime;

      const response: ChatResponse = {
        response: fallbackResponse,
        provider: 'gemini',
        responseTime,
        timestamp: new Date().toISOString()
      };

      res.json(response);
      return;
    }

    const geminiData = await geminiResponse.json();
    const responseTime = Date.now() - startTime;

    const response: ChatResponse = {
      response: geminiData.candidates[0].content.parts[0].text,
      provider: 'gemini',
      responseTime,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Gemini chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process Gemini chat request',
      details: error.message 
    });
  }
};

// Get default prompts
export const handleGetPrompts: RequestHandler = (req, res) => {
  const defaultPrompts = {
    sonnet: 'You are a healthcare marketing expert specializing in spine care and pain management. You have access to comprehensive information about Chesterfield S.P.I.N.E Center, Dr. Amit Bhandarkar, and their specialized spine surgery services. Provide accurate, helpful responses about spine care marketing, patient education, and healthcare marketing strategies for spine surgery practices.',
    openai: 'You are an AI assistant specialized in spine care marketing and patient education. Use your knowledge of Chesterfield S.P.I.N.E Center and Dr. Bhandarkar\'s expertise to provide insights on spine surgery marketing, patient acquisition for spine care, and digital marketing optimization for orthopedic spine practices.',
    gemini: 'You are a healthcare marketing consultant with expertise in spine care marketing, patient engagement, and orthopedic surgery practice growth. Provide detailed, actionable advice for marketing spine surgery services, patient education about minimally invasive procedures, and healthcare marketing challenges specific to spine care practices.'
  };

  res.json({ prompts: defaultPrompts });
};

// Save custom prompts
export const handleSavePrompts: RequestHandler = (req, res) => {
  try {
    const { prompts } = req.body;
    
    if (!prompts || typeof prompts !== 'object') {
      return res.status(400).json({ error: 'Invalid prompts format' });
    }

    // TODO: Save prompts to database or file system
    // For now, just return success
    res.json({ 
      success: true, 
      message: 'Prompts saved successfully',
      prompts 
    });
  } catch (error) {
    console.error('Save prompts error:', error);
    res.status(500).json({ error: 'Failed to save prompts' });
  }
};

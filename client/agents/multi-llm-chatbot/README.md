# Multi-LLM Chatbot Comparison Agent

## Overview
A comprehensive chatbot comparison tool that allows you to test and evaluate three different LLM providers (Claude Sonnet, OpenAI, and Gemini) using the same knowledge base. This agent helps you determine which LLM provider works best for your healthcare marketing needs.

## Features

### 🤖 Three Chatbot Options
- **Claude Sonnet Chatbot**: Anthropic's Claude Sonnet model
- **OpenAI Chatbot**: Direct OpenAI API integration  
- **Gemini Chatbot**: Google Gemini API integration

### 📝 Prompt Customization
- Edit default system prompts for each chatbot
- Save custom prompt configurations
- A/B test different prompt strategies

### 💬 Conversation Persistence
- Maintain chat history until homepage navigation
- Session-based conversation storage
- Clear conversations on homepage exit

### 📊 Performance Comparison
- Real-time response time tracking
- Quality assessment tools
- Side-by-side response evaluation
- Export comparison data

## Technical Architecture

### Frontend Components
- `index.tsx` - Main chatbot interface with tab navigation
- `components/ChatbotInterface.tsx` - Individual chatbot UI
- `components/PromptEditor.tsx` - Prompt editing interface
- `components/ConversationHistory.tsx` - Chat persistence

### Backend Integration
- Claude Sonnet API integration
- OpenAI API integration
- Google Gemini API integration
- Shared knowledge base management

### API Endpoints
```
POST /api/multi-llm-chatbot/sonnet      # Claude Sonnet chat
POST /api/multi-llm-chatbot/openai      # OpenAI chat
POST /api/multi-llm-chatbot/gemini      # Gemini chat
GET  /api/multi-llm-chatbot/prompts     # Get default prompts
POST /api/multi-llm-chatbot/prompts     # Save custom prompts
```

## Usage

1. **Select Chatbot**: Choose between Claude Sonnet, OpenAI, or Gemini
2. **Customize Prompts**: Edit system prompts before starting conversation
3. **Start Chatting**: Begin conversation with your chosen LLM
4. **Compare Results**: Switch between chatbots to compare responses
5. **Export Data**: Download comparison results for analysis

## Knowledge Base
All three chatbots use the same healthcare marketing knowledge base to ensure fair comparison of their capabilities and responses.

## Comparison Metrics
- Response time
- Response quality
- Context understanding
- Healthcare knowledge accuracy
- Cost per interaction
- User satisfaction

## Best Practices
- Test with the same questions across all three chatbots
- Use healthcare-specific scenarios for relevant comparisons
- Document your findings for future reference
- Consider both technical performance and business value

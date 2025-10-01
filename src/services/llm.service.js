const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { getSATTutorPrompt } = require('../utils/prompts');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    if (config.llm.provider === 'anthropic') {
      this.client = new Anthropic({
        apiKey: config.llm.anthropicKey,
      });
    } else {
      this.client = new OpenAI({
        apiKey: config.llm.openaiKey,
      });
    }
    this.provider = config.llm.provider;
  }

  async generateResponse(userMessage, conversationHistory, subject) {
    try {
      const systemPrompt = getSATTutorPrompt(subject);
      
      logger.info(`Calling ${this.provider} LLM API`);
      const startTime = Date.now();
      
      let responseText;
      
      if (this.provider === 'anthropic') {
        responseText = await this.generateAnthropicResponse(
          systemPrompt,
          userMessage,
          conversationHistory
        );
      } else {
        responseText = await this.generateOpenAIResponse(
          systemPrompt,
          userMessage,
          conversationHistory
        );
      }
      
      const latency = Date.now() - startTime;
      logger.info(`LLM response received in ${latency}ms`);
      
      return responseText;
    } catch (error) {
      logger.error('LLM API error:', error);
      logger.error('Error details:', {
        message: error.message,
        status: error.status,
        type: error.type,
      });
      throw new Error(`Failed to generate response from LLM: ${error.message}`);
    }
  }
  
  async generateAnthropicResponse(systemPrompt, userMessage, conversationHistory) {
    const messages = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    const response = await this.client.messages.create({
      model: config.llm.model,
      max_tokens: config.llm.maxTokens,
      system: systemPrompt,
      messages: messages,
      temperature: 0.7,
    });
    
    return response.content[0].text;
  }
  
  async generateOpenAIResponse(systemPrompt, userMessage, conversationHistory) {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];
    
    const response = await this.client.chat.completions.create({
      model: config.llm.model,
      messages: messages,
      max_tokens: config.llm.maxTokens,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content;
  }
}

module.exports = new LLMService();
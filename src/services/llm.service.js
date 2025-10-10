const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { getSATTutorPrompt } = require('../utils/prompts');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    this.client = new Anthropic({
      apiKey: config.llm.anthropicKey,
    });
  }

  async generateResponse(userMessage, conversationHistory, subject) {
    try {
      const systemPrompt = getSATTutorPrompt(subject);
      
      logger.info('Calling Anthropic API');
      const startTime = Date.now();
      
      const responseText = await this.generateAnthropicResponse(
        systemPrompt,
        userMessage,
        conversationHistory
      );
      
      const latency = Date.now() - startTime;
      logger.info(`Anthropic response received in ${latency}ms`);
      
      return responseText;
    } catch (error) {
      logger.error('Anthropic API error:', error);
      logger.error('Error details:', {
        message: error.message,
        status: error.status,
        type: error.type,
      });
      throw new Error(`Failed to generate response from Anthropic: ${error.message}`);
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
  
}

module.exports = {
  LLMService,
  default: new LLMService()
};

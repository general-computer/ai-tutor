const OpenAI = require('openai');
const config = require('../config');
const { getSATTutorPrompt } = require('../utils/prompts');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.llm.openaiKey,
    });
  }

  async generateResponse(userMessage, conversationHistory, subject) {
    try {
      const systemPrompt = getSATTutorPrompt(subject);
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];
      
      logger.info('Calling LLM API');
      const startTime = Date.now();
      
      const response = await this.client.chat.completions.create({
        model: config.llm.model,
        messages: messages,
        max_tokens: config.llm.maxTokens,
        temperature: 0.7,
      });
      
      const latency = Date.now() - startTime;
      logger.info(`LLM response received in ${latency}ms`);
      
      return response.choices[0].message.content;
    } catch (error) {
      logger.error('LLM API error:', error);
      throw new Error('Failed to generate response from LLM');
    }
  }
}

module.exports = new LLMService();
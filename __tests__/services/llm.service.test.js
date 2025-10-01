const Anthropic = require('@anthropic-ai/sdk');
const { LLMService } = require('../../src/services/llm.service');
const { getSATTutorPrompt } = require('../../src/utils/prompts');

// Mock dependencies
jest.mock('@anthropic-ai/sdk');
jest.mock('../../src/config', () => ({
  llm: {
    anthropicKey: 'test-key',
    model: 'claude-3-opus-20240229',
    maxTokens: 1000
  }
}));
jest.mock('../../src/utils/prompts', () => ({
  getSATTutorPrompt: jest.fn().mockReturnValue('You are an SAT tutor')
}));
jest.mock('../../src/utils/logger');

describe('LLMService', () => {
  let llmService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock implementation
    Anthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'Mock AI response' }]
        })
      }
    }));
    
    llmService = new LLMService();
  });
  
  describe('generateResponse', () => {
    it('should call Anthropic API and return response', async () => {
      const userMessage = 'Help me with SAT math';
      const conversationHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      const subject = 'math';
      
      const result = await llmService.generateResponse(userMessage, conversationHistory, subject);
      
      expect(result).toBe('Mock AI response');
      expect(llmService.client.messages.create).toHaveBeenCalled();
      expect(getSATTutorPrompt).toHaveBeenCalledWith(subject);
    });
    
    it('should handle API errors gracefully', async () => {
      const userMessage = 'Help me with SAT math';
      const conversationHistory = [];
      const subject = 'math';
      
      llmService.client.messages.create.mockRejectedValue(new Error('API error'));
      
      await expect(llmService.generateResponse(userMessage, conversationHistory, subject))
        .rejects.toThrow('Failed to generate response from Anthropic: API error');
    });
  });
  
  describe('generateAnthropicResponse', () => {
    it('should format messages correctly for Anthropic API', async () => {
      const systemPrompt = 'You are an SAT tutor';
      const userMessage = 'Help me with this problem';
      const conversationHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      
      await llmService.generateAnthropicResponse(systemPrompt, userMessage, conversationHistory);
      
      expect(llmService.client.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7
      });
    });
  });
});

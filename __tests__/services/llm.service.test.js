const LLMService = require('../../src/services/llm.service');
const { Anthropic } = require('@anthropic-ai/sdk');

// Mock dependencies
jest.mock('@anthropic-ai/sdk');

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
    });
    
    it('should handle API errors gracefully', async () => {
      const userMessage = 'Help me with SAT math';
      const conversationHistory = [];
      const subject = 'math';
      
      llmService.client.messages.create.mockRejectedValue(new Error('API error'));
      
      await expect(llmService.generateResponse(userMessage, conversationHistory, subject))
        .rejects.toThrow('API error');
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
      
      expect(llmService.client.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system: systemPrompt,
          messages: expect.arrayContaining([
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
            { role: 'user', content: 'Help me with this problem' }
          ])
        })
      );
    });
  });
});

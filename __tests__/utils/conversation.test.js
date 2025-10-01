const ConversationManager = require('../../src/utils/conversation');
const { v4: uuidv4 } = require('uuid');

// Mock dependencies
jest.mock('uuid');

describe('ConversationManager', () => {
  let conversationManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock UUID generation
    uuidv4.mockReturnValue('mock-uuid-123');
    
    // Create a fresh instance for each test
    conversationManager = new ConversationManager();
    
    // Mock Date.now for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('createSession', () => {
    it('should create a new session with the provided details', () => {
      const sessionId = conversationManager.createSession('user123', 'math');
      
      expect(sessionId).toBe('mock-uuid-123');
      expect(conversationManager.sessions.get('mock-uuid-123')).toEqual({
        id: 'mock-uuid-123',
        userId: 'user123',
        subject: 'math',
        history: [],
        createdAt: 1000,
        lastActivity: 1000
      });
    });
    
    it('should use "general" as default subject if not provided', () => {
      conversationManager.createSession('user123');
      
      expect(conversationManager.sessions.get('mock-uuid-123').subject).toBe('general');
    });
  });
  
  describe('getSession', () => {
    it('should return the session if it exists', () => {
      // Create a session first
      conversationManager.createSession('user123', 'math');
      
      // Update the mock to return a different time for the lastActivity update
      Date.now.mockReturnValue(2000);
      
      const session = conversationManager.getSession('mock-uuid-123');
      
      expect(session).toEqual({
        id: 'mock-uuid-123',
        userId: 'user123',
        subject: 'math',
        history: [],
        createdAt: 1000,
        lastActivity: 2000 // Should be updated
      });
    });
    
    it('should return undefined if session does not exist', () => {
      const session = conversationManager.getSession('non-existent-id');
      
      expect(session).toBeUndefined();
    });
  });
  
  describe('addMessage', () => {
    it('should add a message to the session history', () => {
      // Create a session first
      conversationManager.createSession('user123');
      
      // Update timestamp for message
      Date.now.mockReturnValue(3000);
      
      conversationManager.addMessage('mock-uuid-123', 'user', 'Hello there');
      
      const session = conversationManager.getSession('mock-uuid-123');
      expect(session.history).toEqual([
        { role: 'user', content: 'Hello there', timestamp: 3000 }
      ]);
      expect(session.lastActivity).toBe(3000);
    });
    
    it('should throw an error if session does not exist', () => {
      expect(() => {
        conversationManager.addMessage('non-existent-id', 'user', 'Hello');
      }).toThrow('Session not found');
    });
  });
  
  describe('endSession', () => {
    it('should remove the session if it exists', () => {
      // Create a session first
      conversationManager.createSession('user123');
      
      const result = conversationManager.endSession('mock-uuid-123');
      
      expect(result).toBe(true);
      expect(conversationManager.sessions.has('mock-uuid-123')).toBe(false);
    });
    
    it('should return false if session does not exist', () => {
      const result = conversationManager.endSession('non-existent-id');
      
      expect(result).toBe(false);
    });
  });
  
  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      // Create a session
      conversationManager.createSession('user123');
      
      // Mock the config
      conversationManager.config = { session: { timeoutMs: 500 } };
      
      // Set current time to be after timeout
      Date.now.mockReturnValue(2000);
      
      conversationManager.cleanupExpiredSessions();
      
      expect(conversationManager.sessions.size).toBe(0);
    });
    
    it('should keep active sessions', () => {
      // Create a session
      conversationManager.createSession('user123');
      
      // Mock the config
      conversationManager.config = { session: { timeoutMs: 2000 } };
      
      // Set current time to be before timeout
      Date.now.mockReturnValue(1500);
      
      conversationManager.cleanupExpiredSessions();
      
      expect(conversationManager.sessions.size).toBe(1);
    });
  });
});

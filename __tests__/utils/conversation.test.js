const { ConversationManager } = require('../../src/utils/conversation');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../src/utils/logger');

// Mock dependencies
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-session-id')
}));
jest.mock('../../src/config', () => ({
  session: {
    timeoutMs: 3600000 // 1 hour
  }
}));
jest.mock('../../src/utils/logger');

describe('ConversationManager', () => {
  let conversationManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
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
      
      expect(sessionId).toBe('mock-session-id');
      expect(conversationManager.sessions.get('mock-session-id')).toEqual({
        id: 'mock-session-id',
        userId: 'user123',
        subject: 'math',
        history: [],
        createdAt: 1000,
        lastActivity: 1000
      });
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('should use "general" as default subject if not provided', () => {
      conversationManager.createSession('user123');
      
      expect(conversationManager.sessions.get('mock-session-id').subject).toBe('general');
    });
  });
  
  describe('getSession', () => {
    it('should return the session if it exists', () => {
      const mockSession = { id: 'session-123', lastActivity: 500 };
      conversationManager.sessions.set('session-123', mockSession);
      
      const result = conversationManager.getSession('session-123');
      
      expect(result).toBe(mockSession);
      expect(result.lastActivity).toBe(1000); // Should update lastActivity
    });
    
    it('should return undefined if session does not exist', () => {
      const result = conversationManager.getSession('nonexistent');
      
      expect(result).toBeUndefined();
    });
  });
  
  describe('addMessage', () => {
    it('should add a message to the session history', () => {
      conversationManager.sessions.set('session-123', {
        history: [],
        lastActivity: 500
      });
      
      conversationManager.addMessage('session-123', 'user', 'Hello');
      
      const session = conversationManager.sessions.get('session-123');
      expect(session.history).toEqual([
        { role: 'user', content: 'Hello', timestamp: 1000 }
      ]);
      expect(session.lastActivity).toBe(1000);
    });
    
    it('should throw an error if session does not exist', () => {
      expect(() => {
        conversationManager.addMessage('nonexistent', 'user', 'Hello');
      }).toThrow('Session not found');
    });
  });
  
  describe('endSession', () => {
    it('should remove the session if it exists', () => {
      conversationManager.sessions.set('session-123', {});
      
      const result = conversationManager.endSession('session-123');
      
      expect(result).toBe(true);
      expect(conversationManager.sessions.has('session-123')).toBe(false);
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('should return false if session does not exist', () => {
      const result = conversationManager.endSession('nonexistent');
      
      expect(result).toBe(false);
    });
  });
  
  describe('cleanupExpiredSessions', () => {
    beforeEach(() => {
      // Set up some test sessions
      conversationManager.sessions.set('expired1', { lastActivity: 1000 - 3600001 }); // Expired
      conversationManager.sessions.set('expired2', { lastActivity: 1000 - 3600001 }); // Expired
      conversationManager.sessions.set('active', { lastActivity: 1000 - 1000 }); // Active
    });
    
    it('should remove expired sessions', () => {
      conversationManager.cleanupExpiredSessions();
      
      expect(conversationManager.sessions.has('expired1')).toBe(false);
      expect(conversationManager.sessions.has('expired2')).toBe(false);
    });
    
    it('should keep active sessions', () => {
      conversationManager.cleanupExpiredSessions();
      
      expect(conversationManager.sessions.has('active')).toBe(true);
    });
  });
});

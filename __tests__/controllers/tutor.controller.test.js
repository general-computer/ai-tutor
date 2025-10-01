const TutorController = require('../../src/controllers/tutor.controller');
const conversationManager = require('../../src/utils/conversation');
const agoraService = require('../../src/services/agora.service');
const llmService = require('../../src/services/llm.service');
const ttsService = require('../../src/services/tts.service');
const avatarService = require('../../src/services/avatar.service');

// Mock dependencies
jest.mock('../../src/utils/conversation');
jest.mock('../../src/services/agora.service');
jest.mock('../../src/services/llm.service');
jest.mock('../../src/services/tts.service');
jest.mock('../../src/services/avatar.service');

describe('TutorController', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should return 400 if channelName is missing', async () => {
      await TutorController.generateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Channel name is required' });
    });

    it('should generate and return a token', async () => {
      req.body = { channelName: 'test-channel', uid: '123' };
      agoraService.generateRtcToken.mockReturnValue('mock-token');
      
      await TutorController.generateToken(req, res, next);
      
      expect(agoraService.generateRtcToken).toHaveBeenCalledWith('test-channel', '123');
      expect(res.json).toHaveBeenCalledWith({ token: 'mock-token' });
    });
  });

  describe('startSession', () => {
    it('should create a session and return sessionId', async () => {
      req.body = { userId: 'user123', subject: 'math' };
      conversationManager.createSession.mockReturnValue('session-123');
      
      await TutorController.startSession(req, res, next);
      
      expect(conversationManager.createSession).toHaveBeenCalledWith('user123', 'math');
      expect(res.json).toHaveBeenCalledWith({ sessionId: 'session-123' });
    });
  });

  describe('processMessage', () => {
    it('should return 404 if session not found', async () => {
      req.body = { sessionId: 'invalid-session', message: 'Hello' };
      conversationManager.getSession.mockReturnValue(null);
      
      await TutorController.processMessage(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Session not found' });
    });

    // Add more tests for the happy path
  });

  describe('endSession', () => {
    it('should end the session and return success message', async () => {
      req.body = { sessionId: 'session-123' };
      conversationManager.endSession.mockReturnValue(true);
      
      await TutorController.endSession(req, res, next);
      
      expect(conversationManager.endSession).toHaveBeenCalledWith('session-123');
      expect(res.json).toHaveBeenCalledWith({ message: 'Session ended successfully' });
    });
  });
});

// Mock dependencies before requiring the controller
jest.mock('../../src/services/agora.service', () => ({
  default: {
    generateRtcToken: jest.fn()
  }
}));

jest.mock('../../src/services/llm.service', () => ({
  default: {
    generateResponse: jest.fn()
  }
}));

jest.mock('../../src/services/tts.service', () => ({
  synthesizeSpeech: jest.fn()
}));

jest.mock('../../src/services/avatar.service', () => ({
  generateVideo: jest.fn(),
  pollForVideo: jest.fn()
}));

jest.mock('../../src/utils/conversation', () => ({
  default: {
    createSession: jest.fn(),
    getSession: jest.fn(),
    addMessage: jest.fn(),
    endSession: jest.fn()
  }
}));

jest.mock('../../src/utils/logger');

const TutorController = require('../../src/controllers/tutor.controller');
const agoraService = require('../../src/services/agora.service').default;
const llmService = require('../../src/services/llm.service').default;
const ttsService = require('../../src/services/tts.service');
const avatarService = require('../../src/services/avatar.service');
const conversationManager = require('../../src/utils/conversation').default;

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

    it('should process message and return response with audio and video', async () => {
      req.body = { sessionId: 'session-123', message: 'What is 2+2?' };
      
      const mockSession = {
        id: 'session-123',
        userId: 'user123',
        subject: 'math',
        history: []
      };
      
      conversationManager.getSession.mockReturnValue(mockSession);
      llmService.generateResponse.mockResolvedValue('The answer is 4');
      ttsService.synthesizeSpeech.mockResolvedValue({ url: 'http://audio.url' });
      avatarService.generateVideo.mockResolvedValue('http://video.url');
      
      await TutorController.processMessage(req, res, next);
      
      expect(conversationManager.getSession).toHaveBeenCalledWith('session-123');
      expect(conversationManager.addMessage).toHaveBeenCalledWith('session-123', 'user', 'What is 2+2?');
      expect(llmService.generateResponse).toHaveBeenCalledWith('What is 2+2?', mockSession.history, 'math');
      expect(conversationManager.addMessage).toHaveBeenCalledWith('session-123', 'assistant', 'The answer is 4');
      expect(ttsService.synthesizeSpeech).toHaveBeenCalledWith('The answer is 4');
      expect(avatarService.generateVideo).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        response: 'The answer is 4',
        audioUrl: 'http://audio.url',
        videoUrl: 'http://video.url',
        processingTime: expect.any(Number)
      });
    });

    it('should continue with audio only if avatar generation fails', async () => {
      req.body = { sessionId: 'session-123', message: 'What is 2+2?' };
      
      const mockSession = {
        id: 'session-123',
        userId: 'user123',
        subject: 'math',
        history: []
      };
      
      conversationManager.getSession.mockReturnValue(mockSession);
      llmService.generateResponse.mockResolvedValue('The answer is 4');
      ttsService.synthesizeSpeech.mockResolvedValue({ url: 'http://audio.url' });
      avatarService.generateVideo.mockRejectedValue(new Error('Avatar service unavailable'));
      
      await TutorController.processMessage(req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        response: 'The answer is 4',
        audioUrl: 'http://audio.url',
        videoUrl: null,
        processingTime: expect.any(Number)
      });
    });
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

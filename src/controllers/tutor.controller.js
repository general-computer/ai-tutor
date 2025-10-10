const agoraService = require('../services/agora.service');
const llmService = require('../services/llm.service');
const ttsService = require('../services/tts.service');
const avatarService = require('../services/avatar.service');
const conversationManager = require('../utils/conversation');
const logger = require('../utils/logger');

class TutorController {
  async generateToken(req, res, next) {
    try {
      const { channelName, uid } = req.body;
      
      if (!channelName) {
        return res.status(400).json({ error: 'Channel name is required' });
      }
      
      const token = agoraService.generateRtcToken(channelName, uid);
      
      res.json({ token, channelName, uid });
    } catch (error) {
      next(error);
    }
  }

  async startSession(req, res, next) {
    try {
      const { userId, subject } = req.body;
      
      const sessionId = conversationManager.createSession(userId, subject);
      
      logger.info(`Started tutoring session: ${sessionId}`);
      
      res.json({ 
        sessionId, 
        message: 'Session started successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  async processMessage(req, res, next) {
    try {
      const { sessionId, message } = req.body;
      const startTime = Date.now();
      
      // Get conversation history
      const conversation = conversationManager.getSession(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Add user message to history
      conversationManager.addMessage(sessionId, 'user', message);
      
      // Get LLM response
      logger.info(`Processing message for session ${sessionId}`);
      const llmResponse = await llmService.generateResponse(
        message, 
        conversation.history,
        conversation.subject
      );
      
      // Add assistant response to history
      conversationManager.addMessage(sessionId, 'assistant', llmResponse);
      
      // Generate TTS audio
      const audioData = await ttsService.synthesizeSpeech(llmResponse);
      
      // Generate avatar video (optional - can be done async)
      let videoUrl = null;
      try {
        videoUrl = await avatarService.generateVideo(audioData, llmResponse);
      } catch (avatarError) {
        logger.error('Avatar generation failed, continuing with audio only', avatarError);
      }
      
      const processingTime = Date.now() - startTime;
      logger.info(`Message processed in ${processingTime}ms`);
      
      res.json({
        response: llmResponse,
        audioUrl: audioData.url,
        videoUrl,
        processingTime,
      });
    } catch (error) {
      next(error);
    }
  }

  async endSession(req, res, next) {
    try {
      const { sessionId } = req.body;
      
      conversationManager.endSession(sessionId);
      
      logger.info(`Ended tutoring session: ${sessionId}`);
      
      res.json({ message: 'Session ended successfully' });
    } catch (error) {
      next(error);
    }
  }
  async testLLM(req, res, next) {
    try {
      const { message, subject } = req.body;
      
      const llmResponse = await llmService.generateResponse(
        message || 'What is 2+2?',
        [],
        subject || 'math'
      );
      
      res.json({ 
        response: llmResponse,
        message: 'LLM working correctly'
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = new TutorController();
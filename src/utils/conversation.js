const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('./logger');

class ConversationManager {
  constructor() {
    this.sessions = new Map();
    
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }
  
  createSession(userId, subject = 'general') {
    const sessionId = uuidv4();
    
    this.sessions.set(sessionId, {
      id: sessionId,
      userId,
      subject,
      history: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });
    
    logger.info(`Created session ${sessionId} for user ${userId}`);
    
    return sessionId;
  }
  
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.lastActivity = Date.now();
    }
    
    return session;
  }
  
  addMessage(sessionId, role, content) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    session.history.push({ role, content, timestamp: Date.now() });
    session.lastActivity = Date.now();
    
    // Keep only last 20 messages to manage memory
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }
  }
  
  endSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    
    if (deleted) {
      logger.info(`Ended session ${sessionId}`);
    }
    
    return deleted;
  }
  
  cleanupExpiredSessions() {
    const now = Date.now();
    const timeout = config.session.timeoutMs;
    let cleaned = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired sessions`);
    }
  }
}

module.exports = new ConversationManager();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const config = require('../config');
const logger = require('../utils/logger');

class AgoraService {
  constructor() {
    this.config = config;
  }
  
  generateRtcToken(channelName, uid = 0, role = RtcRole.PUBLISHER) {
    const appId = this.config.agora.appId;
    const appCertificate = this.config.agora.appCertificate;
    
    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }
    
    // Token expires in 24 hours
    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
    
    logger.info(`Generated Agora token for channel: ${channelName}`);
    
    return token;
  }
}

module.exports = {
  AgoraService,
  default: new AgoraService()
};

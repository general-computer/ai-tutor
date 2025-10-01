const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class AvatarService {
  async generateVideo(audioData, text) {
    try {
      logger.info('Generating avatar video');
      const startTime = Date.now();
      
      // Determine if we're using audio data or text for the D-ID API
      let requestBody;
      
      if (audioData) {
        // Use provided audio data
        requestBody = {
          source_url: config.avatar.sourceUrl || 'https://create-images-results.d-id.com/default-presenter.jpg',
          audio: {
            type: 'audio',
            audio_url: audioData // Assuming audioData is a URL to the audio file
          }
        };
      } else {
        // Use text-to-speech
        requestBody = {
          script: {
            type: 'text',
            input: text,
            provider: {
              type: config.avatar.ttsProvider || 'microsoft',
              voice_id: config.avatar.voiceId || 'en-US-JennyNeural',
            },
          },
          config: {
            fluent: true,
            pad_audio: 0,
          },
          source_url: config.avatar.sourceUrl || 'https://create-images-results.d-id.com/default-presenter.jpg',
        };
      }
      
      const response = await axios.post(
        'https://api.d-id.com/talks',
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${config.avatar.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const latency = Date.now() - startTime;
      logger.info(`Avatar video initiated in ${latency}ms`);
      
      // Poll for video completion (simplified)
      const videoUrl = await this.pollForVideo(response.data.id);
      
      return videoUrl;
    } catch (error) {
      logger.error('Avatar generation error:', error);
      throw new Error('Failed to generate avatar video');
    }
  }
  
  async pollForVideo(talkId, maxAttempts = 30, intervalMs = 1000) {
    logger.info(`Polling for D-ID video completion: ${talkId}`);
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      
      try {
        const response = await axios.get(
          `https://api.d-id.com/talks/${talkId}`,
          {
            headers: {
              'Authorization': `Bearer ${config.avatar.apiKey}`,
            },
          }
        );
        
        const status = response.data.status;
        logger.debug(`D-ID video status: ${status} (attempt ${i+1}/${maxAttempts})`);
        
        if (status === 'done') {
          logger.info(`D-ID video ready: ${talkId}`);
          return response.data.result_url;
        } else if (status === 'error') {
          throw new Error(`D-ID video generation failed: ${response.data.error || 'Unknown error'}`);
        }
      } catch (error) {
        logger.error('Error polling for D-ID video:', error);
        if (error.response && error.response.status >= 400) {
          throw new Error(`D-ID API error: ${error.response.status} ${error.response.statusText}`);
        }
      }
    }
    
    logger.error(`D-ID video generation timeout after ${maxAttempts} attempts`);
    throw new Error('D-ID video generation timeout');
  }
}

module.exports = new AvatarService();

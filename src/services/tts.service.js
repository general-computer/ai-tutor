const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class TTSService {
  async synthesizeSpeech(text) {
    try {
      logger.info('Generating speech from text');
      const startTime = Date.now();
      
      // ElevenLabs API example
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.tts.voiceId}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': config.tts.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );
      
      const latency = Date.now() - startTime;
      logger.info(`TTS generated in ${latency}ms`);
      
      // In production, upload to S3/CDN and return URL
      // For now, return base64 encoded audio
      const audioBase64 = Buffer.from(response.data).toString('base64');
      
      return {
        url: `data:audio/mpeg;base64,${audioBase64}`,
        duration: latency,
      };
    } catch (error) {
      logger.error('TTS API error:', error);
      throw new Error('Failed to generate speech');
    }
  }
}

module.exports = new TTSService();
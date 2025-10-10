const axios = require('axios');
const avatarService = require('../../src/services/avatar.service');
const config = require('../../src/config');
const logger = require('../../src/utils/logger');

// Mock dependencies
jest.mock('axios');
jest.mock('../../src/config');
jest.mock('../../src/utils/logger');

describe('Avatar Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default config mock values
    config.avatar = {
      apiKey: 'test-api-key',
      sourceUrl: 'https://test-source-url.com/avatar.jpg',
      ttsProvider: 'test-provider',
      voiceId: 'test-voice-id'
    };
  });

  describe('generateVideo', () => {
    it('should generate video with audio data', async () => {
      // Setup
      const audioData = 'https://example.com/audio.mp3';
      const talkId = 'test-talk-id';
      const resultUrl = 'https://example.com/result-video.mp4';
      
      // Mock axios responses
      axios.post.mockResolvedValueOnce({ data: { id: talkId } });
      axios.get.mockResolvedValueOnce({ data: { status: 'done', result_url: resultUrl } });
      
      // Execute
      const result = await avatarService.generateVideo(audioData);
      
      // Verify
      expect(result).toBe(resultUrl);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.d-id.com/talks',
        {
          source_url: config.avatar.sourceUrl,
          audio: {
            type: 'audio',
            audio_url: audioData
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.avatar.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(logger.info).toHaveBeenCalledWith('Generating avatar video');
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/Avatar video initiated in \d+ms/));
    });

    it('should generate video with text input', async () => {
      // Setup
      const text = 'Hello, this is a test';
      const talkId = 'test-talk-id';
      const resultUrl = 'https://example.com/result-video.mp4';
      
      // Mock axios responses
      axios.post.mockResolvedValueOnce({ data: { id: talkId } });
      axios.get.mockResolvedValueOnce({ data: { status: 'done', result_url: resultUrl } });
      
      // Execute
      const result = await avatarService.generateVideo(null, text);
      
      // Verify
      expect(result).toBe(resultUrl);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.d-id.com/talks',
        {
          script: {
            type: 'text',
            input: text,
            provider: {
              type: config.avatar.ttsProvider,
              voice_id: config.avatar.voiceId,
            },
          },
          config: {
            fluent: true,
            pad_audio: 0,
          },
          source_url: config.avatar.sourceUrl,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.avatar.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should handle errors during video generation', async () => {
      // Setup
      const text = 'Hello, this is a test';
      const error = new Error('API error');
      
      // Mock axios to throw an error
      axios.post.mockRejectedValueOnce(error);
      
      // Execute and verify
      await expect(avatarService.generateVideo(null, text)).rejects.toThrow('Failed to generate avatar video');
      expect(logger.error).toHaveBeenCalledWith('Avatar generation error:', error);
    });
  });

  describe('pollForVideo', () => {
    it('should return video URL when status is done', async () => {
      // Setup
      const talkId = 'test-talk-id';
      const resultUrl = 'https://example.com/result-video.mp4';
      
      // Mock axios response
      axios.get.mockResolvedValueOnce({ 
        data: { status: 'done', result_url: resultUrl } 
      });
      
      // Execute
      const result = await avatarService.pollForVideo(talkId, 1, 10);
      
      // Verify
      expect(result).toBe(resultUrl);
      expect(axios.get).toHaveBeenCalledWith(
        `https://api.d-id.com/talks/${talkId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.avatar.apiKey}`,
          },
        }
      );
      expect(logger.info).toHaveBeenCalledWith(`Polling for D-ID video completion: ${talkId}`);
      expect(logger.info).toHaveBeenCalledWith(`D-ID video ready: ${talkId}`);
    });

    it('should throw error when status is error', async () => {
      // Setup
      const talkId = 'test-talk-id';
      const errorMessage = 'Processing failed';
      
      // Mock axios response
      axios.get.mockResolvedValueOnce({ 
        data: { status: 'error', error: errorMessage } 
      });
      
      // Execute and verify
      await expect(avatarService.pollForVideo(talkId, 1, 10)).rejects.toThrow(
        `D-ID video generation failed: ${errorMessage}`
      );
      
      // Verify logger was called with the error message
      expect(logger.error).toHaveBeenCalledWith(`D-ID video generation failed: ${errorMessage}`);
    });

    it('should throw error after max attempts', async () => {
      // Setup
      const talkId = 'test-talk-id';
      
      // Mock axios response for "processing" status
      axios.get.mockResolvedValue({ 
        data: { status: 'processing' } 
      });
      
      // Execute and verify
      await expect(avatarService.pollForVideo(talkId, 2, 10)).rejects.toThrow(
        'D-ID video generation timeout'
      );
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(logger.error).toHaveBeenCalledWith('D-ID video generation timeout after 2 attempts');
    });

    it('should handle API errors during polling', async () => {
      // Setup
      const talkId = 'test-talk-id';
      const error = { 
        response: { 
          status: 404, 
          statusText: 'Not Found' 
        } 
      };
      
      // Mock axios to throw an error
      axios.get.mockRejectedValueOnce(error);
      
      // Execute and verify
      await expect(avatarService.pollForVideo(talkId, 1, 10)).rejects.toThrow(
        'D-ID API error: 404 Not Found'
      );
      expect(logger.error).toHaveBeenCalledWith('Error polling for D-ID video:', error);
    });
  });
});

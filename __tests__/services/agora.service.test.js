const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { AgoraService } = require('../../src/services/agora.service');

// Mock dependencies
jest.mock('agora-access-token');
jest.mock('../../src/utils/logger');

describe('AgoraService', () => {
  let agoraService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock token builder
    RtcTokenBuilder.buildTokenWithUid = jest.fn().mockReturnValue('mock-token');
    
    agoraService = new AgoraService();
    
    // Mock config
    agoraService.config = {
      agora: {
        appId: 'test-app-id',
        appCertificate: 'test-certificate'
      }
    };
  });
  
  describe('generateRtcToken', () => {
    it('should generate a token with the provided parameters', () => {
      const token = agoraService.generateRtcToken('test-channel', '123');
      
      expect(token).toBe('mock-token');
      expect(RtcTokenBuilder.buildTokenWithUid).toHaveBeenCalledWith(
        'test-app-id',
        'test-certificate',
        'test-channel',
        '123',
        RtcRole.PUBLISHER,
        expect.any(Number)
      );
    });
    
    it('should use default values if not provided', () => {
      const token = agoraService.generateRtcToken('test-channel');
      
      expect(RtcTokenBuilder.buildTokenWithUid).toHaveBeenCalledWith(
        'test-app-id',
        'test-certificate',
        'test-channel',
        0, // Default UID
        RtcRole.PUBLISHER, // Default role
        expect.any(Number)
      );
    });
    
    it('should throw an error if Agora credentials are not configured', () => {
      // Remove credentials from config
      agoraService.config.agora = {};
      
      expect(() => {
        agoraService.generateRtcToken('test-channel');
      }).toThrow('Agora credentials not configured');
    });
  });
});

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  agora: {
    appId: process.env.AGORA_APP_ID,
    appCertificate: process.env.AGORA_APP_CERTIFICATE,
  },
  
  llm: {
    provider: 'openai', // or 'anthropic'
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    model: 'gpt-4-turbo-preview',
    maxTokens: 500,
  },
  
  tts: {
    provider: 'elevenlabs',
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
  },
  
  avatar: {
    provider: 'did', // or 'heygen'
    apiKey: process.env.D_ID_API_KEY,
  },
  
  session: {
    timeoutMs: parseInt(process.env.SESSION_TIMEOUT_MS) || 1800000,
  },
};
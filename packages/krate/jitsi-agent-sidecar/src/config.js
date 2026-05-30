export function loadConfig(env = process.env) {
  return {
    roomUrl: env.JITSI_ROOM_URL || '',
    jwt: env.JITSI_JWT || '',
    roomId: env.JITSI_ROOM_ID || '',
    participantName: env.JITSI_PARTICIPANT_NAME || 'Krate Agent',
    role: env.JITSI_PARTICIPANT_ROLE || 'observer',
    goodbyeMessage: env.JITSI_GOODBYE_MESSAGE || 'Agent is leaving the meeting.',
    socketPath: env.AGENT_SOCKET_PATH || '/tmp/jitsi-agent.sock',
    capabilities: {
      audio: env.JITSI_AUDIO_MODE || 'none',
      chat: env.JITSI_CHAT_MODE || 'read',
      screenshare: env.JITSI_SCREENSHARE_MODE || 'none',
    },
    tts: {
      provider: env.JITSI_TTS_PROVIDER || '',
      voice: env.JITSI_TTS_VOICE || 'nova',
      speed: env.JITSI_TTS_SPEED || '1.0',
    },
    stt: {
      provider: env.JITSI_STT_PROVIDER || '',
    },
    vad: {
      provider: env.JITSI_VAD_PROVIDER || 'local-vad',
    },
    headless: env.JITSI_HEADLESS !== 'false',
    chromiumExecutablePath: env.PUPPETEER_EXECUTABLE_PATH || env.CHROMIUM_PATH || '',
  };
}

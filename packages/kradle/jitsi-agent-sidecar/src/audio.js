export function createAudioPipeline(config = {}) {
  const capabilities = config.capabilities || {};
  const audioMode = capabilities.audio || config.audioMode || 'none';
  const ttsProvider = config.tts?.provider || config.ttsProvider || '';
  const sttProvider = config.stt?.provider || config.sttProvider || '';
  const vadProvider = config.vad?.provider || config.vadProvider || 'local-vad';

  return {
    canSpeak() {
      return (audioMode === 'speak' || audioMode === 'both') && Boolean(ttsProvider);
    },

    canTranscribe() {
      return (audioMode === 'listen' || audioMode === 'both') && Boolean(sttProvider);
    },

    canDetectVoice() {
      return audioMode === 'listen' || audioMode === 'both';
    },

    async speak(text, options = {}) {
      if (!this.canSpeak()) {
        return { ok: false, error: 'speak_tts requires audio speak capability and a configured TTS provider' };
      }
      return {
        ok: true,
        provider: ttsProvider,
        voice: options.voice || config.tts?.voice || config.ttsVoice || 'nova',
        text,
      };
    },

    transcribe() {
      if (!this.canTranscribe()) {
        return { ok: false, error: 'STT requires listen-capable audio configuration and a configured STT provider' };
      }
      return { ok: true, provider: sttProvider, transcript: [] };
    },

    detectVoice() {
      if (!this.canDetectVoice()) {
        return { ok: false, error: 'VAD requires listen-capable audio configuration' };
      }
      return { ok: true, provider: vadProvider, speechDetected: false };
    },
  };
}

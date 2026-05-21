/**
 * OpenAI Realtime API — centralized configuration for voice-server (Twilio bridge)
 *
 * Twilio Media Streams uses G.711 μ-law (audio/pcmu) at 8 kHz.
 * That's why this file uses different audio format constants than the
 * patient-app version (which uses audio/pcm at 24 kHz for browser WebRTC).
 *
 * To A/B test a different model, set OPENAI_REALTIME_MODEL in the
 * voice-server's environment (Cloud Run env var or .env file).
 */

export const OPENAI_REALTIME = {
    /**
     * WebSocket URL for direct Realtime connection (server-side, with API key auth).
     * NOTE: includes ?model= query string built dynamically — see getWebSocketUrl()
     */
    WEBSOCKET_BASE_URL: 'wss://api.openai.com/v1/realtime',
  
    /**
     * Realtime model.
     * Options: 'gpt-realtime' | 'gpt-realtime-mini' | 'gpt-realtime-2'
     * Override per-environment with OPENAI_REALTIME_MODEL env var.
     */
    MODEL: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',
  
    /**
     * Voice for Dr. Bridge over Twilio phone calls.
     * Safe over G.711 μ-law: alloy, echo, shimmer, ash, ballad, coral, sage, verse
     * AVOID for Twilio (known distortion on G.711): fable, onyx, nova
     * NOT supported for Twilio: marin, cedar (browser-only premium voices)
     */
    VOICE: process.env.OPENAI_REALTIME_VOICE || 'alloy',
  
    /** Whisper model for input transcription (for call recording) */
    TRANSCRIPTION_MODEL: 'whisper-1',
  
    /** Audio format for Twilio Media Streams (G.711 μ-law @ 8 kHz) */
    TWILIO_AUDIO_FORMAT: { type: 'audio/pcmu' } as const,
  
    /** Server VAD (voice activity detection) — tuned for phone-call latency */
    TURN_DETECTION: {
      type: 'server_vad' as const,
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 800,
    },
  
    /** Output modalities — voice-only for phone calls */
    OUTPUT_MODALITIES: ['audio'] as const,
  
    /** Build the full WebSocket URL with the current model */
    getWebSocketUrl(): string {
      return `${this.WEBSOCKET_BASE_URL}?model=${this.MODEL}`;
    },
  } as const;
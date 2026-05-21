/**
 * OpenAI Realtime API — centralized configuration
 *
 * Single source of truth for all Realtime API constants used across the
 * MediBridge patient app. Change values here once and they propagate
 * everywhere.
 *
 * To A/B test a different model, set OPENAI_REALTIME_MODEL in Vercel env vars.
 * No code deploy needed for the swap.
 */

export const OPENAI_REALTIME = {
    /** Server-side endpoint to mint ephemeral client secrets (GA) */
    CLIENT_SECRETS_URL: 'https://api.openai.com/v1/realtime/client_secrets',
  
    /** Browser endpoint for WebRTC SDP exchange (GA) */
    WEBRTC_SDP_URL: 'https://api.openai.com/v1/realtime/calls',
  
    /**
     * Realtime model.
     * Options: 'gpt-realtime' | 'gpt-realtime-mini' | 'gpt-realtime-2'
     * Override per-environment with OPENAI_REALTIME_MODEL env var.
     */
    MODEL: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',
  
    /**
     * Voice for Dr. Bridge.
     * Safe for both browser (audio/pcm) and Twilio (audio/pcmu): alloy, echo, shimmer, ash, ballad, coral, sage, verse
     * Premium GA voices (browser only, may distort over G.711): marin, cedar
     * Avoid for Twilio G.711: fable, onyx, nova (known distortion issues)
     */
    VOICE: process.env.OPENAI_REALTIME_VOICE || 'alloy',
  
    /** Whisper model for live input transcription */
    TRANSCRIPTION_MODEL: 'whisper-1',
  
    /** Server VAD (voice activity detection) settings — tuned for healthcare conversations */
    TURN_DETECTION: {
      type: 'server_vad' as const,
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 800,
      create_response: true,
    },
  
    /** Audio format for browser WebRTC (24 kHz PCM) */
    BROWSER_AUDIO_FORMAT: { type: 'audio/pcm', rate: 24000 } as const,
  
    /** Output modalities for voice-only sessions */
    OUTPUT_MODALITIES: ['audio'] as const,
  } as const;
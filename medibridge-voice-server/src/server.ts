// Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { TwilioMediaStreamHandler } from './services/TwilioMediaStreamHandler';

const app = express();
const server = http.createServer(app);

// Parse URL-encoded bodies (Twilio sends form data)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// WebSocket server for Twilio Media Streams
const wss = new WebSocketServer({ server, path: '/media-stream' });

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'active',
    service: 'MediBridge Voice Server',
    version: '1.1.0',
    endpoints: {
      phone: '/media-stream',
      whatsapp: '/whatsapp-voice'
    },
    websocket: '/media-stream',
    env_check: {
      supabase_url: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
      openai_key: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'
    }
  });
});

// Health check for monitoring
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Twilio webhook - returns TwiML to start Media Stream (Phone Calls)
app.post('/media-stream', (req, res) => {
  const callerPhone = req.body.From || req.body.Caller || 'unknown';
  const calledNumber = req.body.To || req.body.Called || 'unknown';
  const callSid = req.body.CallSid || 'unknown';
  
  console.log('📞 Incoming phone call from:', callerPhone, 'CallSid:', callSid);
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">Namaste! Dr. Bridge se connect ho rahe hain. Kripya pratiksha karein.</Say>
  <Connect>
    <Stream url="wss://medibridge-voice-server-172718285538.asia-south1.run.app/media-stream">
      <Parameter name="callerPhone" value="${callerPhone}" />
      <Parameter name="calledNumber" value="${calledNumber}" />
      <Parameter name="callSid" value="${callSid}" />
      <Parameter name="callSource" value="phone" />
    </Stream>
  </Connect>
</Response>`;

  res.set('Content-Type', 'application/xml');
  res.send(twiml);
});

// WhatsApp Voice webhook - handles incoming WhatsApp calls via Twilio
app.post('/whatsapp-voice', (req, res) => {
  // WhatsApp format: whatsapp:+919958824555
  const rawFrom = req.body.From || req.body.Caller || 'unknown';
  const rawTo = req.body.To || req.body.Called || 'unknown';
  const callSid = req.body.CallSid || 'unknown';
  
  // Extract phone number from WhatsApp format
  const callerPhone = rawFrom.replace('whatsapp:', '');
  const calledNumber = rawTo.replace('whatsapp:', '');
  
  console.log('📱 WhatsApp Voice Call:', {
    from: callerPhone,
    to: calledNumber,
    callSid: callSid,
    rawFrom: rawFrom
  });
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">Namaste! Dr. Bridge se connect ho rahe hain. Kripya pratiksha karein.</Say>
  <Connect>
    <Stream url="wss://medibridge-voice-server-172718285538.asia-south1.run.app/media-stream">
      <Parameter name="callerPhone" value="${callerPhone}" />
      <Parameter name="calledNumber" value="${calledNumber}" />
      <Parameter name="callSid" value="${callSid}" />
      <Parameter name="callSource" value="whatsapp" />
    </Stream>
  </Connect>
</Response>`;

  res.set('Content-Type', 'application/xml');
  res.send(twiml);
});

// Handle WebSocket connections from Twilio
wss.on('connection', (ws: WebSocket, req) => {
  console.log('🔌 New WebSocket connection from Twilio');
  
  const handler = new TwilioMediaStreamHandler(ws);
  
  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      handler.handleMessage(message);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
    handler.cleanup();
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    handler.cleanup();
  });
});

// Start server
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎙️  MediBridge Voice Server Started');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📡 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/media-stream`);
  console.log('───────────────────────────────────────────────────────');
  console.log('📞 Phone Calls:    POST /media-stream');
  console.log('📱 WhatsApp Calls: POST /whatsapp-voice');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔐 Environment Check:');
  console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   OPENAI_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log('═══════════════════════════════════════════════════════');
});

export default server;
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('========================================');
  console.log('🎤 TRANSCRIBE API CALLED');
  console.log('========================================');
  
  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not configured!');
    return NextResponse.json({ 
      success: false, 
      error: 'Transcription service not configured',
      text: ''
    }, { status: 500 });
  }
  
  console.log('✅ OpenAI API key present (length:', process.env.OPENAI_API_KEY.length, ')');
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | Blob;

    if (!audioFile) {
      console.error('❌ No audio file in FormData');
      return NextResponse.json({ 
        success: false, 
        error: 'No audio file provided',
        text: ''
      }, { status: 400 });
    }

    // Get file details
    const fileSize = audioFile.size;
    const fileType = audioFile.type || 'audio/webm';
    
    console.log('📁 Audio file details:');
    console.log('   - Type:', fileType);
    console.log('   - Size:', fileSize, 'bytes');
    console.log('   - Size KB:', (fileSize / 1024).toFixed(2), 'KB');

    // Validate file size
    if (fileSize < 100) {
      console.error('❌ File too small:', fileSize, 'bytes');
      return NextResponse.json({ 
        success: false, 
        error: 'Recording too short - please hold the button longer',
        text: ''
      }, { status: 400 });
    }

    // Convert to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('📦 Buffer created:', buffer.length, 'bytes');
    console.log('📦 First 20 bytes (hex):', buffer.slice(0, 20).toString('hex'));

    // Create File object for OpenAI
    const file = new File([buffer], 'recording.webm', { 
      type: 'audio/webm' 
    });

    console.log('📤 Sending to Whisper API...');
    console.log('📤 File for Whisper:');
    console.log('   - Name:', file.name);
    console.log('   - Type:', file.type);
    console.log('   - Size:', file.size);

    // Call Whisper API with verbose logging
    const startTime = Date.now();
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json', // Get detailed response
      prompt: 'Healthcare voice message about medicines and prescriptions. May be in Hindi, English, or Hinglish.',
    });

    const endTime = Date.now();
    console.log('⏱️ Whisper API took:', endTime - startTime, 'ms');
    
    console.log('📥 Whisper FULL response:');
    console.log(JSON.stringify(transcription, null, 2));

    // Extract text - handle different response formats
    let transcribedText = '';
    
    if (typeof transcription === 'string') {
      transcribedText = transcription;
      console.log('📝 Response was string:', transcribedText);
    } else if (transcription.text) {
      transcribedText = transcription.text;
      console.log('📝 Response had .text:', transcribedText);
    } else if ((transcription as any).segments) {
      // verbose_json format has segments
      const segments = (transcription as any).segments;
      console.log('📝 Response had segments:', segments?.length);
      transcribedText = segments?.map((s: any) => s.text).join(' ') || '';
    }

    console.log('📝 Final extracted text:', `"${transcribedText}"`);
    console.log('📝 Text length:', transcribedText.length);

    // Check if we got actual text
    if (!transcribedText || transcribedText.trim() === '') {
      console.warn('⚠️ Whisper returned EMPTY transcription');
      console.warn('⚠️ This usually means:');
      console.warn('   1. Audio is silent or too quiet');
      console.warn('   2. Audio codec not properly decoded');
      console.warn('   3. Recording is just noise');
      
      return NextResponse.json({
        success: false,
        error: 'Could not understand audio - please speak clearly and try again',
        text: '',
        debug: {
          audioSize: fileSize,
          whisperResponse: transcription
        }
      });
    }

    console.log('✅ SUCCESS! Transcription:', transcribedText);

    return NextResponse.json({
      success: true,
      text: transcribedText.trim(),
    });

  } catch (error: any) {
    console.error('========================================');
    console.error('❌ TRANSCRIPTION ERROR');
    console.error('========================================');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
    }
    if (error.error) {
      console.error('OpenAI error object:', JSON.stringify(error.error));
    }
    
    console.error('Full error:', error);

    // User-friendly message
    let userMessage = 'Could not process audio - please try again';
    
    if (error.message?.includes('Invalid file format')) {
      userMessage = 'Audio format not supported - try recording again';
    } else if (error.message?.includes('decode')) {
      userMessage = 'Audio could not be processed - try recording again';
    } else if (error.status === 401) {
      userMessage = 'Service authentication error';
    } else if (error.status === 429) {
      userMessage = 'Service busy - please wait and try again';
    }

    return NextResponse.json({
      success: false,
      error: userMessage,
      text: '',
      debug: process.env.NODE_ENV === 'development' ? {
        errorMessage: error.message,
        errorCode: error.code
      } : undefined
    }, { status: 500 });
  }
}
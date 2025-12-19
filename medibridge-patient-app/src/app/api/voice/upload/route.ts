import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🎤 Transcribe API called');
  
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ 
      success: false, 
      error: 'Transcription service not configured',
      text: ''
    }, { status: 500 });
  }

  let tempFilePath = '';
  
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | Blob;

    if (!audioFile) {
      return NextResponse.json({ 
        success: false, 
        error: 'No audio file provided',
        text: ''
      }, { status: 400 });
    }

    const fileSize = audioFile.size;
    console.log('🎤 Audio size:', fileSize, 'bytes');

    if (fileSize < 1000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Recording too short',
        text: ''
      }, { status: 400 });
    }

    // Convert to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to a temporary file - this is the most reliable method
    const timestamp = Date.now();
    tempFilePath = join(tmpdir(), `audio-${timestamp}.webm`);
    
    console.log('🎤 Writing to temp file:', tempFilePath);
    await writeFile(tempFilePath, buffer);

    // Create a read stream from the file
    const fileStream = createReadStream(tempFilePath);

    console.log('🎤 Calling Whisper API with file stream...');

    // Use file stream - OpenAI SDK handles this correctly
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
    });

    console.log('🎤 Response:', transcription);

    const text = transcription.text || '';

    if (!text.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Could not understand audio - please speak clearly',
        text: ''
      });
    }

    console.log('✅ Transcription:', text);

    return NextResponse.json({
      success: true,
      text: text.trim(),
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('❌ Full:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Transcription failed',
      text: ''
    }, { status: 500 });
    
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log('🧹 Temp file cleaned up');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}
# OpenAI Integration Setup Guide

This guide explains how to enable OpenAI integration for AI-powered chat features in MediBridge24x7.

## Overview

The application includes AI chat capabilities that can provide automated responses to patient inquiries. The AI features are controlled at the organization level and require an OpenAI API key to function.

## Prerequisites

1. An OpenAI account with API access
2. An OpenAI API key (get one from https://platform.openai.com/api-keys)

## Setup Steps

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (it starts with `sk-`)

**Important:** Keep your API key secure and never commit it to version control.

### 2. Add API Key to Environment Variables

Create a `.env` file in the `medibridge24x7` directory (if it doesn't exist) and add:

```env
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Note:** Replace `sk-your-openai-api-key-here` with your actual API key.

### 3. Enable AI for Your Organization

1. Log in as a super admin
2. Navigate to **Admin Dashboard** → **Organizations**
3. Click **Edit** on the organization you want to enable AI for
4. Check the **"AI Features Enabled"** checkbox
5. Click **Update Organization**

### 4. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## How It Works

1. **Organization-Level Control**: AI features can be enabled/disabled per organization through the admin dashboard
2. **Automatic Responses**: When AI is enabled, the system automatically generates responses to patient messages in chat sessions
3. **Context-Aware**: The AI uses conversation history and patient information to provide relevant responses
4. **Medical Assistant Role**: The AI is configured as a medical assistant that:
   - Provides general health information
   - Helps understand symptoms
   - Answers questions about medications
   - Reminds users it cannot replace professional medical advice
   - Escalates complex cases appropriately

## Security Considerations

⚠️ **Important Security Note:**

Currently, the OpenAI API key is used directly from the frontend (`dangerouslyAllowBrowser: true`). This is acceptable for development but **NOT recommended for production**.

### For Production:

You should implement one of these approaches:

1. **Supabase Edge Functions**: Create a Supabase Edge Function that handles OpenAI API calls server-side
2. **Backend API Route**: Create a backend API endpoint that proxies OpenAI requests
3. **Environment Variables**: Store the API key securely on your backend server

This prevents exposing your API key to clients and allows you to:
- Implement rate limiting
- Add usage tracking
- Control costs
- Enhance security

## Troubleshooting

### AI Responses Not Appearing

1. **Check API Key**: Ensure `VITE_sk-proj-GGK2EA-pPGuqAXqwYrn4DUSobraeEnStQ2w7qU7yvzJKeAL1Rbu31WF5zw-Nhuq4zHwMLhEiZLT3BlbkFJbhbCe-tYv49iabiyWkIgovmkNreYrJAuWCsrNyqxtqYUJYKwjoXPs1TQbXfHt2ZdrJEZBVw4sA` is set in your `.env` file
2. **Check Organization Settings**: Verify that "AI Features Enabled" is checked for your organization
3. **Check Console**: Look for errors in the browser console
4. **Check API Quota**: Ensure your OpenAI account has available credits/quota

### Error: "OpenAI API key is not configured"

- Make sure your `.env` file is in the `medibridge24x7` directory
- Ensure the variable name is exactly `VITE_OPENAI_API_KEY`
- Restart your development server after adding the variable
- Check that the `.env` file is not in `.gitignore` (it should be ignored, but the file should exist locally)

### Error: "Failed to generate AI response"

- Check your OpenAI API key is valid
- Verify you have available credits/quota in your OpenAI account
- Check your internet connection
- Review browser console for detailed error messages

## Cost Considerations

OpenAI API usage is billed based on:
- **Model**: Currently using `gpt-3.5-turbo` (cost-effective)
- **Tokens**: Number of input/output tokens used
- **Requests**: Number of API calls made

Monitor your usage at: https://platform.openai.com/usage

## Configuration Options

You can customize the AI behavior by editing `src/lib/openaiClient.ts`:

- **Model**: Change `gpt-3.5-turbo` to `gpt-4` for better quality (higher cost)
- **Temperature**: Adjust `temperature: 0.7` (0-1, higher = more creative)
- **Max Tokens**: Change `max_tokens: 500` to control response length
- **System Prompt**: Modify the system prompt to change AI behavior

## Testing

1. Create a chat session with a patient
2. Send a message as a staff member
3. Wait a few seconds for the AI response
4. Verify the AI response appears in the chat

## Support

For issues or questions:
- Check OpenAI API status: https://status.openai.com/
- Review OpenAI documentation: https://platform.openai.com/docs
- Check application logs and browser console for errors



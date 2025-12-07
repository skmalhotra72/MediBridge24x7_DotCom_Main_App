# How to Connect OpenAI with Cursor IDE

This guide explains how to configure Cursor IDE to use OpenAI models for AI assistance.

## Overview

Cursor IDE has built-in AI capabilities powered by various language models. You can configure it to use OpenAI models (like GPT-4) for enhanced code assistance, chat, and autocomplete features.

## Setup Steps

### Method 1: Using Cursor Settings UI (Recommended)

1. **Open Cursor Settings**
   - Press `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac)
   - Or go to: **File** → **Preferences** → **Settings**

2. **Navigate to AI Settings**
   - In the settings search bar, type: `cursor ai` or `model`
   - Look for settings related to:
     - "Cursor: Model Provider"
     - "Cursor: API Key"
     - "AI" or "Model" settings

3. **Configure OpenAI**
   - Find the **"Model Provider"** or **"AI Provider"** setting
   - Select **"OpenAI"** from the dropdown
   - Enter your OpenAI API key in the **"API Key"** field
     - Get your API key from: https://platform.openai.com/api-keys
     - Your key starts with `sk-`

4. **Select Model** (if available)
   - Choose your preferred model:
     - `gpt-4` - Most capable, higher cost
     - `gpt-4-turbo` - Faster GPT-4 variant
     - `gpt-3.5-turbo` - Cost-effective option
     - `gpt-4o` - Latest optimized model

5. **Save Settings**
   - Click **"Save"** or the settings will auto-save
   - Restart Cursor if prompted

### Method 2: Using Cursor Settings JSON

1. **Open Settings JSON**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: `Preferences: Open User Settings (JSON)`
   - Press Enter

2. **Add Configuration**
   Add these lines to your settings JSON:

```json
{
  "cursor.aiProvider": "openai",
  "cursor.openaiApiKey": "sk-your-api-key-here",
  "cursor.model": "gpt-4",
  "cursor.chatModel": "gpt-4"
}
```

3. **Replace Placeholder**
   - Replace `sk-your-api-key-here` with your actual OpenAI API key
   - Adjust model names as needed

4. **Save and Restart**
   - Save the file (`Ctrl+S` or `Cmd+S`)
   - Restart Cursor IDE

### Method 3: Using Cursor Command Palette

1. **Open Command Palette**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)

2. **Search for AI Settings**
   - Type: `Cursor: Configure AI` or `Cursor: Settings`
   - Select the relevant command

3. **Follow Prompts**
   - Select OpenAI as provider
   - Enter your API key when prompted
   - Choose your preferred model

## Getting Your OpenAI API Key

1. **Visit OpenAI Platform**
   - Go to: https://platform.openai.com/api-keys
   - Sign in or create an account

2. **Create API Key**
   - Click **"Create new secret key"**
   - Give it a name (e.g., "Cursor IDE")
   - Copy the key immediately (you won't see it again!)

3. **Important Security Notes**
   - ⚠️ Never share your API key publicly
   - ⚠️ Don't commit it to version control
   - ⚠️ Consider setting usage limits in OpenAI dashboard

## Verifying Configuration

After setup, you can verify it's working:

1. **Open Cursor Chat**
   - Press `Ctrl+L` (Windows/Linux) or `Cmd+L` (Mac)
   - Or click the chat icon in the sidebar

2. **Test AI Response**
   - Ask a question like: "Explain this code"
   - If you get a response, OpenAI is connected! ✅

3. **Check Status**
   - Look for any error messages in the chat
   - Check the bottom-right status bar for connection status

## Troubleshooting

### API Key Not Working

- **Check Key Format**: Should start with `sk-`
- **Verify Key**: Test it at https://platform.openai.com/api-keys
- **Check Quota**: Ensure you have available credits
- **Regenerate Key**: Create a new key if needed

### Model Not Available

- **Check Subscription**: Some models require specific OpenAI plans
- **Try Different Model**: Switch to `gpt-3.5-turbo` as fallback
- **Check API Status**: Visit https://status.openai.com/

### Settings Not Saving

- **Check Permissions**: Ensure Cursor can write to settings file
- **Restart Cursor**: Sometimes a restart is needed
- **Check JSON Syntax**: If using JSON method, ensure valid syntax

### Connection Errors

- **Check Internet**: Ensure stable internet connection
- **Firewall/VPN**: May block OpenAI API calls
- **Proxy Settings**: Configure if behind corporate proxy

## Cost Considerations

OpenAI API usage is billed per token:
- **GPT-4**: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- **GPT-3.5-turbo**: ~$0.0015 per 1K input tokens, ~$0.002 per 1K output tokens
- **Monitor Usage**: Check at https://platform.openai.com/usage

**Tips to Reduce Costs:**
- Use GPT-3.5-turbo for simple tasks
- Set usage limits in OpenAI dashboard
- Monitor your usage regularly

## Alternative: Using Cursor's Default Models

If you prefer not to use OpenAI:
- Cursor has built-in models that don't require API keys
- These may have usage limits but are free
- Check Cursor settings for "Default" or "Cursor" provider options

## Additional Resources

- **OpenAI API Docs**: https://platform.openai.com/docs
- **OpenAI Status**: https://status.openai.com/
- **Cursor Documentation**: Check Cursor's help menu
- **Community Support**: Cursor Discord or forums

---

**Note**: This configuration is for Cursor IDE's AI features. For your MediBridge24x7 project's OpenAI integration, see `OPENAI_SETUP.md`.


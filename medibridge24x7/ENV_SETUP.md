# Environment Variables Setup Guide

This guide will help you set up your `.env` file for the MediBridge24x7 project.

## Quick Setup

1. **Create `.env` file** in the `medibridge24x7` directory
2. **Copy the template below** into your `.env` file
3. **Fill in your actual values** (see instructions below)

## Environment Variables Template

Create a file named `.env` in the `medibridge24x7` directory with this content:

```env
# Supabase Configuration (Required)
# Get these from your Supabase project settings: https://app.supabase.com/project/_/settings/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# OpenAI Configuration (Optional - for AI chat features)
# Get your API key from: https://platform.openai.com/api-keys
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

## How to Get Your Values

### Supabase Credentials (Required)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_ANON_KEY`

### OpenAI API Key (Optional)

1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-`)
5. Paste it as `VITE_OPENAI_API_KEY`

## Important Notes

⚠️ **Security:**
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- Keep your API keys secret and secure

✅ **After Setup:**
- Restart your development server (`npm run dev`)
- The app will automatically load these environment variables

## Verification

After creating your `.env` file:

1. **Check Supabase Connection:**
   - Start the dev server: `npm run dev`
   - Try logging in - if it works, Supabase is configured ✅

2. **Check OpenAI Connection:**
   - Log in as admin
   - Go to Admin Dashboard → Organizations
   - Enable "AI Features Enabled" for an organization
   - Create a chat session - AI responses should appear ✅

## Troubleshooting

### Variables Not Loading

- Ensure `.env` file is in `medibridge24x7` directory (not root)
- Variable names must start with `VITE_` for Vite to expose them
- Restart dev server after creating/modifying `.env`

### Supabase Errors

- Verify URL format: `https://xxxxx.supabase.co`
- Check that anon key is complete (should be long JWT token)
- Ensure Supabase project is active

### OpenAI Not Working

- Verify API key starts with `sk-`
- Check OpenAI account has credits/quota
- Ensure "AI Features Enabled" is checked in organization settings
- See `OPENAI_SETUP.md` for detailed troubleshooting


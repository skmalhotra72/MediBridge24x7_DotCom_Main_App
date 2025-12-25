# Where to Add Your OpenAI API Key

## 🎯 Two Places to Add Your OpenAI API Key

### 1️⃣ **For Your Project (MediBridge24x7 App)**

**File Location:** `medibridge24x7/.env`

**Steps:**
1. Open the file: `medibridge24x7/.env` in your editor
2. Find this line:
   ```env
   VITE_OPENAI_API_KEY=
   ```
3. Add your API key after the `=` sign:
   ```env
   VITE_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```
4. Save the file
5. Restart your dev server (`npm run dev`)

**Example of complete .env file:**
```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration (Optional - for AI chat features)
VITE_OPENAI_API_KEY=sk-proj-abc123xyz789yourkeyhere
```

**What this does:**
- Enables AI chat features in your MediBridge24x7 application
- Allows the app to generate AI responses in chat sessions
- Used by `src/lib/openaiClient.ts`

---

### 2️⃣ **For Cursor IDE (AI Assistant)**

**Location:** Cursor IDE Settings

**Steps:**

#### Method A: Using Settings UI
1. Press `Ctrl+,` (or `Cmd+,` on Mac) to open Settings
2. In the search bar, type: `cursor ai` or `model`
3. Find **"Cursor: Model Provider"** or **"AI Provider"**
4. Select **"OpenAI"** from dropdown
5. Find **"Cursor: API Key"** or **"OpenAI API Key"**
6. Paste your API key: `sk-proj-your-actual-api-key-here`
7. (Optional) Select model: `gpt-4`, `gpt-4-turbo`, or `gpt-3.5-turbo`
8. Settings auto-save

#### Method B: Using Settings JSON
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `Preferences: Open User Settings (JSON)`
3. Add these lines:
   ```json
   {
     "cursor.aiProvider": "openai",
     "cursor.openaiApiKey": "sk-proj-your-actual-api-key-here",
     "cursor.model": "gpt-4"
   }
   ```
4. Save the file

**What this does:**
- Enables OpenAI-powered AI assistance in Cursor IDE
- Powers code completion, chat, and suggestions
- Used by Cursor's built-in AI features

---

## 🔑 Getting Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Give it a name (e.g., "MediBridge24x7" or "Cursor IDE")
5. **Copy the key immediately** (you won't see it again!)
6. It starts with `sk-` or `sk-proj-`

---

## ✅ Quick Checklist

- [ ] Got API key from https://platform.openai.com/api-keys
- [ ] Added to `.env` file for project: `VITE_OPENAI_API_KEY=sk-...`
- [ ] Added to Cursor Settings for IDE (optional but recommended)
- [ ] Restarted dev server after adding to `.env`
- [ ] Tested project AI features (create chat session)
- [ ] Tested Cursor AI (press `Ctrl+L` for chat)

---

## 🆘 Troubleshooting

### Project Not Using API Key?
- ✅ Check `.env` file is in `medibridge24x7` folder (not root)
- ✅ Variable name must be exactly `VITE_OPENAI_API_KEY`
- ✅ Restart dev server after adding key
- ✅ Check browser console for errors

### Cursor IDE Not Using API Key?
- ✅ Check Settings → search for "cursor" or "ai"
- ✅ Verify JSON syntax if using JSON method
- ✅ Restart Cursor IDE
- ✅ Check API key starts with `sk-`

---

## 📝 Summary

| Purpose | Location | Variable Name |
|---------|----------|---------------|
| **Project AI Features** | `medibridge24x7/.env` | `VITE_OPENAI_API_KEY` |
| **Cursor IDE AI** | Cursor Settings | `cursor.openaiApiKey` |

**You can use the same API key for both!** Just copy it to both places.



































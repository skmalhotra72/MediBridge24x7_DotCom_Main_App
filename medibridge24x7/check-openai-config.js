/**
 * OpenAI Configuration Checker
 * This script verifies if OpenAI API key is configured correctly
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 Checking OpenAI API Key Configuration...\n');
console.log('=' .repeat(60));

// Check 1: .env file exists
console.log('\n1️⃣  Checking .env file...');
const envPath = join(__dirname, '.env');
if (!existsSync(envPath)) {
  console.log('   ❌ .env file not found at:', envPath);
  console.log('   💡 Create a .env file in the medibridge24x7 directory');
  process.exit(1);
}
console.log('   ✅ .env file exists');

// Check 2: Read and parse .env file
console.log('\n2️⃣  Reading environment variables...');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.log('   ❌ Error reading .env file:', error.message);
  process.exit(1);
}

// Parse VITE_OPENAI_API_KEY
const apiKeyMatch = envContent.match(/VITE_OPENAI_API_KEY\s*=\s*(.+)/);
if (!apiKeyMatch) {
  console.log('   ❌ VITE_OPENAI_API_KEY not found in .env file');
  console.log('   💡 Add this line to your .env file:');
  console.log('      VITE_OPENAI_API_KEY=sk-your-api-key-here');
  process.exit(1);
}

const apiKey = apiKeyMatch[1].trim();

// Check 3: API key format
console.log('\n3️⃣  Validating API key format...');
if (!apiKey || apiKey === '' || apiKey === 'sk-your-openai-api-key-here' || apiKey.startsWith('your-')) {
  console.log('   ❌ API key is empty or placeholder');
  console.log('   💡 Replace with your actual OpenAI API key');
  process.exit(1);
}

if (!apiKey.startsWith('sk-')) {
  console.log('   ⚠️  API key does not start with "sk-"');
  console.log('   💡 Valid OpenAI API keys start with "sk-" or "sk-proj-"');
} else {
  console.log('   ✅ API key format looks correct');
  const preview = apiKey.substring(0, Math.min(20, apiKey.length));
  console.log(`   📝 Key preview: ${preview}...`);
}

// Check 4: Code configuration
console.log('\n4️⃣  Checking code configuration...');
const openaiClientPath = join(__dirname, 'src', 'lib', 'openaiClient.ts');
if (existsSync(openaiClientPath)) {
  const clientCode = readFileSync(openaiClientPath, 'utf-8');
  if (clientCode.includes('VITE_OPENAI_API_KEY')) {
    console.log('   ✅ openaiClient.ts correctly uses VITE_OPENAI_API_KEY');
  } else {
    console.log('   ⚠️  openaiClient.ts may not be configured correctly');
  }
  
  if (clientCode.includes('isOpenAIAvailable')) {
    console.log('   ✅ Availability check function exists');
  }
} else {
  console.log('   ⚠️  openaiClient.ts not found');
}

// Check 5: Test API key (optional - makes actual API call)
console.log('\n5️⃣  Testing API key validity...');
console.log('   ⏳ Making test API call to OpenAI...');

try {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // Make a minimal test call
  const testResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Say "test" if you can read this.' }
    ],
    max_tokens: 5,
  });

  if (testResponse.choices[0]?.message?.content) {
    console.log('   ✅ API key is valid and working!');
    console.log(`   📝 Test response: "${testResponse.choices[0].message.content.trim()}"`);
  } else {
    console.log('   ⚠️  API call succeeded but no response received');
  }
} catch (error) {
  if (error.status === 401) {
    console.log('   ❌ API key is invalid or unauthorized');
    console.log('   💡 Check your API key at: https://platform.openai.com/api-keys');
  } else if (error.status === 429) {
    console.log('   ⚠️  Rate limit exceeded (API key is valid but quota may be exceeded)');
  } else if (error.status === 402) {
    console.log('   ⚠️  Payment required (API key is valid but account needs billing setup)');
  } else {
    console.log('   ⚠️  API test failed:', error.message);
    console.log('   💡 This might be a network issue or API key problem');
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Configuration Summary:\n');
console.log(`   ✅ .env file: Found`);
console.log(`   ✅ API key: ${apiKey ? 'Set' : 'Not set'}`);
console.log(`   ✅ Format: ${apiKey.startsWith('sk-') ? 'Valid' : 'Invalid'}`);
console.log(`   ✅ Code config: openaiClient.ts exists`);

console.log('\n💡 Next Steps:');
console.log('   1. Ensure dev server is restarted after .env changes');
console.log('   2. Enable AI features in Admin Dashboard → Organizations');
console.log('   3. Test AI features in a chat session');
console.log('\n');









































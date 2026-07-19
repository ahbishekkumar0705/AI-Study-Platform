import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const testGemini = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'None');

  try {
    const ai = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });
    
    // Try text-embedding-004
    console.log('\n--- Testing text-embedding-004 ---');
    try {
      const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent('Hello world');
      console.log('✅ text-embedding-004 success! Vector length:', result.embedding.values.length);
    } catch (err) {
      console.error('❌ text-embedding-004 failed:', err.message);
    }

    // Try embedding-001 (legacy fallback)
    console.log('\n--- Testing embedding-001 ---');
    try {
      const model = ai.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent('Hello world');
      console.log('✅ embedding-001 success! Vector length:', result.embedding.values.length);
    } catch (err) {
      console.error('❌ embedding-001 failed:', err.message);
    }

    // Try gemini-2.5-flash content generation
    console.log('\n--- Testing gemini-2.5-flash ---');
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent('Say hello in one word');
      console.log('✅ gemini-2.5-flash success! Response:', result.response.text().trim());
    } catch (err) {
      console.error('❌ gemini-2.5-flash failed:', err.message);
    }

  } catch (e) {
    console.error('Test script error:', e.message);
  }
};

testGemini();

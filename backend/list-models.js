import dotenv from 'dotenv';

dotenv.config();

const listModels = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    console.log('Sending request to Google API...');
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log('\n=== AVAILABLE MODELS ===');
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- ${m.name} (${m.displayName})`);
        console.log(`  Supported Actions: ${m.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Failed to list models:', err.message);
  }
};

listModels();

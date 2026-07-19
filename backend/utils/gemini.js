import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance = null;

const getGenAI = () => {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
};

/**
 * Generate embedding vector for a text string.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export const getEmbedding = async (text) => {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error(`Gemini Embedding Error: ${error.message}`);
    throw error;
  }
};

/**
 * Generate embedding vectors for an array of texts in batches.
 * @param {string[]} texts 
 * @returns {Promise<number[][]>}
 */
export const getEmbeddingsBatch = async (texts) => {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-embedding-2' });
    
    const embeddings = [];
    const batchSize = 10; // 10 requests per batch. With 7s delay, keeps us around ~80 requests/minute (safe under 100 RPM limit)
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      let result;
      let retries = 0;
      const maxRetries = 5;
      
      while (retries < maxRetries) {
        try {
          result = await model.batchEmbedContents({
            requests: batch.map(text => ({
              content: { parts: [{ text }] }
            }))
          });
          break; // Succeeded! Break out of the retry loop
        } catch (err) {
          retries++;
          if (retries >= maxRetries) {
            throw err; // All retries failed, throw error
          }
          console.warn(`[Gemini Embedding] 429 Rate Limit hit. Retrying batch in 15 seconds (Attempt ${retries}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      embeddings.push(...result.embeddings.map(e => e.values));
      
      // Add a 7-second delay between batches to stay under 100 RPM limit
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 7000));
      }
    }
    
    return embeddings;
  } catch (error) {
    console.error(`Gemini Batch Embedding Error: ${error.message}`);
    throw error;
  }
};

/**
 * Generate structural or textual content using gemini-2.5-flash.
 * @param {string} prompt 
 * @param {string} systemInstruction 
 * @param {boolean} jsonMode - whether to return JSON output
 * @returns {Promise<string>}
 */
export const generateContent = async (prompt, systemInstruction = '', jsonMode = false) => {
  try {
    const ai = getGenAI();
    const modelOptions = { model: 'gemini-2.5-flash' };
    
    if (systemInstruction) {
      modelOptions.systemInstruction = systemInstruction;
    }
    
    const model = ai.getGenerativeModel(modelOptions);
    
    const generationConfig = {};
    if (jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig
    });
    
    return result.response.text();
  } catch (error) {
    console.error(`Gemini Generation Error: ${error.message}`);
    throw error;
  }
};

import Embedding from '../models/Embedding.js';
import { getEmbedding } from './gemini.js';

const dotProduct = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
};

const magnitude = (a) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * a[i];
  }
  return Math.sqrt(sum);
};

export const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) return 0;
  const dot = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};

/**
 * Searches the database for vector chunks matching the query string within a specific file.
 * 
 * @param {string} query 
 * @param {string} fileId 
 * @param {number} topK 
 * @returns {Promise<Array<{ text: string, similarity: number, chunkIndex: number }>>}
 */
export const searchEmbeddings = async (query, fileId, topK = 5) => {
  try {
    // 1. Get embedding for query
    const queryEmbedding = await getEmbedding(query);
    
    // 2. Fetch all embeddings for the file
    const fileEmbeddings = await Embedding.find({ file: fileId });
    if (!fileEmbeddings || fileEmbeddings.length === 0) {
      return [];
    }
    
    // 3. Compute cosine similarity in memory
    const results = fileEmbeddings.map((emb) => {
      const similarity = cosineSimilarity(queryEmbedding, emb.embedding);
      return {
        text: emb.text,
        chunkIndex: emb.chunkIndex,
        similarity,
      };
    });
    
    // 4. Sort and slice topK
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  } catch (error) {
    console.error(`Vector search error: ${error.message}`);
    throw error;
  }
};

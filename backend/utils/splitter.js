/**
 * Splits text into overlapping chunks recursively or by character markers.
 * Good for building search contexts.
 * 
 * @param {string} text 
 * @param {number} chunkSize 
 * @param {number} chunkOverlap 
 * @returns {string[]}
 */
export const splitText = (text, chunkSize = 1000, chunkOverlap = 200) => {
  if (!text) return [];
  
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      // Find a clean boundary (newline or space) near the end of the chunk size
      const limit = Math.max(startIndex, endIndex - 150);
      const searchArea = text.substring(limit, endIndex);
      
      const lastNewline = searchArea.lastIndexOf('\n');
      if (lastNewline !== -1) {
        endIndex = limit + lastNewline + 1; // split after newline
      } else {
        const lastSpace = searchArea.lastIndexOf(' ');
        if (lastSpace !== -1) {
          endIndex = limit + lastSpace + 1; // split after space
        }
      }
    }
    
    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    
    // Advance start index, adjusting for overlap
    const nextStart = endIndex - chunkOverlap;
    if (nextStart >= text.length || nextStart <= startIndex) {
      break;
    }
    startIndex = nextStart;
  }
  
  return chunks;
};

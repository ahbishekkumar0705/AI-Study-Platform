import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';

const parsePdf = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdfParse(fileBuffer);
    return {
      text: data.text || '',
      numPages: data.numpages || 1,
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

const parseDocx = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    // Mammoth parses DOCX text, we can estimate pages by character/word count (roughly 400 words per page)
    const text = result.value || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const numPages = Math.max(1, Math.ceil(wordCount / 400));
    return { text, numPages };
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
};

const parsePptx = (filePath) => {
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    
    // Find all slide entries
    const slideEntries = zipEntries
      .filter((entry) => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/\d+/) || [0]);
        const numB = parseInt(b.entryName.match(/\d+/) || [0]);
        return numA - numB;
      });

    let fullText = '';
    for (let i = 0; i < slideEntries.length; i++) {
      const entry = slideEntries[i];
      const content = entry.getData().toString('utf8');
      // Extract XML node contents of <a:t> text tags
      const matches = content.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
      const slideText = matches
        .map((m) => m.replace(/<\/?a:t>/g, '').trim())
        .filter(Boolean)
        .join(' ');
      if (slideText) {
        fullText += `[Slide ${i + 1}] ${slideText}\n\n`;
      }
    }
    
    return {
      text: fullText || 'Empty Presentation',
      numPages: Math.max(1, slideEntries.length),
    };
  } catch (error) {
    throw new Error(`PPTX parsing failed: ${error.message}`);
  }
};

const parseTxt = (filePath) => {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const numPages = Math.max(1, Math.ceil(wordCount / 500)); // Roughly 500 words per page for text files
    return { text, numPages };
  } catch (error) {
    throw new Error(`TXT parsing failed: ${error.message}`);
  }
};

export const parseFile = async (filePath, fileType) => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return await parsePdf(filePath);
    case 'docx':
      return await parseDocx(filePath);
    case 'pptx':
      return parsePptx(filePath);
    case 'txt':
      return parseTxt(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

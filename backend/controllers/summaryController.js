import File from '../models/File.js';
import Embedding from '../models/Embedding.js';
import { generateContent } from '../utils/gemini.js';
import PDFDocument from 'pdfkit';

// @desc    Generate summary from document text using Gemini
// @route   POST /api/summaries/generate
// @access  Private
export const generateSummary = async (req, res) => {
  const { fileId } = req.body;
  if (!fileId) {
    return res.status(400).json({ success: false, message: 'fileId is required' });
  }

  try {
    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (file.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `File is currently in status: ${file.status}. Please wait until completed.`,
      });
    }

    // Return cached summary if already generated
    if (file.summary) {
      return res.status(200).json({ success: true, summary: file.summary });
    }

    // Retrieve all chunks associated with this file to rebuild text
    const chunks = await Embedding.find({ file: fileId }).sort({ chunkIndex: 1 });
    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ success: false, message: 'No content found for this file.' });
    }

    const fullText = chunks.map((c) => c.text).join('\n ');
    console.log(`[Summary Generation] Rebuilding text for file ${file.name} (${fullText.length} chars)`);

    const systemInstruction = `You are an expert academic advisor. Your task is to analyze the provided study text and generate a comprehensive study aid package in structured JSON format. 
    
    The JSON structure must match this exact format:
    {
      "chapterSummary": "A concise paragraph summarizing the entire document.",
      "bulletNotes": ["Key point 1", "Key point 2", "Key point 3"],
      "definitions": [{"term": "Term Name", "definition": "Clear description"}],
      "formulas": [{"formula": "Equation/Formula", "description": "Variables or application context"}],
      "shortNotes": "A brief summary of core takeaways.",
      "longNotes": "A detailed, elaborate walkthrough of the subject matter.",
      "revisionNotes": "A quick-reference cheat sheet for exams.",
      "mindMap": "Text-based tree mapping of the concepts (e.g. using indentation and hyphens)."
    }
    
    Ensure all fields contain rich, detailed study content extracted from the text. If some parts (like formulas) do not apply to this specific document, return an empty array for that field. Return ONLY the raw JSON.`;

    const prompt = `Here is the full text of the document:
    ---
    ${fullText.substring(0, 80000)} // truncate to fit if extremely large, but 80k is plenty
    ---
    
    Analyze the text above and generate the study aid JSON.`;

    console.log(`[Summary Generation] Requesting Gemini summary generation...`);
    const responseJsonText = await generateContent(prompt, systemInstruction, true);
    
    let summaryData;
    try {
      summaryData = JSON.parse(responseJsonText);
    } catch (parseErr) {
      console.error(`Failed to parse Gemini summary JSON:`, responseJsonText);
      throw new Error('AI generated content was not in valid JSON format. Please retry.');
    }

    // Save summary in file document
    file.summary = summaryData;
    await file.save();

    res.status(200).json({ success: true, summary: summaryData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get generated summary
// @route   GET /api/summaries/file/:fileId
// @access  Private
export const getSummary = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (!file.summary) {
      return res.status(404).json({ success: false, message: 'Summary not generated yet for this file' });
    }

    res.status(200).json({ success: true, summary: file.summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export generated summary as PDF
// @route   GET /api/summaries/file/:fileId/pdf
// @access  Private
export const exportSummaryPDF = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.fileId, user: req.user._id });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    if (!file.summary) {
      return res.status(400).json({ success: false, message: 'Generate the summary first before exporting.' });
    }

    const { chapterSummary, bulletNotes, definitions, formulas, shortNotes, longNotes, revisionNotes, mindMap } = file.summary;

    // Create a PDF Document
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/\.[^/.]+$/, '')}_study_summary.pdf"`);

    doc.pipe(res);

    // Document Title
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1A56DB').text('AI Study Companion Summary', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#4B5563').text(`Document: ${file.name}`, { align: 'center' });
    doc.moveDown(1.5);

    // Divider Line
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#E5E7EB').stroke();
    doc.moveDown(1.5);

    // 1. Chapter Summary
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('1. Chapter Summary');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#374151').text(chapterSummary || 'No summary available.', { align: 'justify', lineGap: 4 });
    doc.moveDown(1.5);

    // 2. Key Points / Bullet Notes
    if (bulletNotes && bulletNotes.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('2. Key takeaways');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      bulletNotes.forEach((note) => {
        doc.text(`•  ${note}`, { paragraphGap: 6, lineGap: 2 });
      });
      doc.moveDown(1.5);
    }

    // 3. Important Definitions
    if (definitions && definitions.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('3. Key Definitions');
      doc.moveDown(0.5);
      definitions.forEach((def) => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1A56DB').text(`${def.term}: `, { continued: true });
        doc.font('Helvetica').fillColor('#374151').text(def.definition, { paragraphGap: 6 });
      });
      doc.moveDown(1.5);
    }

    // 4. Important Formulas
    if (formulas && formulas.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('4. Important Formulas');
      doc.moveDown(0.5);
      formulas.forEach((form) => {
        doc.fontSize(11).font('Courier-Bold').fillColor('#B45309').text(`  ${form.formula}  `, { continued: true });
        doc.font('Helvetica').fillColor('#374151').text(` - ${form.description}`, { paragraphGap: 6 });
      });
      doc.moveDown(1.5);
    }

    // 5. Short Notes & Revision Notes
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('5. Short Notes & Quick Revision');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#374151').text(shortNotes || 'No notes available.', { lineGap: 3 });
    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Oblique').fillColor('#4B5563').text(`Revision Guide: ${revisionNotes || 'N/A'}`, { lineGap: 3 });
    doc.moveDown(1.5);

    // 6. Mind Map (Text format)
    if (mindMap) {
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1F2937').text('6. Conceptual Mind Map');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Courier').fillColor('#059669').text(mindMap, { lineGap: 4 });
      doc.moveDown(1.5);
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#9CA3AF').text(`Generated dynamically by AI Study Platform - Page ${i + 1} of ${pages.count}`, 50, 750, { align: 'center' });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

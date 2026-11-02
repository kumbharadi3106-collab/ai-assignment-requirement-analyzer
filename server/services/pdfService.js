const pdfParse = require('pdf-parse');

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);

    if (!data || !data.text) {
      throw new Error('Could not extract text from PDF');
    }

    const text = data.text.trim();

    if (text.length === 0) {
      throw new Error('The PDF appears to be empty or contains no extractable text. It may be a scanned image PDF.');
    }

    if (text.length < 50) {
      throw new Error('The PDF contains very little text. Please ensure it is a text-based PDF, not a scanned image.');
    }

    return {
      text,
      pages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    if (error.message.includes('extractable text') || error.message.includes('very little text')) {
      throw error;
    }
    if (error.message.includes('Invalid PDF')) {
      throw new Error('The uploaded file is not a valid PDF. Please upload a proper PDF document.');
    }
    throw new Error(`Failed to read PDF: ${error.message}`);
  }
}

module.exports = { extractTextFromPDF };
